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
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { Icon } from '@iconify/react';
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
  const [displayFilterParking, setDisplayFilterParking] = useState("all");
  const [displayFilterFloor, setDisplayFilterFloor] = useState("all");

  const [graphFilterParking, setGraphFilterParking] = useState("all");
  const [graphFilterFloor, setGraphFilterFloor] = useState("all");
  const [graphFloors, setGraphFloors] = useState([]);

  useEffect(() => {
    if (graphFilterParking !== "all") {
      apiService.get(endpoints.floors.getById(graphFilterParking))
        .then(res => {
          const floorsData = res.floors_data || res.data || [];
          setGraphFloors(floorsData);
        })
        .catch(err => console.error("Error fetching graph floors:", err));
    } else {
      setGraphFloors([]);
    }
  }, [graphFilterParking]);

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
      const floorsData = data.floors_data || data.data || [];

      const mappedFloors = floorsData.map((floor) => ({
        _id: floor._id,
        title: floor.floor_name || floor.name,
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

  // Fallback data generator for high-density visualization
  const generateMockGraphData = useCallback(() => {
    const mock = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:00`;
      mock.push({
        time: timeStr,
        occupancy: Math.round(60 + Math.random() * 40),
        entries: Math.round(Math.random() * 25),
        exits: Math.round(Math.random() * 20)
      });
    }
    return mock;
  }, []);

  const flowData = useMemo(() => {
    const rawHistory = graphData?.parkingByDay || [];
    if (!rawHistory.length) return [];

    // Check if it's our mock data or real DB data
    const isRealData = !!rawHistory[0].parkingArray;

    if (!isRealData) {
      // It's mock data, just return it
      return rawHistory;
    }

    let prevOccupied = 0;

    return rawHistory.map((snapshot, index) => {
      let currentOccupied = 0;
      let totalSpaces = 1;

      if (graphFilterParking === "all") {
        currentOccupied = snapshot.parkingArray.reduce((acc, p) => acc + (p.total_occupied || 0), 0);
        totalSpaces = snapshot.parkingArray.reduce((acc, p) => acc + (p.total_spaces || 1), 0) || 1;
      } else {
        // filter by selected parking
        const selectedP = parkingSections.find(p => String(p._id) === String(graphFilterParking));
        if (graphFilterFloor === "all") {
           const pData = snapshot.parkingArray.find(p => p.name === selectedP?.title || p.name === selectedP?.parking_name);
           if (pData) {
              currentOccupied = pData.total_occupied || 0;
              totalSpaces = pData.total_spaces || 1;
           }
        } else {
           // filter by specific floor
           const selectedF = graphFloors.find(f => String(f._id || f.id) === String(graphFilterFloor));
           const fData = snapshot.floorArray.find(f => f.floor_name === selectedF?.title || f.floor_name === selectedF?.floor_name);
           if (fData) {
              currentOccupied = fData.occupied || 0;
              totalSpaces = selectedF?.total_spaces || 1;
           }
        }
      }

      const occupancyPercent = Math.round((currentOccupied / totalSpaces) * 100);
      
      const entries = index === 0 ? 0 : Math.max(0, currentOccupied - prevOccupied);
      const exits = index === 0 ? 0 : Math.max(0, prevOccupied - currentOccupied);
      prevOccupied = currentOccupied;

      return {
        time: snapshot.time,
        occupancy: occupancyPercent,
        entries: entries,
        exits: exits
      };
    });

  }, [graphData, graphFilterParking, graphFilterFloor, parkingSections, graphFloors]);

  const processData = useCallback((data) => {
    const rawData = data?.data || (Array.isArray(data) ? data : null);

    if (rawData && Array.isArray(rawData)) {
      const mapped = rawData.map((section) => ({
        ...section,
        title: section.name || section.parking_name || section.title || "Unnamed Section",
        occupancy: Math.round(
          (section.total_occupied / section.total_spaces) * 100
        ),
        isFlipped: false,
      }));
      setParkingSections(mapped);

      if (!activeSection && mapped.length > 0) {
        setActiveSection(mapped[0]);
        fetchFloors(mapped[0]._id);
      }
    }

    // Handle graph data extraction
    const gData = data?.graphData?.parkingByDay || (Array.isArray(data) ? data : null);
    if (gData && gData.length > 0 && gData[0].time) {
      setGraphData({ parkingByDay: gData });
    } else {
      setGraphData({
        parkingByDay: generateMockGraphData(),
      });
    }
  }, [activeSection, fetchFloors, generateMockGraphData]);

  const fetchDataFromBackend = useCallback(async () => {
    try {
      const data = await apiService.get(endpoints.parking.getAll);
      processData(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Backend fetch failed:", err);
      // Fallback to internal simulation if API fails
      setGraphData({
        parkingByDay: generateMockGraphData()
      });
      setLoading(false);
    }
  }, [processData, generateMockGraphData]);

  const fetchDisplays = useCallback(async (parkings) => {
    try {
      if (!parkings || parkings.length === 0) return;
      const promises = parkings.map(p => apiService.get(`${endpoints.displays.getAll}/${p._id}`));
      const results = await Promise.all(promises);
      const allD = results.flatMap(r => r.data || []);
      setDisplays(allD);
    } catch (err) {
      console.error("Error fetching displays:", err);
      setDisplays([]);
    }
  }, []);

  useEffect(() => {
    if (parkingSections && parkingSections.length > 0) {
      fetchDisplays(parkingSections);
    }
  }, [parkingSections, fetchDisplays]);

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
    socket.on("dashboard", (data) => {
      console.log("Received dashboard update:", data);

      // Update parking sections
      setParkingSections(prev => {
        return prev.map(section => {
          if (String(section._id) === String(data.parking_id)) {
            return {
              ...section,
              total_occupied: data.parking_occupied,
              total_free: data.parking_free,
              occupancy: Math.round((data.parking_occupied / data.parking_spaces) * 100)
            };
          }
          return section;
        });
      });

      // Update active floors
      setFloors(prev => {
        return prev.map(floor => {
          if (data.floor_data && String(floor._id) === String(data.floor_data.floor_id)) {
            return {
              ...floor,
              occupied: data.floor_data.floor_occupied,
              free: data.floor_data.floor_free,
              occupancy: Math.round((data.floor_data.floor_occupied / data.floor_data.floor_spaces) * 100)
            };
          }
          return floor;
        });
      });

      // Update active zones
      setZones(prev => {
        return prev.map(zone => {
          if (data.floor_data && data.floor_data.zone_data && String(zone._id) === String(data.floor_data.zone_data.zone_id)) {
            return {
              ...zone,
              occupied: data.floor_data.zone_data.zone_occupied,
              free: data.floor_data.zone_data.zone_free,
              occupancy: Math.round((data.floor_data.zone_data.zone_occupied / data.floor_data.zone_data.zone_spaces) * 100)
            };
          }
          return zone;
        });
      });
      
      // Update spaces in the modal if it's open
      setZoneSpaces(prev => {
        if (!data.space_obj || !prev || prev.length === 0) return prev;
        return prev.map(space => {
          if (String(space.space_id) === String(data.space_obj.space_id)) {
            const isOcc = data.space_obj.device_occupied;
            const upTime = data.space_obj.updatedAt || new Date().toISOString();
            return {
              ...space,
              device_occupied: isOcc,
              status: isOcc ? 'occupied' : 'vacant',
              updatedAt: upTime,
              entryTime: new Date(upTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }
          return space;
        });
      });
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
      socket.off("dashboard");
      socket.off("parkingUpdate");
      socket.off("display");
      socket.off("connect_error");
      socket.io.off("error");
      socket.io.off("reconnect_attempt");
      socket.io.off("reconnect");
    };
  }, [activeSection, activeFloor, fetchDataFromBackend, processData]);

  const uniqueDisplayFloors = useMemo(() => {
    const floorSet = new Set();
    displays.forEach(d => {
      // Only include floors from the selected parking if a filter is active
      if (displayFilterParking !== "all" && d.parking_id !== displayFilterParking) return;

      if (Array.isArray(d.display_connections_name)) {
        d.display_connections_name.forEach(f => floorSet.add(f));
      } else if (typeof d.display_connections_name === 'string') {
        floorSet.add(d.display_connections_name);
      }
    });
    return Array.from(floorSet).filter(Boolean).sort();
  }, [displays, displayFilterParking]);

  const filteredDisplays = useMemo(() => {
    return displays.filter(d => {
      if (displayFilterParking !== "all" && d.parking_id !== displayFilterParking) return false;
      if (displayFilterFloor !== "all") {
        const conns = Array.isArray(d.display_connections_name) ? d.display_connections_name : [d.display_connections_name];
        if (!conns.includes(displayFilterFloor)) return false;
      }
      return true;
    });
  }, [displays, displayFilterParking, displayFilterFloor]);

  // Modify click handlers to use fetch if socket is not connected
  const handleSectionSelect = (section) => {
    setActiveSection(section);
    fetchFloors(section._id);
    setDisplayFilterParking(section._id);

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
      const res = await apiService.get(`/api/getSpacesByZone/${zone._id}`);
      if (res && res.data) {
        const normalized = res.data.map(space => ({
          ...space,
          id: space._id,
          name: space.space_name || `S-${space.space_id}`,
          status: space.device_occupied ? 'occupied' : 'vacant',
          entryTime: space.updatedAt ? new Date(space.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NA'
        }));
        setZoneSpaces(normalized);
      } else {
        // Fallback to dummy data if API fails or returns empty
        const spaceCount = zone.total_spaces || 8;
        const dummy = Array.from({ length: spaceCount }, (_, i) => ({
          id: `S-${(i + 1).toString().padStart(2, '0')}`,
          name: `S-${(i + 1).toString().padStart(2, '0')}`,
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
        name: `S-${(i + 1).toString().padStart(2, '0')}`,
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

  const handleSpaceAction = async (action, spaceId) => {
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

    // Connect to backend API if it's a real MongoDB ObjectId
    const isMongoId = typeof spaceId === 'string' && spaceId.length === 24 && /^[0-9a-fA-F]{24}$/.test(spaceId);
    if (isMongoId) {
      try {
        let endpoint = "";
        let payload = { spaceObjID: spaceId };
        if (action === 'blockSpace') {
          endpoint = "/api/blockSpaceBySpace";
        } else if (action === 'unblockSpace') {
          endpoint = "/api/unBlockSpaceBySpace";
        } else if (action === 'locateOn') {
          endpoint = "/api/locateOnSpaceBySpace";
        } else if (action === 'locateOff') {
          endpoint = "/api/locateOffSpaceBySpace";
        } else if (action === 'refresh') {
          endpoint = "/api/syncSpaceBySpace";
        }

        if (endpoint) {
          const res = await apiService.post(endpoint, payload);
          console.log(`Backend action ${action} response:`, res);
        }
      } catch (err) {
        console.error(`Failed to execute backend action ${action}:`, err);
      }
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
    <div className="p-0 sm:p-0 lg:p-0 w-full text-white min-h-screen">

      {/* {!socketConnected && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded mb-6 text-sm font-bold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded bg-rose-500 animate-pulse" />
          Network Disconnected: Attempting to synchronize...
        </div>
      )} */}

      {/* Main Dashboard Layout */}
      <Header
        totalParkings={headerData.totalParkings}
        totalSlots={headerData.totalSlots}
        mlcpData={headerData.mlcpData}
        basementData={headerData.basementData}
      />

      {/* Main Operational Row (Parkings, Floors, Displays) */}
      <div className="flex flex-col lg:flex-row w-full mt-2 gap-2">
        {/* Parkings & Floors Area */}
        <div className="flex flex-col lg:flex-row gap-2 flex-1 min-w-0">
          {/* Parking Sections Area */}
          <div
            className={`bg-[#0b0f1a] border border-white/5 p-2 rounded w-full overflow-y-auto custom-scrollbar ${!activeSection ? "lg:w-full" : "lg:w-1/2"
              } max-h-[700px] shadow-2xl`}
          >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-5 bg-blue-600 rounded" />
                <h2 className="text-lg font-bold tracking-tight text-white uppercase">Parkings</h2>
              </div>

              <div
                className={`grid gap-4 ${!activeSection
                  ? (parkingSections?.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4")
                  : (parkingSections?.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")
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
              <div className="bg-[#0b0f1a] border border-white/5 p-3 rounded w-full lg:w-1/2 max-h-[700px] overflow-y-auto custom-scrollbar shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-indigo-500 rounded" />
                    <h2 className="text-lg font-bold tracking-tight text-white uppercase">
                      {activeSection.name || activeSection.parking_name || activeSection.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setActiveSection(null);
                      setDisplayFilterParking("all");
                      setDisplayFilterFloor("all");
                    }}
                    className="p-2 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className={`grid gap-4 ${floors?.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
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

        {/* Operational Display Sidebar (Integrated into row) */}
        <div className="w-full lg:w-[150px] xl:w-[240px] flex flex-col gap-2 shrink-0">
          <div className="bg-[#0b0f1a] border border-white/5 p-4 rounded shadow-2xl h-full flex flex-col max-h-[700px] sticky top-2">
            <div className="flex flex-col gap-1 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-3 bg-amber-500 rounded" />
                <h2 className="text-[10px] font-black tracking-tight text-white uppercase">Nodes</h2>
              </div>
              <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase tracking-widest w-fit">
                {filteredDisplays.length} Active
              </div>
            </div>
            
            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {filteredDisplays.map((display) => (
                  <DisplaySection
                    key={display.display_id}
                    display={display}
                    isFlipped={flippedDisplayId === display.display_id}
                    onFlip={(id) => setFlippedDisplayId(flippedDisplayId === id ? null : id)}
                  />
                ))}
              </div>
              {filteredDisplays.length === 0 && (
                <div className="py-20 text-center text-slate-500 italic text-[10px] uppercase tracking-widest leading-loose">
                  No active telemetry<br />nodes detected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Performance Mesh (Full Width) */}
      <div className="flex flex-col gap-2 mt-2 w-full">
          {/* Analytics Filters */}
          <div className="bg-[#0b0f1a] border border-white/5 p-4 rounded shadow-2xl flex flex-wrap gap-4 items-center w-full">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter Analytics:</span>
            <select 
              className="bg-white/5 border border-white/10 rounded py-2 px-4 text-xs font-bold text-white outline-none focus:border-purple-500/50 transition-all cursor-pointer"
              value={graphFilterParking}
              onChange={e => { setGraphFilterParking(e.target.value); setGraphFilterFloor("all"); }}
            >
              <option value="all">All Parkings</option>
              {parkingSections.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>

            <select 
              className="bg-white/5 border border-white/10 rounded py-2 px-4 text-xs font-bold text-white outline-none focus:border-purple-500/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              value={graphFilterFloor}
              onChange={e => setGraphFilterFloor(e.target.value)}
              disabled={graphFilterParking === "all"}
            >
              <option value="all">All Floors</option>
              {graphFilterParking !== "all" && graphFloors.map(f => <option key={f._id || f.id} value={f._id || f.id}>{f.title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 w-full">
            {/* Occupancy Trend Analysis */}
            <div className="bg-[#0b0f1a] border border-white/5 p-6 rounded shadow-2xl lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-purple-500 rounded" />
                  <h2 className="text-base font-bold tracking-tight text-white uppercase">Live Occupancy Trend</h2>
                </div>
                <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded uppercase tracking-widest animate-pulse">Real-Time Analytics</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={flowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={{ fill: '#a855f7', strokeWidth: 2, r: 4, stroke: '#0b0f1a' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name="Occupancy %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Main Utilization Trend */}
            <div className="bg-[#0b0f1a] border border-white/5 p-6 rounded shadow-2xl lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-blue-500 rounded" />
                  <h2 className="text-base font-bold tracking-tight text-white uppercase">Live Entry & Exit Flow</h2>
                </div>
                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded uppercase tracking-widest animate-pulse">Live Stream</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={flowData}>
                    <defs>
                      <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="entries"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorEntries)"
                      name="Entries"
                    />
                    <Area
                      type="monotone"
                      dataKey="exits"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorExits)"
                      name="Exits"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Space Distribution Snapshot */}
            <div className="bg-[#0b0f1a] border border-white/5 p-6 rounded shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-emerald-500 rounded" />
                  <h2 className="text-base font-bold tracking-tight text-white uppercase">Space Inventory Matrix</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Occupied', value: parkingSections.reduce((s, p) => s + p.total_occupied, 0), color: '#3b82f6' },
                        { name: 'Available', value: parkingSections.reduce((s, p) => s + (p.total_spaces - p.total_occupied), 0), color: '#10b981' }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {[
                        { color: '#3b82f6' },
                        { color: '#10b981' }
                      ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col justify-center gap-4">
                  <div className="p-4 rounded bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saturation Rate</p>
                    <p className="text-2xl font-black text-blue-400">
                      {Math.round((parkingSections.reduce((s, p) => s + p.total_occupied, 0) / parkingSections.reduce((s, p) => s + p.total_spaces, 1)) * 100)}%
                    </p>
                  </div>
                  <div className="p-4 rounded bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Net Availability</p>
                    <p className="text-2xl font-black text-emerald-400">
                      {parkingSections.reduce((s, p) => s + (p.total_spaces - p.total_occupied), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Level Performance Row - Pie Chart Evolution */}
            <div className="bg-[#0b0f1a] border border-white/5 p-6 rounded shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-indigo-500 rounded" />
                  <h2 className="text-base font-bold tracking-tight text-white uppercase">Level Utilization Breakdown</h2>
                </div>
              </div>
              <div className="h-[300px] w-full flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={floors.length > 0 ? floors.map(f => ({ name: f.title, value: f.occupancy })) : [{ name: 'No Data', value: 1 }]}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {floors.map((f, i) => (
                          <Cell key={i} fill={['#6366f1', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b'][i % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap md:flex-col justify-center gap-4 w-full md:w-1/3">
                  {floors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 p-3 rounded bg-white/[0.02] border border-white/5 flex-1 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b'][i % 5] }} />
                        <span className="text-[10px] font-black text-slate-400 uppercase">{f.title}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{f.occupancy}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Peak Demand HeatMap Row */}
            <div className="bg-[#0b0f1a] border border-white/5 p-6 rounded shadow-2xl lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-rose-500 rounded" />
                  <h2 className="text-base font-bold tracking-tight text-white uppercase">Weekly Demand Pulse</h2>
                </div>
                <div className="flex items-center gap-4 bg-white/[0.02] px-4 py-2 rounded-full border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intensity Map</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-yellow-400 uppercase">Low</span>
                    <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 shadow-[0_0_10px_rgba(245,158,11,0.2)]" />
                    <span className="text-[8px] font-bold text-red-500 uppercase">Peak</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-[850px] space-y-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-10 text-[10px] font-black text-slate-500 uppercase tracking-tighter">{day}</div>
                      <div className="flex-1 flex gap-1 h-8">
                        {Array.from({ length: 24 }).map((_, h) => {
                          const val = 10 + Math.random() * 90;
                          // Hue 60 (Yellow) to 0 (Red)
                          const hue = 55 - (val * 0.55); 
                          const opacity = 0.4 + (val / 100) * 0.6;
                          return (
                            <div 
                              key={h} 
                              style={{
                                backgroundColor: `hsla(${hue}, 90%, 50%, ${opacity})`,
                                boxShadow: val > 75 ? `0 0 15px -3px hsla(${hue}, 90%, 50%, 0.5)` : 'none',
                                borderColor: 'rgba(255,255,255,0.05)'
                              }}
                              className="flex-1 rounded-sm border transition-all duration-300 hover:scale-110 hover:z-10 cursor-pointer group relative"
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none border border-white/10 z-50 shadow-2xl">
                                <div className="font-bold mb-0.5">{day} {h}:00</div>
                                <div style={{ color: `hsl(${hue}, 80%, 70%)` }} className="font-bold">
                                  Demand: {Math.round(val)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex ml-14 mt-4">
                    {Array.from({ length: 24 }).map((_, h) => (
                      <div key={h} className="flex-1 text-[9px] font-bold text-slate-600 text-center">
                        {h % 4 === 0 ? `${h}h` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <div className="flex items-center gap-3 px-5 py-2.5 rounded bg-white/5 border border-white/5">
              <div className="w-2 h-2 rounded bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Sectors</span>
              <span className="text-sm font-bold text-white">{zones.length}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded bg-rose-500/5 border border-rose-500/10">
              <span className="text-[10px] text-rose-500/70 uppercase tracking-widest font-bold">Occupied Nodes</span>
              <span className="text-sm font-bold text-rose-400">{selectedFloor.occupied}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded bg-emerald-500/5 border border-emerald-500/10">
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
            {zoneSpaces.map((space) => {
              const isBlocked = blockedSpaces.has(space.id);
              const isLocating = locatingSpaces.has(space.id);
              const isOccupied = space.status === 'occupied' || isBlocked;
              return (
                <div
                  key={space.id}
                  className={`group flex flex-col p-5 rounded border transition-all duration-300 relative overflow-hidden ${isOccupied
                    ? 'bg-rose-500/5 border-rose-500/10'
                    : 'bg-emerald-500/5 border-emerald-500/10'
                    }`}
                  onClick={() => setActiveSpaceMenu(null)}
                >
                  {/* Management Control Overlay */}
                  {activeSpaceMenu === space.id && (
                    <div
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#0b0f1a]/95 rounded px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{space.name || space.id} Management</span>
                        <button
                          className="p-1.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                          onClick={(e) => { e.stopPropagation(); setActiveSpaceMenu(null); }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <button
                        className={`w-full py-3 rounded border flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider ${isBlocked
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}
                        onClick={(e) => { e.stopPropagation(); handleSpaceAction(isBlocked ? 'unblockSpace' : 'blockSpace', space.id); }}
                      >
                        {isBlocked ? 'Unblock' : 'Block'}
                      </button>

                      <button
                        className={`w-full py-3 rounded border flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider ${isLocating
                          ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}
                        onClick={(e) => { e.stopPropagation(); handleSpaceAction(isLocating ? 'locateOff' : 'locateOn', space.id); }}
                      >
                        {isLocating ? 'Location Off' : 'Location On'}
                      </button>

                      <button
                        className="w-full py-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider active:scale-95 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleSpaceAction('refresh', space.id); }}
                      >
                        Sync Node
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-bold tracking-tight ${isOccupied ? 'text-rose-400' : 'text-emerald-400'}`}>{space.name || space.id}</span>
                    <MenuButton
                      isOpen={activeSpaceMenu === space.id}
                      onClick={(e) => handleSpaceMenuClick(e, space.id)}
                      className="scale-75 -mr-2 opacity-50 hover:opacity-100 transition-opacity"
                    />
                  </div>

                  <div className="flex-grow flex items-center justify-center py-4">
                    <div className={`p-4 rounded ${isOccupied ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                      {isOccupied ? (
                        <Car size={24} className="text-rose-400" />
                      ) : (
                        <CheckCircle size={24} className="text-emerald-400" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">State</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isOccupied ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                        {isBlocked ? 'blocked' : space.status}
                      </span>
                    </div>

                    {isOccupied && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-tighter">
                          <Clock size={11} />
                          <span>{isBlocked ? 'Blocked Since' : 'Docked Since'}</span>
                        </div>
                        <span className="text-white font-mono">{isBlocked ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : space.entryTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};
