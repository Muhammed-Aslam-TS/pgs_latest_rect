import { useState, useEffect, useRef, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line, Circle } from "react-konva";
import { Icon } from "@iconify/react";
import { apiService } from "../../services/api";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import config from "../../config/config";

const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${config.api.baseURL}${path}`;
};

const getRectanglePoints = (x, y, width, height, rotation) => {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const localPoints = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];

  return localPoints.map(p => ({
    x: Math.round(x + p.x * cos - p.y * sin),
    y: Math.round(y + p.x * sin + p.y * cos)
  }));
};

// Custom hook to load images onto Konva canvas without external dependencies
const useImage = (url) => {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.src = url;
    img.crossOrigin = "Anonymous"; // Prevent canvas tainting
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      console.error("Failed to load image at:", url);
      setImage(null);
    };
  }, [url]);
  return [image];
};

const FloorPlan = ({ url, onLoaded }) => {
  const [image] = useImage(url);
  const loadedUrlRef = useRef(null);
  useEffect(() => {
    if (image && onLoaded && loadedUrlRef.current !== url) {
      loadedUrlRef.current = url;
      onLoaded(image);
    }
  }, [image, url, onLoaded]);
  return image ? <KonvaImage image={image} /> : null;
};

export default function LayoutConfig() {
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [spaces, setSpaces] = useState([]);
  
  // Selection selectors for mapping slots
  const [selectedParking, setSelectedParking] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");

  // Create layout form inputs
  const [layoutName, setLayoutName] = useState("");
  const [formParking, setFormParking] = useState("");
  const [formFloor, setFormFloor] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  
  // Modal toggle
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Canvas layout state
  const [slots, setSlots] = useState([]); // [{ spaceId, space_name, zoneId, x, y, width, height, rotation }]
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(-1);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [bgImageSize, setBgImageSize] = useState({ width: 800, height: 600 });
  const [slotWidth, setSlotWidth] = useState(129);
  const [slotHeight, setSlotHeight] = useState(59);
  const stageRef = useRef(null);

  useEffect(() => {
    fetchLayouts();
    fetchParkings();
  }, []);

  useEffect(() => {
    if (selectedLayout) {
      fetchLayoutSlots(selectedLayout._id);
    } else {
      setSlots([]);
      setSelectedSlotIndex(-1);
    }
    setIsDrawingMode(false);
    setDrawPoints([]);
  }, [selectedLayout]);

  useEffect(() => {
    setIsDrawingMode(false);
    setDrawPoints([]);
  }, [selectedSlotIndex]);

  useEffect(() => {
    if (selectedParking) {
      fetchFloors(selectedParking);
    } else {
      setFloors([]);
      setSelectedFloor("");
      setSelectedZone("");
    }
  }, [selectedParking]);

  useEffect(() => {
    if (selectedFloor) {
      fetchZones(selectedFloor);
    } else {
      setZones([]);
      setSelectedZone("");
    }
  }, [selectedFloor]);

  useEffect(() => {
    if (selectedZone) {
      fetchSpaces(selectedZone);
    } else {
      setSpaces([]);
    }
  }, [selectedZone]);

  const fetchLayouts = async () => {
    try {
      const res = await apiService.get("/api/layouts");
      setLayouts(res.data || []);
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to fetch layouts.");
    }
  };

  const fetchParkings = async () => {
    try {
      const res = await apiService.get("/api/parkings");
      setParkings(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFloors = async (parkingId) => {
    try {
      const res = await apiService.get(`/api/floors/${parkingId}`);
      setFloors(res.data || []);
    } catch (error) {
      console.error(error);
      setFloors([]);
    }
  };

  const fetchZones = async (floorId) => {
    try {
      const res = await apiService.get(`/api/zones/${floorId}`);
      setZones(res.data || []);
    } catch (error) {
      console.error(error);
      setZones([]);
    }
  };

  const fetchSpaces = async (zoneId) => {
    try {
      const res = await apiService.get(`/api/getSpacesByZone/${zoneId}`);
      setSpaces(res.data || []);
    } catch (error) {
      console.error(error);
      setSpaces([]);
    }
  };

  const fetchLayoutSlots = async (layoutId) => {
    setLoading(true);
    try {
      const res = await apiService.get(`/api/layouts/${layoutId}/slots`);
      const fetchedSlots = res.data || [];
      const processedSlots = fetchedSlots.map(s => {
        const points = s.points && s.points.length === 4 ? s.points : getRectanglePoints(s.x, s.y, s.width, s.height, s.rotation);
        return {
          ...s,
          points
        };
      });
      setSlots(processedSlots);
      if (processedSlots.length > 0) {
        setSlotWidth(processedSlots[0].width || 129);
        setSlotHeight(processedSlots[0].height || 59);
      } else {
        setSlotWidth(129);
        setSlotHeight(59);
      }
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to load layout slots.");
    } finally {
      setLoading(false);
    }
  };

  // Image file handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create layout
  const handleCreateLayout = async (e) => {
    e.preventDefault();
    if (!layoutName || !formParking || !formFloor || !imagePreview) {
      showErrorToast("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        layoutName,
        parkingId: formParking,
        floorId: formFloor,
        image: imagePreview // Base64 encoding
      };

      const res = await apiService.post("/api/layouts", payload);
      showSuccessToast("Layout created successfully.");
      setShowAddModal(false);
      setLayoutName("");
      setFormParking("");
      setFormFloor("");
      setImageFile(null);
      setImagePreview("");
      fetchLayouts();
      if (res.data) setSelectedLayout(res.data);
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to create layout.");
    } finally {
      setLoading(false);
    }
  };

  // Delete layout
  const handleDeleteLayout = async (id) => {
    if (!window.confirm("Are you sure you want to delete this layout and all its mapped slots?")) return;
    setLoading(true);
    try {
      await apiService.delete(`/api/layouts/${id}`);
      showSuccessToast("Layout deleted successfully.");
      if (selectedLayout && selectedLayout._id === id) {
        setSelectedLayout(null);
      }
      fetchLayouts();
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to delete layout.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlots = async () => {
    if (!selectedLayout) return;
    setLoading(true);
    try {
      const payload = {
        slots: slots.map(s => ({
          zoneId: s.zoneId,
          spaceId: s.spaceId,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          rotation: s.rotation,
          points: s.points
        }))
      };
      await apiService.post(`/api/layouts/${selectedLayout._id}/slots`, payload);
      showSuccessToast("Layout mappings saved successfully!");
      fetchLayoutSlots(selectedLayout._id);
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to save layout mappings.");
    } finally {
      setLoading(false);
    }
  };

  // HTML5 Drag-and-drop handlers
  const handleDragStartSpace = (e, space) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(space));
  };

  const handleDropCanvas = (e) => {
    e.preventDefault();
    if (!selectedLayout) return;
    try {
      const spaceDataStr = e.dataTransfer.getData("text/plain");
      if (!spaceDataStr || !spaceDataStr.trim().startsWith("{")) return;
      const space = JSON.parse(spaceDataStr);

      // Check if slot already exists
      if (slots.some(s => s.spaceId === space._id)) {
        showErrorToast("This space is already mapped!");
        return;
      }

      // Calculate position relative to stage coordinate system (considering zoom & pan)
      const stage = stageRef.current;
      const rect = stage.container().getBoundingClientRect();
      const x = (e.clientX - rect.left - position.x) / scale;
      const y = (e.clientY - rect.top - position.y) / scale;

      const slotX = Math.round(x - slotWidth / 2);
      const slotY = Math.round(y - slotHeight / 2);

      const newSlot = {
        spaceId: space._id,
        space_id: space.space_id,
        space_name: space.space_name,
        zoneId: selectedZone,
        zone_name: zones.find(z => z._id === selectedZone)?.zone_name || "NA",
        x: slotX,
        y: slotY,
        width: slotWidth,
        height: slotHeight,
        rotation: 0,
        points: getRectanglePoints(slotX, slotY, slotWidth, slotHeight, 0)
      };

      setSlots(prev => [...prev, newSlot]);
      setSelectedSlotIndex(slots.length);
    } catch (error) {
      console.error(error);
    }
  };

  // Quick-add fallback if HTML5 drag and drop is not ideal
  const handleAddSpaceClick = (space) => {
    if (!selectedLayout) return;
    if (slots.some(s => s.spaceId === space._id)) {
      showErrorToast("This space is already mapped!");
      return;
    }

    // Place in center of screen
    const x = bgImageSize.width / 2 - slotWidth / 2;
    const y = bgImageSize.height / 2 - slotHeight / 2;

    const slotX = Math.round(x);
    const slotY = Math.round(y);

    const newSlot = {
      spaceId: space._id,
      space_id: space.space_id,
      space_name: space.space_name,
      zoneId: selectedZone,
      zone_name: zones.find(z => z._id === selectedZone)?.zone_name || "NA",
      x: slotX,
      y: slotY,
      width: slotWidth,
      height: slotHeight,
      rotation: 0,
      points: getRectanglePoints(slotX, slotY, slotWidth, slotHeight, 0)
    };

    setSlots(prev => [...prev, newSlot]);
    setSelectedSlotIndex(slots.length);
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
    // Constrain scale between 0.1x and 5x
    newScale = Math.max(0.1, Math.min(newScale, 5));

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleDragEndSlot = (index, e) => {
    const updatedSlots = [...slots];
    updatedSlots[index] = {
      ...updatedSlots[index],
      x: Math.round(e.target.x()),
      y: Math.round(e.target.y())
    };
    setSlots(updatedSlots);
  };

  const handleUpdateSlotProperty = (index, property, value) => {
    const updatedSlots = [...slots];
    const val = parseFloat(value) || 0;
    const s = updatedSlots[index];
    const newSlot = {
      ...s,
      [property]: val
    };
    if (["x", "y", "width", "height", "rotation"].includes(property)) {
      newSlot.points = getRectanglePoints(
        property === "x" ? val : s.x,
        property === "y" ? val : s.y,
        property === "width" ? val : s.width,
        property === "height" ? val : s.height,
        property === "rotation" ? val : s.rotation
      );
    }
    updatedSlots[index] = newSlot;
    setSlots(updatedSlots);
  };

  const handleGlobalDimensionChange = (property, value) => {
    const val = parseFloat(value) || 0;
    if (property === "width") {
      setSlotWidth(val);
      setSlots(prev => prev.map(s => {
        const newW = val;
        return {
          ...s,
          width: newW,
          points: getRectanglePoints(s.x, s.y, newW, s.height, s.rotation)
        };
      }));
    } else if (property === "height") {
      setSlotHeight(val);
      setSlots(prev => prev.map(s => {
        const newH = val;
        return {
          ...s,
          height: newH,
          points: getRectanglePoints(s.x, s.y, s.width, newH, s.rotation)
        };
      }));
    }
  };

  const handleSlotDragEnd = (index, e) => {
    e.cancelBubble = true;
    const dx = Math.round(e.target.x());
    const dy = Math.round(e.target.y());
    
    e.target.position({ x: 0, y: 0 });
    e.target.getLayer().batchDraw();

    if (dx === 0 && dy === 0) return;

    setSlots(prev => prev.map((s, idx) => {
      if (idx !== index) return s;
      const newPoints = s.points.map(p => ({
        x: p.x + dx,
        y: p.y + dy
      }));
      return {
        ...s,
        points: newPoints,
        x: s.x + dx,
        y: s.y + dy
      };
    }));
  };

  const handlePointDragMove = (slotIndex, pointIndex, e) => {
    e.cancelBubble = true;
    const newX = Math.round(e.target.x());
    const newY = Math.round(e.target.y());
    
    setSlots(prev => prev.map((s, sIdx) => {
      if (sIdx !== slotIndex) return s;
      const newPoints = [...s.points];
      newPoints[pointIndex] = { x: newX, y: newY };
      
      const xs = newPoints.map(p => p.x);
      const ys = newPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      return {
        ...s,
        points: newPoints,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }));
  };

  const handlePointDragEnd = (slotIndex, pointIndex, e) => {
    e.cancelBubble = true;
  };

  const handleDeleteSlot = (index) => {
    setSlots(prev => prev.filter((_, idx) => idx !== index));
    setSelectedSlotIndex(-1);
  };

  const handleBgLoaded = useCallback((image) => {
    setBgImageSize({ width: image.width, height: image.height });
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded border border-indigo-500/20">
              <Icon icon="solar:map-draw-linear" className="text-indigo-500 text-xl" />
            </div>
            Parking Layout Configuration
          </h1>
          <p className="text-slate-500 text-xs font-medium">Upload drawing images and map slot coordinates for real-time visualization</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Icon icon="solar:add-circle-linear" className="text-lg" />
          Add Layout Drawing
        </button>
      </header>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left column: Layout selectors */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="p-6 rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Icon icon="solar:gallery-linear" className="text-indigo-400" />
              Drawings / Layouts
            </h2>
            
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[350px] custom-scrollbar pr-1">
              {layouts.map(layout => (
                <div
                  key={layout._id}
                  onClick={() => setSelectedLayout(layout)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative group ${selectedLayout?._id === layout._id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-xs">{layout.layoutName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayout(layout._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-500 transition-all"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 flex flex-col gap-0.5">
                    <span>Vessel: {layout.parkingId?.name || "NA"}</span>
                    <span>Level: {layout.floorId?.floor_name || "NA"}</span>
                  </div>
                </div>
              ))}
              {layouts.length === 0 && (
                <div className="text-center p-6 text-slate-500 text-xs italic">
                  No layouts configured.
                </div>
              )}
            </div>
          </div>

          {/* Global Slot Dimensions Card */}
          {selectedLayout && (
            <div className="p-6 rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col gap-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Icon icon="solar:settings-bold-duotone" className="text-indigo-400" />
                Global Dimensions
              </h3>
              <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
                Configure width & height dynamically for all slot markers in this layout.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Width (px)</label>
                  <input
                    type="number"
                    value={slotWidth}
                    onChange={(e) => handleGlobalDimensionChange("width", e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/5 rounded p-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Height (px)</label>
                  <input
                    type="number"
                    value={slotHeight}
                    onChange={(e) => handleGlobalDimensionChange("height", e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/5 rounded p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Slot editing panel (if active slot selected) */}
          {selectedLayout && selectedSlotIndex !== -1 && slots[selectedSlotIndex] && (
            <div className="p-6 rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="solar:pin-bold-duotone" className="text-indigo-400" />
                  Slot: {slots[selectedSlotIndex].space_name}
                </h3>
                <button
                  onClick={() => handleDeleteSlot(selectedSlotIndex)}
                  className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <Icon icon="solar:trash-bin-trash-linear" />
                  Remove
                </button>
              </div>

              <button
                onClick={() => {
                  setIsDrawingMode(true);
                  setDrawPoints([]);
                }}
                className={`w-full py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isDrawingMode ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30'}`}
              >
                <Icon icon="solar:pen-bold" className="text-sm" />
                {isDrawingMode ? 'Drawing Active...' : 'Draw Boundary on Stage'}
              </button>

              <div className="space-y-4">
                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">X Coord</label>
                    <input
                      type="number"
                      value={slots[selectedSlotIndex].x}
                      onChange={(e) => handleUpdateSlotProperty(selectedSlotIndex, "x", e.target.value)}
                      className="w-full mt-1 bg-white/5 border border-white/5 rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Y Coord</label>
                    <input
                      type="number"
                      value={slots[selectedSlotIndex].y}
                      onChange={(e) => handleUpdateSlotProperty(selectedSlotIndex, "y", e.target.value)}
                      className="w-full mt-1 bg-white/5 border border-white/5 rounded p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rotation ({slots[selectedSlotIndex].rotation}°)</label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={slots[selectedSlotIndex].rotation}
                    onChange={(e) => handleUpdateSlotProperty(selectedSlotIndex, "rotation", e.target.value)}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center column: Interactive Canvas Mapping */}
        <div className="xl:col-span-6 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-[#1e293b]/40 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/5 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {selectedLayout ? `Canvas: ${selectedLayout.layoutName}` : "Select or add a Layout to get started"}
              </span>
            </div>
            
            {selectedLayout && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="px-3 py-1.5 rounded bg-white/5 border border-white/5 hover:border-white/10 text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <Icon icon="solar:refresh-linear" />
                  Reset View
                </button>
                <button
                  onClick={handleSaveSlots}
                  className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <Icon icon="solar:diskette-linear" className="text-sm" />
                  Save Mapping ({slots.length})
                </button>
              </div>
            )}
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropCanvas}
            className="flex-1 min-h-[550px] relative rounded-[2.5rem] bg-[#0b0f1a] border border-white/5 shadow-2xl overflow-hidden flex items-center justify-center select-none"
          >
            {loading && (
              <div className="absolute inset-0 z-10 bg-[#0f172a]/60 backdrop-blur-sm flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            )}

            {selectedLayout && isDrawingMode && (
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3 rounded-2xl bg-amber-500/90 text-white shadow-xl backdrop-blur-md border border-amber-400/20 animate-fadeIn">
                <div className="flex items-center gap-2 pl-2">
                  <Icon icon="solar:info-circle-bold" className="text-lg animate-pulse" />
                  <span className="text-xs font-bold">
                    Drawing Mode: Click 4 points sequentially on the floor plan to draw boundary for slot "{slots[selectedSlotIndex]?.space_name}" ({drawPoints.length}/4 points marked)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsDrawingMode(false);
                    setDrawPoints([]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              </div>
            )}

            {!selectedLayout ? (
              <div className="text-center p-8 py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Icon icon="solar:map-point-linear" className="text-3xl text-indigo-500" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting Layout Selection...</p>
                <p className="text-slate-600 text-xs max-w-xs">Choose an existing layout from the left sidebar or upload a new floor plan image to start mapping parking slots.</p>
              </div>
            ) : (
              <div className={`w-full h-full absolute inset-0 ${isDrawingMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}>
                <Stage
                  width={stageRef.current?.container()?.offsetWidth || 700}
                  height={stageRef.current?.container()?.offsetHeight || 550}
                  scaleX={scale}
                  scaleY={scale}
                  x={position.x}
                  y={position.y}
                  onWheel={handleWheel}
                  draggable={!isDrawingMode}
                  onDragEnd={(e) => {
                    // Update stage position on drag
                    if (e.target === stageRef.current) {
                      setPosition({ x: e.target.x(), y: e.target.y() });
                    }
                  }}
                  ref={stageRef}
                  onClick={(e) => {
                    if (isDrawingMode) {
                      const stage = e.target.getStage();
                      const pointer = stage.getPointerPosition();
                      if (!pointer) return;

                      // Calculate position relative to stage scaling/panning
                      const drawX = Math.round((pointer.x - position.x) / scale);
                      const drawY = Math.round((pointer.y - position.y) / scale);

                      const newPoints = [...drawPoints, { x: drawX, y: drawY }];
                      setDrawPoints(newPoints);

                      if (newPoints.length === 4) {
                        setSlots(prev => prev.map((s, idx) => {
                          if (idx !== selectedSlotIndex) return s;

                          const xs = newPoints.map(p => p.x);
                          const ys = newPoints.map(p => p.y);
                          const minX = Math.min(...xs);
                          const minY = Math.min(...ys);
                          const maxX = Math.max(...xs);
                          const maxY = Math.max(...ys);

                          return {
                            ...s,
                            points: newPoints,
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY
                          };
                        }));

                        setIsDrawingMode(false);
                        setDrawPoints([]);
                        showSuccessToast(`Boundary drawn for slot ${slots[selectedSlotIndex].space_name}!`);
                      }
                      return;
                    }

                    // Deselect if clicking on empty stage area
                    if (e.target === e.target.getStage() || e.target.parent?.className === "Layer") {
                      setSelectedSlotIndex(-1);
                    }
                  }}
                >
                  <Layer>
                    {/* Background floor plan image */}
                    <FloorPlan url={getImageUrl(selectedLayout.imageUrl)} onLoaded={handleBgLoaded} />

                    {/* Render mapped slot markers */}
                    {slots.map((slot, index) => {
                      const hasPoints = slot.points && slot.points.length === 4;
                      const linePoints = hasPoints ? slot.points.flatMap(p => [p.x, p.y]) : [];
                      
                      const cx = hasPoints 
                        ? (slot.points[0].x + slot.points[1].x + slot.points[2].x + slot.points[3].x) / 4
                        : slot.x + slot.width / 2;
                      const cy = hasPoints
                        ? (slot.points[0].y + slot.points[1].y + slot.points[2].y + slot.points[3].y) / 4
                        : slot.y + slot.height / 2;

                      return (
                        <Group key={slot.spaceId + "_" + index}>
                          {hasPoints ? (
                            <Line
                              points={linePoints}
                              closed={true}
                              fill={selectedSlotIndex === index ? "rgba(99, 102, 241, 0.4)" : "rgba(34, 197, 94, 0.25)"}
                              stroke={selectedSlotIndex === index ? "#6366f1" : "#22c55e"}
                              strokeWidth={selectedSlotIndex === index ? 2 : 1}
                              draggable
                              onDragEnd={(e) => handleSlotDragEnd(index, e)}
                              onClick={(e) => {
                                e.cancelBubble = true;
                                setSelectedSlotIndex(index);
                              }}
                            />
                          ) : (
                            <Rect
                              x={slot.x}
                              y={slot.y}
                              width={slot.width}
                              height={slot.height}
                              rotation={slot.rotation}
                              fill={selectedSlotIndex === index ? "rgba(99, 102, 241, 0.4)" : "rgba(34, 197, 94, 0.25)"}
                              stroke={selectedSlotIndex === index ? "#6366f1" : "#22c55e"}
                              strokeWidth={selectedSlotIndex === index ? 2 : 1}
                              cornerRadius={4}
                              draggable
                              onDragEnd={(e) => handleDragEndSlot(index, e)}
                              onClick={(e) => {
                                e.cancelBubble = true;
                                setSelectedSlotIndex(index);
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

                          {selectedSlotIndex === index && hasPoints && slot.points.map((p, pIdx) => (
                            <Circle
                              key={pIdx}
                              x={p.x}
                              y={p.y}
                              radius={6}
                              fill="#818cf8"
                              stroke="#ffffff"
                              strokeWidth={2}
                              draggable
                              onDragMove={(e) => handlePointDragMove(index, pIdx, e)}
                              onDragEnd={(e) => handlePointDragEnd(index, pIdx, e)}
                              onClick={(e) => {
                                e.cancelBubble = true;
                              }}
                            />
                          ))}
                        </Group>
                      );
                    })}

                    {/* Render temporary guide lines and markers during click-to-draw */}
                    {isDrawingMode && drawPoints.length > 0 && (
                      <Group>
                        {drawPoints.length >= 2 && (
                          <Line
                            points={drawPoints.flatMap(p => [p.x, p.y])}
                            closed={false}
                            stroke="#eab308"
                            strokeWidth={2}
                            dash={[4, 4]}
                          />
                        )}
                        {drawPoints.map((p, idx) => (
                          <Circle
                            key={idx}
                            x={p.x}
                            y={p.y}
                            radius={5}
                            fill="#eab308"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                          />
                        ))}
                      </Group>
                    )}
                  </Layer>
                </Stage>

                {/* Legend overlay inside viewport */}
                <div className="absolute bottom-4 left-4 z-10 bg-[#0f172a]/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 text-[10px] font-semibold text-slate-300 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Mapping:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-green-500/30 border border-green-500" />
                    <span>Mapped Slot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-500/30 border border-indigo-500" />
                    <span>Selected Slot</span>
                  </div>
                </div>

                {/* Helper info overlay inside viewport */}
                <div className="absolute top-4 right-4 z-10 bg-[#0f172a]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[10px] text-slate-500 flex items-center gap-1">
                  <Icon icon="solar:info-circle-linear" />
                  Scroll to Zoom • Drag Canvas to Pan • Drag Slot to Move
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Space mapping selectors & Unmapped Spaces list */}
        <div className="xl:col-span-3">
          <div className="p-6 rounded-[2rem] bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 shadow-xl flex flex-col gap-5 h-full">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Icon icon="solar:square-academic-cap-linear" className="text-indigo-400" />
              Source Spaces
            </h2>

            {/* Selectors */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vessel (Parking)</label>
                <select
                  value={selectedParking}
                  onChange={(e) => setSelectedParking(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded py-2.5 px-3 text-xs text-white outline-none cursor-pointer w-full"
                >
                  <option value="" disabled className="bg-slate-900">Select Vessel</option>
                  {parkings.map(p => <option key={p._id} value={p._id} className="bg-slate-900">{p.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level (Floor)</label>
                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  disabled={!selectedParking}
                  className="bg-white/5 border border-white/5 rounded py-2.5 px-3 text-xs text-white outline-none cursor-pointer w-full disabled:opacity-50"
                >
                  <option value="" disabled className="bg-slate-900">Select Level</option>
                  {floors.map(f => <option key={f._id} value={f._id} className="bg-slate-900">{f.floor_name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sector (Zone)</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  disabled={!selectedFloor}
                  className="bg-white/5 border border-white/5 rounded py-2.5 px-3 text-xs text-white outline-none cursor-pointer w-full disabled:opacity-50"
                >
                  <option value="" disabled className="bg-slate-900">Select Sector</option>
                  {zones.map(z => <option key={z._id} value={z._id} className="bg-slate-900">{z.zone_name}</option>)}
                </select>
              </div>
            </div>

            {/* Space items list */}
            <div className="flex-1 flex flex-col gap-3 min-h-[220px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
                <span>Spaces List</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">{spaces.length}</span>
              </label>

              <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-1 space-y-2">
                {spaces.map(space => {
                  const isMapped = slots.some(s => s.spaceId === space._id);
                  return (
                    <div
                      key={space._id}
                      draggable={selectedLayout && !isMapped}
                      onDragStart={(e) => handleDragStartSpace(e, space)}
                      className={`p-3 rounded-xl border flex justify-between items-center transition-all ${isMapped ? 'bg-indigo-500/5 border-indigo-500/10 opacity-40 cursor-not-allowed' : 'bg-white/5 border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:parking-bold-duotone" className="text-indigo-400" />
                        <div>
                          <span className="font-bold text-white text-xs block">{space.space_name}</span>
                          <span className="text-[9px] text-slate-500 block font-mono">ID: {space.space_id}</span>
                        </div>
                      </div>
                      
                      {selectedLayout && !isMapped && (
                        <button
                          onClick={() => handleAddSpaceClick(space)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs"
                          title="Place in center of canvas"
                        >
                          <Icon icon="solar:add-circle-bold" className="text-lg text-indigo-500" />
                        </button>
                      )}
                      
                      {isMapped && (
                        <span className="text-[8px] bg-slate-800 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded uppercase">Mapped</span>
                      )}
                    </div>
                  );
                })}

                {selectedZone && spaces.length === 0 && (
                  <div className="text-center p-6 text-slate-500 text-xs italic">
                    No spaces configured in this zone.
                  </div>
                )}
                {!selectedZone && (
                  <div className="text-center p-6 text-slate-500 text-xs italic">
                    Select a Sector to see its spaces.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Add layout drawing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#090b11]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0f172a] rounded-[2.5rem] border border-white/5 shadow-2xl w-full max-w-lg p-8 relative flex flex-col gap-6">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-all"
            >
              <Icon icon="solar:close-circle-linear" className="text-2xl" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Icon icon="solar:add-folder-bold-duotone" className="text-indigo-500" />
                Add Layout Floor Plan
              </h2>
              <p className="text-slate-500 text-xs mt-1">Upload a layout drawing and link it to a vessel floor</p>
            </div>

            <form onSubmit={handleCreateLayout} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Layout Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ground Floor, Level 1"
                  required
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none w-full placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vessel (Parking)</label>
                  <select
                    required
                    value={formParking}
                    onChange={(e) => {
                      setFormParking(e.target.value);
                      fetchFloors(e.target.value);
                    }}
                    className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none cursor-pointer w-full"
                  >
                    <option value="" disabled className="bg-slate-900">Select Vessel</option>
                    {parkings.map(p => <option key={p._id} value={p._id} className="bg-slate-900">{p.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level (Floor)</label>
                  <select
                    required
                    value={formFloor}
                    onChange={(e) => setFormFloor(e.target.value)}
                    disabled={!formParking}
                    className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white outline-none cursor-pointer w-full disabled:opacity-50"
                  >
                    <option value="" disabled className="bg-slate-900">Select Level</option>
                    {floors.map(f => <option key={f._id} value={f._id} className="bg-slate-900">{f.floor_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drawing Drawing File</label>
                <div className="relative border border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required={!imagePreview}
                  />
                  <Icon icon="solar:upload-minimalistic-linear" className="text-3xl text-indigo-500 mx-auto mb-2" />
                  <span className="text-[11px] font-bold text-white uppercase block">Choose Plan Image</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Supports SVG, PNG, JPG</span>
                </div>
              </div>

              {imagePreview && (
                <div className="border border-white/10 rounded-2xl overflow-hidden p-2 bg-[#090b11] max-h-[160px] flex items-center justify-center">
                  <img src={imagePreview} alt="Preview" className="max-h-[140px] max-w-full object-contain" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 rounded-xl border border-white/5 hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1"
                >
                  {loading && <Icon icon="solar:restart-linear" className="animate-spin" />}
                  Create Layout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
