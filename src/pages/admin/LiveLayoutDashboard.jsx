import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line } from "react-konva";
import { Icon } from "@iconify/react";
import { apiService } from "../../services/api";
import { initSocket } from "../../services/socket";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import config from "../../config/config";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${config.api.baseURL}${path}`;
};

// Custom hook to load images onto Konva canvas
const useImage = (url) => {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.src = url;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      setImage(img);
    };
  }, [url]);
  return [image];
};

const FloorPlan = ({ image }) => {
  return image ? <KonvaImage image={image} /> : null;
};

// Colors matching prompt requirements
const STATUS_COLORS = {
  vacant: { fill: "rgba(34, 197, 94, 0.25)", stroke: "#22c55e", text: "Vacant", class: "bg-green-500", textClass: "text-green-400" },      // Green
  occupied: { fill: "rgba(239, 68, 68, 0.25)", stroke: "#ef4444", text: "Occupied", class: "bg-red-500", textClass: "text-red-400" },     // Red
  reserved: { fill: "rgba(249, 115, 22, 0.25)", stroke: "#f97316", text: "Reserved", class: "bg-orange-500", textClass: "text-orange-400" }, // Orange
  maintenance: { fill: "rgba(59, 130, 246, 0.25)", stroke: "#3b82f6", text: "Maintenance", class: "bg-blue-500", textClass: "text-blue-400" }, // Blue
  offline: { fill: "rgba(107, 114, 128, 0.25)", stroke: "#6b7280", text: "Offline", class: "bg-gray-500", textClass: "text-gray-400" }     // Grey
};

export default function LiveLayoutDashboard() {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [slots, setSlots] = useState([]); // [{ _id, x, y, width, height, rotation, status, space_id, space_name, space_ip, last_updated, zone_name }]
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  // Interaction state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isGraphicsMode, setIsGraphicsMode] = useState(true);
  const [showDrawing, setShowDrawing] = useState(true);

  const stageRef = useRef(null);
  const containerRef = useRef(null);

  const bgUrl = selectedLayout ? getImageUrl(selectedLayout.imageUrl) : "";
  const [bgImage] = useImage(bgUrl);

  useEffect(() => {
    fetchLayouts();
  }, []);

  // Handle container resizing to dynamically adjust Konva stage width/height
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    handleResize();
    const timer = setTimeout(handleResize, 150); // Small delay to let rendering settle

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [isMaximized]);

  const fitImageToStage = (img) => {
    if (!img || !containerRef.current) return;
    
    const stageWidth = dimensions.width;
    const stageHeight = dimensions.height;
    const imageWidth = img.width;
    const imageHeight = img.height;
    
    if (imageWidth === 0 || imageHeight === 0) return;
    
    // Calculate scale to fit image on stage with 20px padding
    const padding = 20;
    const scaleX = (stageWidth - padding * 2) / imageWidth;
    const scaleY = (stageHeight - padding * 2) / imageHeight;
    const newScale = Math.min(scaleX, scaleY);
    
    // Center the image
    const newX = (stageWidth - imageWidth * newScale) / 2;
    const newY = (stageHeight - imageHeight * newScale) / 2;
    
    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    if (bgImage) {
      fitImageToStage(bgImage);
    }
  }, [bgImage, dimensions.width, dimensions.height]);

  useEffect(() => {
    if (selectedLayout) {
      fetchLayoutSlots(selectedLayout._id);
    } else {
      setSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedLayout]);

  // Setup Socket.IO real-time event listeners
  useEffect(() => {
    const socket = initSocket();
    if (socket) {
      // 1. Listen for sensor occupancy changes
      socket.on("spaceUpdate", (data) => {
        // data: { space_id, device_occupied }
        setSlots(prevSlots => {
          return prevSlots.map(slot => {
            if (slot.space_id === parseInt(data.space_id)) {
              const isOccupied = data.device_occupied == 1 || data.device_occupied === true || data.device_occupied === "1";
              
              // Skip updating status if slot is reserved or maintained, but allow offline slots to transition to online
              let newStatus = slot.status;
              if (slot.status !== "maintenance" && slot.status !== "reserved") {
                newStatus = isOccupied ? "occupied" : "vacant";
              }

              const updatedSlot = {
                ...slot,
                status: newStatus,
                last_updated: new Date().toISOString()
              };

              // Update selected slot modal details dynamically if it is the active one
              if (selectedSlot && selectedSlot.space_id === slot.space_id) {
                setSelectedSlot(updatedSlot);
              }

              return updatedSlot;
            }
            return slot;
          });
        });
      });

      // 2. Listen for administrative status updates (reserved, maintained) from Manage Slots
      socket.on("slotStatusUpdate", (data) => {
        // data: { zone_id, slot_name, is_reserved, is_maintained }
        setSlots(prevSlots => {
          return prevSlots.map(slot => {
            if (slot.zoneId === data.zone_id && slot.space_name === data.slot_name) {
              let newStatus = "vacant";
              if (slot.status === "offline") {
                newStatus = "offline";
              } else if (data.is_maintained) {
                newStatus = "maintenance";
              } else if (data.is_reserved) {
                newStatus = "reserved";
              } else {
                // Restore vacant/occupied state
                newStatus = slot.status === "occupied" ? "occupied" : "vacant";
              }

              const updatedSlot = {
                ...slot,
                status: newStatus
              };

              if (selectedSlot && selectedSlot._id === slot._id) {
                setSelectedSlot(updatedSlot);
              }

              return updatedSlot;
            }
            return slot;
          });
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("spaceUpdate");
        socket.off("slotStatusUpdate");
      }
    };
  }, [selectedSlot]);

  const fetchLayouts = async () => {
    setLoading(true);
    try {
      const res = await apiService.get("/api/layouts");
      setLayouts(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedLayout(res.data[0]); // Select first layout by default
      }
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to fetch layouts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLayoutSlots = async (layoutId) => {
    setLoading(true);
    try {
      const res = await apiService.get(`/api/layouts/${layoutId}/slots`);
      setSlots(res.data || []);
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to load layout slots.");
    } finally {
      setLoading(false);
    }
  };

  // Zooming stage handler
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 5));

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Zoom Buttons
  const handleZoom = (factor) => {
    setScale(prev => Math.max(0.1, Math.min(prev * factor, 5)));
  };

  // Full Screen Mode toggle
  const handleFullscreenToggle = () => {
    const element = containerRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => {
          console.error("Fullscreen API Error:", err);
          showErrorToast("Failed to enter fullscreen.");
        });
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Filter & Search slots logic
  const filteredSlots = slots.filter(slot => {
    // Search query matches Space ID or space name
    const spaceIdStr = slot.space_id?.toString() || "";
    const spaceName = slot.space_name?.toLowerCase() || "";
    const matchesSearch = spaceIdStr.includes(searchQuery) || spaceName.includes(searchQuery.toLowerCase());

    // Status filter matches
    const matchesStatus = statusFilter === "all" || slot.status === statusFilter;

    // Zone filter matches
    const matchesZone = zoneFilter === "all" || slot.zone_name === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
  });

  // Unique Zones list from slots for selector dropdown
  const uniqueZones = Array.from(new Set(slots.map(s => s.zone_name).filter(Boolean)));

  // Calculate live summary metrics for mapped slots
  const metrics = {
    total: slots.length,
    occupied: slots.filter(s => s.status === "occupied").length,
    vacant: slots.filter(s => s.status === "vacant").length,
    reserved: slots.filter(s => s.status === "reserved").length,
    maintenance: slots.filter(s => s.status === "maintenance").length,
    offline: slots.filter(s => s.status === "offline").length
  };

  const renderCanvasArea = () => {
    return (
      <div 
        ref={containerRef}
        className={`graphics-canvas-container relative rounded-[2.5rem] bg-[#0b0f1a] border border-white/5 shadow-2xl overflow-hidden flex items-center justify-center select-none ${isMaximized ? 'w-full h-full flex-1' : 'min-h-[600px] flex-1'}`}
      >
        {loading && (
          <div className="absolute inset-0 z-10 bg-[#0f172a]/60 backdrop-blur-sm flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {!selectedLayout ? (
          <div className="text-center p-8 py-20 flex flex-col items-center justify-center gap-4">
            <Icon icon="solar:map-point-broken" className="text-5xl text-slate-600" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active layout loaded.</p>
          </div>
        ) : (
          <div className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing">
            {isMaximized && (
              <div className="absolute top-4 left-4 right-4 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-500/10 rounded-2xl border border-green-500/20">
                    <Icon icon="solar:videocamera-record-bold-duotone" className="text-green-500 text-xl animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      Live Parking Layout
                      <span className="bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                        Full Screen
                      </span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-semibold">{selectedLayout ? `${selectedLayout.layoutName} - ${selectedLayout.parkingId?.name || ""}` : "Loading Layout..."}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => setShowDrawing(!showDrawing)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all ${showDrawing ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                    title={showDrawing ? "Hide Floor Plan Drawing" : "Show Floor Plan Drawing"}
                  >
                    <Icon icon={showDrawing ? "solar:eye-linear" : "solar:eye-closed-linear"} className="text-base" />
                    <span>Drawing</span>
                  </button>

                  <button
                    onClick={() => setIsGraphicsMode(!isGraphicsMode)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all ${isGraphicsMode ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
                    title="Toggle High-Tech Graphics Mode"
                  >
                    <Icon icon="solar:magic-stick-bold-duotone" className="text-base" />
                    <span>Graphics View</span>
                  </button>

                  <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/5">
                    <select
                      value={selectedLayout?._id || ""}
                      onChange={(e) => {
                        const selected = layouts.find(l => l._id === e.target.value);
                        setSelectedLayout(selected);
                      }}
                      className="bg-transparent border-0 py-1 px-3 text-xs font-bold text-white outline-none cursor-pointer min-w-[140px] text-center"
                    >
                      {layouts.map(l => (
                        <option key={l._id} value={l._id} className="bg-slate-900 text-left">
                          {l.layoutName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setIsMaximized(false)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <Icon icon="solar:minimize-linear" className="text-base" />
                    <span>Exit Full Screen</span>
                  </button>
                </div>
              </div>
            )}

            <Stage
              width={dimensions.width}
              height={dimensions.height}
              scaleX={scale}
              scaleY={scale}
              x={position.x}
              y={position.y}
              onWheel={handleWheel}
              draggable
              onDragEnd={(e) => {
                if (e.target === stageRef.current) {
                  setPosition({ x: e.target.x(), y: e.target.y() });
                }
              }}
              ref={stageRef}
              onClick={(e) => {
                if (e.target === e.target.getStage() || e.target.parent?.className === "Layer") {
                  setSelectedSlot(null);
                }
              }}
            >
              <Layer>
                {showDrawing && <FloorPlan image={bgImage} />}
              </Layer>

              <Layer>
                {filteredSlots.map((slot, index) => {
                  const colorConfig = STATUS_COLORS[slot.status] || STATUS_COLORS.offline;
                  const isHighlighted = selectedSlot?._id === slot._id;
                  
                  const hasPoints = slot.points && slot.points.length === 4;
                  const linePoints = hasPoints ? slot.points.flatMap(p => [p.x, p.y]) : [];
                  
                  const cx = hasPoints
                    ? (slot.points[0].x + slot.points[1].x + slot.points[2].x + slot.points[3].x) / 4
                    : slot.x + slot.width / 2;
                  const cy = hasPoints
                    ? (slot.points[0].y + slot.points[1].y + slot.points[2].y + slot.points[3].y) / 4
                    : slot.y + slot.height / 2;

                  return (
                    <Group key={slot._id}>
                      {hasPoints ? (
                        <Line
                          points={linePoints}
                          closed={true}
                          fill={colorConfig.fill}
                          stroke={isHighlighted ? "#ffffff" : colorConfig.stroke}
                          strokeWidth={isHighlighted ? 2.5 : 1}
                          shadowColor={colorConfig.stroke}
                          shadowBlur={isHighlighted ? 10 : 2}
                          shadowOpacity={0.4}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            setSelectedSlot(slot);
                          }}
                        />
                      ) : (
                        <Rect
                          x={slot.x}
                          y={slot.y}
                          width={slot.width}
                          height={slot.height}
                          rotation={slot.rotation}
                          fill={colorConfig.fill}
                          stroke={isHighlighted ? "#ffffff" : colorConfig.stroke}
                          strokeWidth={isHighlighted ? 2.5 : 1}
                          cornerRadius={4}
                          shadowColor={colorConfig.stroke}
                          shadowBlur={isHighlighted ? 10 : 2}
                          shadowOpacity={0.4}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            setSelectedSlot(slot);
                          }}
                        />
                      )}
                      <Text
                        text={slot.space_name}
                        x={cx - 50}
                        y={cy - 10}
                        width={100}
                        height={20}
                        align="center"
                        verticalAlign="middle"
                        fill="#ffffff"
                        fontSize={9}
                        fontStyle="bold"
                        listening={false}
                      />
                    </Group>
                  );
                })}
              </Layer>
            </Stage>

            <div className="absolute bottom-4 left-4 z-10 bg-[#0f172a]/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 text-[10px] font-semibold text-slate-300 flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Vacant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Maintenance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                <span>Offline</span>
              </div>
            </div>

            <div className={`absolute z-10 flex items-center gap-2 ${isMaximized ? 'top-24 right-4' : 'top-4 right-4'}`}>
              <div className="bg-[#0f172a]/90 backdrop-blur-md p-1 rounded-full border border-white/5 shadow-lg flex items-center gap-0.5">
                <button
                  onClick={() => handleZoom(1.15)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                  title="Zoom In"
                >
                  <Icon icon="solar:magnifer-zoom-in-linear" className="text-lg" />
                </button>
                <button
                  onClick={() => handleZoom(0.85)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                  title="Zoom Out"
                >
                  <Icon icon="solar:magnifer-zoom-out-linear" className="text-lg" />
                </button>
                <button
                  onClick={() => {
                    if (bgImage) {
                      fitImageToStage(bgImage);
                    } else {
                      setScale(1);
                      setPosition({ x: 0, y: 0 });
                    }
                  }}
                  className="w-8 h-8 rounded-full hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all border-l border-white/5"
                  title="Reset View"
                >
                  <Icon icon="solar:refresh-linear" className="text-lg" />
                </button>
              </div>

              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-10 h-10 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-white/5 shadow-lg hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                title={isMaximized ? "Exit Full Screen" : "Enter Full Screen"}
              >
                <Icon icon={isMaximized ? "solar:minimize-linear" : "solar:maximize-linear"} className="text-lg" />
              </button>
            </div>

            {selectedSlot && (
              <div className={`absolute z-20 w-80 p-5 rounded-3xl bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col gap-4 animate-slideIn ${isMaximized ? 'top-24 left-4' : 'top-4 left-4'}`}>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:parking-bold" className="text-indigo-400" />
                    <span className="font-bold text-white text-xs">Slot Details</span>
                  </div>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="text-slate-500 hover:text-white transition-all text-xs"
                  >
                    <Icon icon="solar:close-circle-linear" className="text-lg" />
                  </button>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">Space ID:</span>
                    <span className="font-mono text-white">{selectedSlot.space_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">Space Name:</span>
                    <span className="text-white font-bold">{selectedSlot.space_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">Zone Name:</span>
                    <span className="text-white font-bold">{selectedSlot.zone_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">Floor (Level):</span>
                    <span className="text-white">{selectedLayout?.floorId?.floor_name || "NA"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">Current Status:</span>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[selectedSlot.status]?.class}`} />
                      <span className={`font-bold ${STATUS_COLORS[selectedSlot.status]?.textClass}`}>{STATUS_COLORS[selectedSlot.status]?.text}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">Sensor IP:</span>
                    <span className="font-mono text-white">{selectedSlot.space_ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 uppercase tracking-wider font-bold">Last Updated:</span>
                    <span className="text-white">{selectedSlot.last_updated ? new Date(selectedSlot.last_updated).toLocaleTimeString() : "Never"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const maximizedContent = (
    <div className="fixed inset-0 z-[9999] bg-[#0b0f1a] p-4 flex flex-col w-screen h-screen overflow-hidden">
      <style>{`
        .graphics-canvas-container canvas:first-child {
          filter: ${isGraphicsMode ? 'invert(0.9) hue-rotate(195deg) brightness(0.65) contrast(1.5) saturate(1.8)' : 'none'};
          transition: filter 0.3s ease;
        }
      `}</style>
      {renderCanvasArea()}
    </div>
  );

  const standardContent = (
    <div className="space-y-6 pb-10">
      <style>{`
        .graphics-canvas-container canvas:first-child {
          filter: ${isGraphicsMode ? 'invert(0.9) hue-rotate(195deg) brightness(0.65) contrast(1.5) saturate(1.8)' : 'none'};
          transition: filter 0.3s ease;
        }
      `}</style>
      
      {!isMaximized && (
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded border border-green-500/20">
                <Icon icon="solar:videocamera-record-bold-duotone" className="text-green-500 text-xl animate-pulse" />
              </div>
              Live Parking Layout
            </h1>
            <p className="text-slate-500 text-xs font-medium">Real-time occupancy status visualization and layout control panel</p>
          </div>

          <div className="flex items-center gap-3 bg-[#1e293b]/40 backdrop-blur-xl p-1.5 rounded-[2rem] border border-white/5 shadow-xl">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3 pr-1">Active Layout:</label>
            <select
              value={selectedLayout?._id || ""}
              onChange={(e) => {
                const selected = layouts.find(l => l._id === e.target.value);
                setSelectedLayout(selected);
              }}
              className="bg-white/5 border border-white/5 rounded-full py-1.5 px-4 text-xs font-bold text-white outline-none cursor-pointer min-w-[150px] appearance-none text-center mr-1"
            >
              {layouts.map(l => (
                <option key={l._id} value={l._id} className="bg-slate-900 text-left">
                  {l.layoutName} ({l.parkingId?.name})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowDrawing(!showDrawing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${showDrawing ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'} mr-1`}
              title={showDrawing ? "Hide Floor Plan Drawing" : "Show Floor Plan Drawing"}
            >
              <Icon icon={showDrawing ? "solar:eye-linear" : "solar:eye-closed-linear"} className="text-sm" />
              <span>Drawing</span>
            </button>
            <button
              onClick={() => setIsGraphicsMode(!isGraphicsMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isGraphicsMode ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}
              title="Toggle High-Tech Graphics Mode"
            >
              <Icon icon="solar:magic-stick-bold-duotone" className="text-sm" />
              <span>Graphics View</span>
            </button>
          </div>
        </header>
      )}

      {!isMaximized && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
              <Icon icon="solar:parking-bold" className="text-xl" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Total Spaces</span>
              <span className="text-2xl font-bold text-white block">{metrics.total}</span>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/10">
              <Icon icon="solar:check-circle-bold" className="text-xl" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Vacant</span>
              <span className="text-2xl font-bold text-green-400 block">{metrics.vacant}</span>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/10">
              <Icon icon="solar:close-circle-bold" className="text-xl" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Occupied</span>
              <span className="text-2xl font-bold text-red-400 block">{metrics.occupied}</span>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/10">
              <Icon icon="solar:lock-keyhole-bold-duotone" className="text-xl" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Reserved</span>
              <span className="text-2xl font-bold text-orange-400 block">{metrics.reserved}</span>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
              <Icon icon="solar:settings-bold-duotone" className="text-xl" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Maintenance</span>
              <span className="text-2xl font-bold text-blue-400 block">{metrics.maintenance}</span>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-white/5 border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gray-500/10 text-gray-400 border border-gray-500/10">
              <Icon icon="solar:cloud-cross-bold" className="text-xl" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Offline</span>
              <span className="text-2xl font-bold text-gray-400 block">{metrics.offline}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-9 flex flex-col gap-4">
          {renderCanvasArea()}
        </div>

        <div className="xl:col-span-3">
          <div className="p-6 rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col gap-6 h-full">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Icon icon="solar:filter-bold-duotone" className="text-indigo-400" />
                Search & Filter
              </h2>
              <p className="text-slate-500 text-[10px] mt-1 font-medium">Quick lookup mapped slots in active layout</p>
            </div>

            <div className="flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
              <Icon icon="solar:magnifer-linear" className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search Space ID / Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-none w-full placeholder:text-slate-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter By Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer w-full"
              >
                <option value="all" className="bg-slate-900">All Statuses</option>
                <option value="vacant" className="bg-slate-900">Vacant (Green)</option>
                <option value="occupied" className="bg-slate-900">Occupied (Red)</option>
                <option value="reserved" className="bg-slate-900">Reserved (Orange)</option>
                <option value="maintenance" className="bg-slate-900">Maintenance (Blue)</option>
                <option value="offline" className="bg-slate-900">Offline (Grey)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter By Sector (Zone)</label>
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer w-full"
              >
                <option value="all" className="bg-slate-900">All Sectors</option>
                {uniqueZones.map(zone => (
                  <option key={zone} value={zone} className="bg-slate-900">{zone}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-h-[150px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between border-b border-white/5 pb-2">
                <span>Matching Slots</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 text-[9px]">{filteredSlots.length}</span>
              </label>

              <div className="flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1 space-y-1.5">
                {filteredSlots.map(slot => (
                  <div
                    key={slot._id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${selectedSlot?._id === slot._id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[slot.status]?.class}`} />
                      <div>
                        <span className="font-bold text-white text-xs block">{slot.space_name}</span>
                        <span className="text-[9px] text-slate-500 block font-mono">Zone: {slot.zone_name}</span>
                      </div>
                    </div>
                    <Icon icon="solar:alt-arrow-right-linear" className="text-slate-600 text-xs" />
                  </div>
                ))}
                {filteredSlots.length === 0 && (
                  <div className="text-center p-6 text-slate-500 text-xs italic">
                    No matching spaces found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMaximized) {
    return createPortal(maximizedContent, document.body);
  }
  return standardContent;
}
