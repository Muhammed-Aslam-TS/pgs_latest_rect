import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "../layout/Header";
import { FloorSection } from "./FloorList";
import { ZoneSection } from "./ZoneList";
import { ApexChart } from "../common/LineChart";
import Modal from "../common/Modal";
import { Car, CheckCircle, Clock, X, Monitor } from 'lucide-react';
import MenuButton from '../common/MenuButton';

import { initSocket, getSocket } from "../../services/socket";
import { apiService, endpoints } from "../../services/api";

import { ParkingSection } from "./ParkingList";
import { DisplaySection } from "./DisplayList";
import Loader from "../common/Loader";

export const Home = () => {
  const [parkingSections, setParkingSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [flippedSection, setFlippedSection] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneSpaces, setZoneSpaces] = useState([]);
  const [activeSpaceMenu, setActiveSpaceMenu] = useState(null);
  const [showFloorZonesModal, setShowFloorZonesModal] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [blockedSpaces, setBlockedSpaces] = useState(new Set());
  const [locatingSpaces, setLocatingSpaces] = useState(new Set());
  const [displays, setDisplays] = useState([]);
  const [flippedDisplayId, setFlippedDisplayId] = useState(null);

  const headerData = useMemo(() => {
    const totalParkings = parkingSections.length;
    const totalSlots = parkingSections.reduce((acc, s) => acc + (s.total_spaces || 0), 0);
    
    // Split data into MLCP vs Basement if names match, otherwise just divide
    const mlcpSection = parkingSections.find(s => s.title?.toLowerCase().includes('mlcp')) || parkingSections[0];
    const basementSection = parkingSections.find(s => s.title?.toLowerCase().includes('basement')) || parkingSections[1];

    return {
      totalParkings,
      totalSlots,
      mlcpData: mlcpSection ? {
        occupied: Math.round((mlcpSection.occupied / mlcpSection.total_spaces) * 100) || 0,
        availability: 100 - (Math.round((mlcpSection.occupied / mlcpSection.total_spaces) * 100) || 0)
      } : { occupied: 0, availability: 100 },
      basementData: basementSection ? {
        occupied: Math.round((basementSection.occupied / basementSection.total_spaces) * 100) || 0,
        availability: 100 - (Math.round((basementSection.occupied / basementSection.total_spaces) * 100) || 0)
      } : { occupied: 0, availability: 100 }
    };
  }, [parkingSections]);

  const fetchZones = useCallback(async (floorId) => {
    try {
      const data = await apiService.get(endpoints.zones.getById(floorId));

      const mappedZones = data.data.map((zone) => ({
        _id: zone._id,
        title: zone.zone_name,
        total_spaces: zone.total_spaces,
        occupied: zone.occupied,
        free: zone.free,
        occupancy: Math.round((zone.occupied / zone.total_spaces) * 100),
      }));

      setZones(mappedZones);
    } catch (err) {
      console.error("Error fetching zones:", err);
      setZones([]);
      setError("Failed to fetch zones.");
    }
  }, []);

  const fetchFloors = useCallback(async (parkingId) => {
    try {
      const data = await apiService.get(endpoints.floors.getById(parkingId));

      const mappedFloors = data.data.map((floor) => ({
        _id: floor._id,
        title: floor.floor_name,
        total_spaces: floor.total_spaces,
        occupied: floor.occupied,
        free: floor.free,
        total_zones: floor.total_zones,
        occupancy: Math.round((floor.occupied / floor.total_spaces) * 100),
      }));

      setFloors(mappedFloors);
      if (mappedFloors.length > 0) {
        setActiveFloor(mappedFloors[0]);
        fetchZones(mappedFloors[0]._id);
      }
    } catch (err) {
      console.error("Error fetching floors:", err);
      setFloors([]);
      setError("Failed to fetch floors.");
    }
  }, [fetchZones]);

  const processData = useCallback((data) => {
    if (data?.data) {
      const mapped = data?.data?.map((section) => ({
        title: section.name,
        _id: section._id,
        total_floors: section.total_floors,
        total_spaces: section.total_spaces,
        occupied: section.total_occupied,
        available: section.total_free,
        occupancy: Math.round(
          (section.total_occupied / section.total_spaces) * 100
        ),
        isFlipped: false,
      }));
      setParkingSections(mapped);

      // Auto-select first parking on initial load
      if (!activeSection && mapped.length > 0) {
        setActiveSection(mapped[0]);
        fetchFloors(mapped[0]._id);
      }
    }
    if (data?.graphData) {
      setGraphData(data.graphData);
    }
  }, [activeSection, fetchFloors]);

  const fetchDataFromBackend = useCallback(async () => {
    try {
      const data = await apiService.get(endpoints.parking.getAll);
      processData(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Backend fetch failed:", err);
      setParkingSections([]);
      setLoading(false);
      setError("Failed to fetch parking data correctly.");
    }
  }, [processData]);

  const fetchDisplays = useCallback(async (parkingId) => {
    try {
      const data = await apiService.get(`${endpoints.displays.getAll}/${parkingId}`);
      setDisplays(data.data || []);
    } catch (err) {
      console.error("Error fetching displays:", err);
      setDisplays([]);
    }
  }, []);

  useEffect(() => {
    if (activeSection) {
      fetchDisplays(activeSection._id);
    }
  }, [activeSection, fetchDisplays]);

  useEffect(() => {
    const socket = initSocket();
    let isUsingFetch = false;

    // Add connection options and error handling
    socket.io.on("error", (error) => {
      console.error("Socket.io error:", error);
      if (!isUsingFetch) {
        isUsingFetch = true;
        fetchDataFromBackend();
      }
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`Attempting to reconnect... (Attempt ${attempt})`);
    });

    socket.io.on("reconnect", () => {
      console.log("Reconnected successfully");
      setError(null);
      // Re-request data after reconnection
      socket.emit("requestParkingData");
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      setError(null);
      console.log("Connected to server");
      socket.emit("requestParkingData");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      if (!isUsingFetch) {
        isUsingFetch = true;
        fetchDataFromBackend();
      }
    });

    // Handle initial data
    socket.on("initialData", (data) => {
      if (!isUsingFetch) {
        console.log("Received initial socket data:", data);
        processData(data);
        setLoading(false);
      }
    });

    // Handle real-time updates
    socket.on("parkingUpdate", (data) => {
      console.log("Received parking update:", data);
      processData(data);

      // Update active section and floor if they exist in new data
      if (activeSection) {
        const updatedSection = data.find(
          (section) => section.title === activeSection.title
        );
        if (updatedSection) {
          setActiveSection(updatedSection);
          if (activeFloor) {
            const updatedFloor = updatedSection.floors.find(
              (floor) => floor.title === activeFloor.title
            );
            if (updatedFloor) {
              setActiveFloor(updatedFloor);
            }
          }
        }
      }
    });

    socket.on("display", (updatedDisplay) => {
      console.log("Received real-time display update:", updatedDisplay);
      setDisplays(prev => 
        prev.map(d => d.display_id === updatedDisplay.display_id 
          ? { ...d, current_value: updatedDisplay.current_value } 
          : d
        )
      );
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("initialData");
      socket.off("parkingUpdate");
      socket.off("display");
      socket.off("connect_error");
      socket.io.off("error");
      socket.io.off("reconnect_attempt");
      socket.io.off("reconnect");
    };
  }, [activeSection, activeFloor, fetchDataFromBackend, processData]);

  // Modify click handlers to use fetch if socket is not connected
  const handleSectionSelect = (section) => {
    setActiveSection(section);
    fetchFloors(section._id); // Fetch floors when section is selected

    if (socketConnected) {
      const socket = getSocket();
      socket.emit("sectionSelect", {
        section: section.title,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleFloorSelect = (floor) => {
    setActiveFloor(floor);
    setSelectedFloor(floor);
    fetchZones(floor._id);
    setShowFloorZonesModal(true);
  };

  const handleMenuClick = (e, section) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === section._id ? null : section._id);
  };

  const handleZoneClick = async (zone) => {
    setSelectedZone(zone);
    setZoneSpaces([]); // Clear existing spaces
    setShowZoneModal(true);

    try {
        // Attempt to fetch real spaces 
        const res = await apiService.get(`/routes/admin/getSpacesByZone/${zone._id}`);
        if (res && res.data) {
          setZoneSpaces(res.data);
        } else {
          // Fallback to dummy data if API fails or returns empty
          const spaceCount = zone.total_spaces || 8;
          const dummy = Array.from({ length: spaceCount }, (_, i) => ({
            id: `S-${(i + 1).toString().padStart(2, '0')}`,
            status: Math.random() > 0.4 ? 'occupied' : 'vacant',
            entryTime: new Date(Date.now() - Math.random() * 10000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setZoneSpaces(dummy);
        }
    } catch (err) {
        console.error("Failed to fetch real spaces:", err);
        // Fallback to dummy data on error
        const spaceCount = zone.total_spaces || 8;
        const dummy = Array.from({ length: spaceCount }, (_, i) => ({
          id: `S-${(i + 1).toString().padStart(2, '0')}`,
          status: Math.random() > 0.4 ? 'occupied' : 'vacant',
          entryTime: new Date(Date.now() - Math.random() * 10000000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setZoneSpaces(dummy);
    }

    if (socketConnected) {
        const socket = getSocket();
        socket.emit("zoneSelect", {
          section: activeSection?.title,
          floor: activeFloor?.title,
          zone: zone.title,
          timestamp: new Date().toISOString(),
        });
    }
  };

  const handleSpaceMenuClick = (e, spaceId) => {
    e.stopPropagation();
    setActiveSpaceMenu(activeSpaceMenu === spaceId ? null : spaceId);
  };
    
  const handleSpaceAction = (action, spaceId) => {
    console.log(`${action} clicked for space: ${spaceId}`);
    if (action === 'blockSpace') {
      setBlockedSpaces(prev => { const next = new Set(prev); next.add(spaceId); return next; });
    } else if (action === 'unblockSpace') {
      setBlockedSpaces(prev => { const next = new Set(prev); next.delete(spaceId); return next; });
    } else if (action === 'locateOn') {
      setLocatingSpaces(prev => { const next = new Set(prev); next.add(spaceId); return next; });
    } else if (action === 'locateOff') {
      setLocatingSpaces(prev => { const next = new Set(prev); next.delete(spaceId); return next; });
    }
    setActiveSpaceMenu(null);
  };


  if (loading) {
    return <Loader message="Accessing Parking Grid..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full text-white min-h-screen">
     
      {!socketConnected && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          Network Disconnected: Attempting to synchronize...
        </div>
      )}

      <Header 
        totalParkings={headerData.totalParkings}
        totalSlots={headerData.totalSlots}
        mlcpData={headerData.mlcpData}
        basementData={headerData.basementData}
      />

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Parking Sections Area */}
        <div
          className={`bg-[#0b0f1a] border border-white/5 p-6 rounded-[2rem] w-full overflow-y-auto custom-scrollbar ${
            !activeSection ? "lg:w-full" : "lg:w-1/2"
          } max-h-[700px] shadow-2xl`}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-xl font-bold tracking-tight">Vessel Integration Sectors</h2>
          </div>

          <div
            className={`grid gap-4 ${
              !activeSection
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            {parkingSections?.map((section) => (
              <ParkingSection
                key={section._id}
                title={section.title}
                isActive={activeSection?._id === section._id}
                onClick={() => handleSectionSelect(section)}
                section={section}
                activeSection={activeSection}
                menuOpen={menuOpen}
                handleMenuClick={handleMenuClick}
                setFlippedSection={setFlippedSection}
                flippedSection={flippedSection}
              />
            ))}
          </div>
        </div>

        {/* Level / Floor Area */}
        {activeSection && (
          <div className="bg-[#0b0f1a] border border-white/5 p-6 rounded-[2rem] w-full lg:w-1/2 max-h-[700px] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                <h2 className="text-xl font-bold tracking-tight">
                  Level Diagnostics: {activeSection.title}
                </h2>
              </div>
              <button 
                onClick={() => setActiveSection(null)}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(floors) &&
                floors.map((floor) => (
                  <FloorSection
                    key={floor._id}
                    title={floor.title}
                    id={floor._id}
                    total_spaces={floor.total_spaces}
                    occupied={floor.occupied}
                    total_zones={floor.total_zones}
                    isActive={activeFloor?._id === floor._id}
                    onClick={() => handleFloorSelect(floor)}
                    menuOpen={menuOpen}
                    handleMenuClick={handleMenuClick}
                    setFlippedSection={setFlippedSection}
                    flippedSection={flippedSection}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Guidance Systems Map */}
      {activeSection && (Array.isArray(displays) && displays.length > 0) && (
        <div className="p-8 rounded-[2rem] w-full mt-8 bg-[#0b0f1a] border border-white/5 shadow-2xl overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Monitor className="text-emerald-500" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Operational Display Mesh</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mt-1">
                   Active Intelligence Nodes | Synchronized
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displays.map((display) => (
              <DisplaySection 
                key={display._id} 
                display={display}
                isFlipped={flippedDisplayId === display._id}
                onFlip={(id) => setFlippedDisplayId(flippedDisplayId === id ? null : id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Analytics Visualization */}
      <div className="bg-[#0b0f1a] border border-white/5 p-8 w-full rounded-[2rem] mt-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-5 bg-amber-500 rounded-full" />
          <h2 className="text-xl font-bold tracking-tight">Temporal Flow Monitoring</h2>
        </div>
        <ApexChart data={graphData?.parkingByDay} />
      </div>

      {/* Floor Zones Modal (Synchronized Mesh) */}
      {showFloorZonesModal && selectedFloor && (
        <Modal
          isOpen={showFloorZonesModal}
          onClose={() => setShowFloorZonesModal(false)}
          title={`Regional Pulse: ${selectedFloor.title}`}
          maxWidth="max-w-[98vw] sm:max-w-4xl lg:max-w-6xl"
        >
          {/* Diagnostic strip */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Sectors</span>
              <span className="text-sm font-bold text-white">{zones.length}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
              <span className="text-[10px] text-rose-500/70 uppercase tracking-widest font-bold">Occupied Nodes</span>
              <span className="text-sm font-bold text-rose-400">{selectedFloor.occupied}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-bold">Ready Nodes</span>
              <span className="text-sm font-bold text-emerald-400">{selectedFloor.total_spaces - selectedFloor.occupied}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.isArray(zones) && zones.map((zone) => (
              <ZoneSection
                key={zone._id}
                title={zone.title}
                id={zone._id}
                total_spaces={zone.total_spaces}
                occupied={zone.occupied}
                isActive={false}
                onClick={() => handleZoneClick(zone)}
                menuOpen={menuOpen}
                handleMenuClick={handleMenuClick}
                setFlippedSection={setFlippedSection}
                flippedSection={flippedSection}
                compact={true}
              />
            ))}
          </div>
        </Modal>
      )}

      {/* Zone Spaces Modal (Detail View) */}
      {showZoneModal && selectedZone && (
        <Modal
          isOpen={showZoneModal}
          onClose={() => setShowZoneModal(false)}
          title={`Node Grid: ${selectedZone.title}`}
          maxWidth="max-w-[98vw] sm:max-w-3xl lg:max-w-5xl"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {zoneSpaces.map((space) => (
               <div
                key={space.id}
                className={`group flex flex-col p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  space.status === 'occupied'
                    ? 'bg-rose-500/5 border-rose-500/10'
                    : 'bg-emerald-500/5 border-emerald-500/10'
                }`}
                onClick={() => setActiveSpaceMenu(null)}
              >
                {/* Management Control Overlay */}
                {activeSpaceMenu === space.id && (() => {
                  const isBlocked = blockedSpaces.has(space.id);
                  const isLocating = locatingSpaces.has(space.id);
                  return (
                    <div
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#0b0f1a]/95 rounded-2xl px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{space.id} Management</span>
                        <button
                          className="p-1.5 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                          onClick={(e) => { e.stopPropagation(); setActiveSpaceMenu(null); }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <button
                        className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider ${
                          isBlocked
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleSpaceAction(isBlocked ? 'unblockSpace' : 'blockSpace', space.id); }}
                      >
                        {isBlocked ? 'Restore Entry' : 'Manual Lockout'}
                      </button>

                      <button
                        className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider ${
                          isLocating
                            ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleSpaceAction(isLocating ? 'locateOff' : 'locateOn', space.id); }}
                      >
                        {isLocating ? 'End Homing' : 'Start Homing'}
                      </button>

                      <button
                        className="w-full py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleSpaceAction('refresh', space.id); }}
                      >
                        Sync Node
                      </button>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-bold tracking-tight ${space.status === 'occupied' ? 'text-rose-400' : 'text-emerald-400'}`}>{space.id}</span>
                  <MenuButton
                    isOpen={activeSpaceMenu === space.id}
                    onClick={(e) => handleSpaceMenuClick(e, space.id)}
                    className="scale-75 -mr-2 opacity-50 hover:opacity-100 transition-opacity"
                  />
                </div>

                <div className="flex-grow flex items-center justify-center py-4">
                  <div className={`p-4 rounded-2xl ${space.status === 'occupied' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                    {space.status === 'occupied' ? (
                      <Car size={24} className="text-rose-400" />
                    ) : (
                      <CheckCircle size={24} className="text-emerald-400" />
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">State</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      space.status === 'occupied' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {space.status}
                    </span>
                  </div>
                  
                  {space.status === 'occupied' && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                        <Clock size={11} />
                        <span>Docked Since</span>
                      </div>
                      <span className="text-white font-mono">{space.entryTime}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
