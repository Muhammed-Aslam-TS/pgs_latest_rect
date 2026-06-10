import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReusableTable from "../../components/common/reusableTable";
import { apiService } from "../../services/api";
import { Icon } from "@iconify/react";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import { motion, AnimatePresence } from "framer-motion";

import { useSocket } from "../../hooks/useSocket";

export default function Spaces() {
  const [loading, setLoading] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParkingId = searchParams.get("parkingId") || "";
  const initialFloorId = searchParams.get("floorId") || "";
  const initialZoneId = searchParams.get("zoneId") || "";

  const [selectedParking, setSelectedParking] = useState(initialParkingId);
  const [selectedFloor, setSelectedFloor] = useState(initialFloorId);
  const [selectedZone, setSelectedZone] = useState(initialZoneId);
  const [data, setData] = useState([]);
  const [allSpaces, setAllSpaces] = useState([]);
  const [currentPage] = useState(1);
  const [pageSize] = useState(10);

  useSocket("spaceUpdate", (update) => {
    setData((prevData) =>
      prevData.map((row) => {
        // Find the slot that is linked to this physical space ID
        if (row.configure && String(row.device_id) === String(update.space_id)) {
          return { ...row, device_occupied: update.device_occupied };
        }
        return row;
      })
    );
  });

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      const res = await apiService.get("/api/parkings");
      setParkings(res.data || []);
    } catch (error) {
      showErrorToast("Failed to fetch vessel network.");
    }
  };

  const fetchFloors = async (parkingId) => {
    if (!parkingId) return;
    try {
      const res = await apiService.get(`/api/floors/${parkingId}`);
      setFloors(res.data || res.floors_data || []);
    } catch (error) {
      setFloors([]);
    }
  };

  const fetchZones = async (floorId) => {
    if (!floorId) return;
    try {
      const res = await apiService.get(`/api/zones/${floorId}`);
      setZones(res.data || []);
    } catch (error) {
      setZones([]);
    }
  };

  const fetchZoneDetails = async (zoneId) => {
    if (!zoneId) return;
    setLoading(true);
    try {
      // Backend returns { message: "...", data: [ zoneData, { spaces: [...] } ] }
      const res = await apiService.get(`/api/zone/${zoneId}`);
      const zoneData = res.data[0];
      // Map slot_names to table data
      const slots = zoneData.slot_names.map(slot => ({
        ...slot,
        zone_id: zoneData._id,
        floor_id: zoneData.floor_id,
        parking_id: zoneData.parking_id,
      }));
      setData(slots);
      
      // The second item in the array contains all spaces for the parking
      if (res.data[1] && res.data[1].spaces) {
        // Sort spaces numerically by space_id for a cleaner dropdown
        const sortedSpaces = [...res.data[1].spaces].sort((a, b) => a.space_id - b.space_id);
        setAllSpaces(sortedSpaces);
        
        // Auto-assign available IDs to unconfigured slots sequentially
        const availableSpaces = sortedSpaces.filter(s => !s.configure);
        let availableIdx = 0;
        
        const prefilledSlots = slots.map(slot => {
          if (!slot.configure && availableIdx < availableSpaces.length) {
            return { ...slot, temp_space_id: availableSpaces[availableIdx++].space_id };
          }
          return slot;
        });
        
        setData(prefilledSlots);
      } else {
        setAllSpaces([]);
        setData(slots);
      }
    } catch (error) {
      console.error("Fetch Zone Details Error:", error);
      setData([]);
      setAllSpaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedParking) {
      fetchFloors(selectedParking);
      setSelectedFloor("");
      setSelectedZone("");
    } else {
      setFloors([]);
    }
  }, [selectedParking]);

  useEffect(() => {
    if (selectedFloor) {
      fetchZones(selectedFloor);
      setSelectedZone("");
    } else {
      setZones([]);
    }
  }, [selectedFloor]);

  useEffect(() => {
    if (selectedZone) {
      fetchZoneDetails(selectedZone);
    } else {
      setData([]);
      setAllSpaces([]);
    }
  }, [selectedZone]);

  const handleConnect = async (row, index) => {
    const spaceId = row.temp_space_id;
    if (!spaceId) {
      showErrorToast("Target Space ID required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        parking_id: row.parking_id,
        floor_id: row.floor_id,
        zone_id: row.zone_id,
        slot_name: row.slot_name,
        configure: true,
        space_id: parseInt(spaceId),
        zone_slot_id: row._id,
        action: "connect"
      };

      const res = await apiService.post("/api/space", payload);
      if (res.data) {
        showSuccessToast("Neural link established.");
        fetchZoneDetails(selectedZone); // Refresh
      } else if (res.message) {
        showErrorToast(`Conflict: ${res.message} already occupies this ID.`);
      }
    } catch (error) {
      showErrorToast("Link establishment failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (row) => {
    setLoading(true);
    try {
      const payload = {
        parking_id: row.parking_id,
        floor_id: row.floor_id,
        zone_id: row.zone_id,
        space_id: row.device_id,
        zone_slot_id: row._id,
        action: "disconnect"
      };
      await apiService.post("/api/space", payload);
      showSuccessToast("Space de-registered.");
      fetchZoneDetails(selectedZone);
    } catch (error) {
      showErrorToast("Failed to sever link.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index, field, value) => {
    setData(prev => {
      const newData = [...prev];
      newData[index][field] = value;
      return newData;
    });
  };

  const columns = useMemo(() => [
    {
      header: "Neural Slot",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${row.configure ? 'bg-emerald-500/20' : 'bg-slate-500/20'}`}>
            <Icon icon={row.configure ? "solar:link-bold-duotone" : "solar:link-broken-bold-duotone"} className={row.configure ? 'text-emerald-500' : 'text-slate-500'} />
          </div>
          <span className="font-bold text-white text-xs">{row.slot_name}</span>
        </div>
      )
    },
    {
      header: "Assigned ID",
      accessor: (row, index) => (
        row.configure ? (
          <span className="font-mono text-emerald-400 font-black">#{row.device_id}</span>
        ) : (
          <select
            className="bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-mono font-bold text-white w-40 focus:border-blue-500/50 outline-none transition-all cursor-pointer appearance-none"
            value={row.temp_space_id || ""}
            onChange={(e) => handleInputChange(index, "temp_space_id", e.target.value)}
          >
            <option value="" disabled>Target ID</option>
            {allSpaces.map(space => (
              <option key={space._id || space.space_id} value={space.space_id} className={space.configure ? "text-slate-400" : ""}>
                ID {space.space_id} {space.configure ? "(In Use)" : ""}
              </option>
            ))}
          </select>
        )
      )
    },
    {
      header: "Link Status",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded ${row.configure ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-slate-700'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${row.configure ? 'text-emerald-500' : 'text-slate-600'}`}>
            {row.configure ? 'Active Relay' : 'Idle Node'}
          </span>
        </div>
      )
    },
    {
      header: "Occupancy State",
      accessor: (row) => {
        if (!row.configure) return <span className="text-[10px] font-black uppercase text-slate-600">N/A</span>;
        const isOccupied = row.device_occupied;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded ${isOccupied ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isOccupied ? 'text-red-400' : 'text-emerald-400'}`}>
              {isOccupied ? 'Occupied' : 'Vacant'}
            </span>
          </div>
        );
      }
    },
    {
      header: "Operation",
      accessor: (row, index) => (
        <button
          onClick={() => row.configure ? handleDisconnect(row) : handleConnect(row, index)}
          disabled={loading}
          className={`px-4 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all ${row.configure
            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
        >
          {row.configure ? 'Sever Link' : 'Establish'}
        </button>
      )
    }
  ], [data, loading, allSpaces]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <div className="p-2.5 bg-blue-600/20 rounded border border-blue-500/30">
              <Icon icon="solar:transmission-bold-duotone" className="text-blue-500 text-2xl" />
            </div>
            Link Control
          </h1>
          <p className="text-slate-500 text-sm font-medium">Provision neural links between slots and physical nodes</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-[#1e293b]/40 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/5">
          <select
            className="bg-white/5 border border-white/5 rounded py-2 px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer min-w-[140px] appearance-none"
            value={selectedParking}
            onChange={(e) => {
              setSelectedParking(e.target.value);
              setSearchParams({ parkingId: e.target.value });
            }}
          >
            <option value="" disabled>Vessel</option>
            {parkings.map(p => <option key={p._id} value={p._id}>{p.name || p.parking_name}</option>)}
          </select>
          <Icon icon="solar:arrow-right-linear" className="text-slate-600 text-xs" />
          <select
            className="bg-white/5 border border-white/5 rounded py-2 px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer min-w-[140px] appearance-none"
            value={selectedFloor}
            onChange={(e) => {
              setSelectedFloor(e.target.value);
              setSearchParams({ parkingId: selectedParking, floorId: e.target.value });
            }}
            disabled={!selectedParking}
          >
            <option value="" disabled>Level</option>
            {floors.map(f => <option key={f._id} value={f._id}>{f.floor_name}</option>)}
          </select>
          <Icon icon="solar:arrow-right-linear" className="text-slate-600 text-xs" />
          <select
            className="bg-white/5 border border-white/5 rounded py-2 px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer min-w-[140px] appearance-none"
            value={selectedZone}
            onChange={(e) => {
              setSelectedZone(e.target.value);
              setSearchParams({ parkingId: selectedParking, floorId: selectedFloor, zoneId: e.target.value });
            }}
            disabled={!selectedFloor}
          >
            <option value="" disabled>Sector</option>
            {zones.map(z => <option key={z._id} value={z._id}>{z.zone_name}</option>)}
          </select>
        </div>
      </header>

      <div className="rounded-[3rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden p-8 relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded animate-spin" />
          </div>
        )}

        <ReusableTable
          columns={columns}
          data={data}
          currentPage={currentPage}
          pageSize={pageSize}
          message={selectedZone ? "No neural nodes detected in this sector." : "Awaiting Sector synchronization..."}
        />
      </div>
    </div>
  );
}
