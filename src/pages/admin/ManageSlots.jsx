import { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { apiService } from "../../services/api";
import { Icon } from "@iconify/react";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

const SlotCard = ({ slot }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'SLOT',
    item: { slot },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      className={`p-3 bg-[#1e293b] border border-white/10 shadow-lg rounded-xl flex flex-col gap-1 cursor-grab active:cursor-grabbing hover:bg-white/5 hover:border-white/20 transition-all ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon icon="solar:parking-bold-duotone" className="text-blue-500" />
          <span className="font-bold text-white text-xs">{slot.slot_name}</span>
        </div>
        <div className="bg-slate-800 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 font-black border border-emerald-500/20">
          {slot.device_id ? `#${slot.device_id}` : 'No Device'}
        </div>
      </div>
    </div>
  );
};

const Column = ({ title, status, slots, onDrop, icon, colorClass }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'SLOT',
    drop: (item) => onDrop(item.slot, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div ref={drop} className={`flex flex-col gap-3 p-4 rounded-3xl border transition-all duration-300 ${isOver ? `border-${colorClass}-500 bg-${colorClass}-500/10 shadow-[0_0_20px_rgba(var(--${colorClass}-500),0.2)]` : 'border-white/5 bg-[#0f172a]/50'} min-h-[500px]`}>
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Icon icon={icon} className={`text-xl text-${colorClass}-500`} />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
        <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-full">{slots.length}</span>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
        {slots.map(slot => (
          <SlotCard key={slot._id || slot.slot_name} slot={slot} />
        ))}
        {slots.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
            <Icon icon="solar:box-linear" className="text-4xl text-slate-600" />
            <div className="text-xs text-slate-500 font-medium tracking-wide">Drag & Drop Slots Here</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ManageSlots() {
  const [loading, setLoading] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedParking, setSelectedParking] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      const res = await apiService.get("/api/parkings");
      setParkings(res.data || []);
    } catch (error) {
      showErrorToast("Failed to fetch parkings.");
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
      const res = await apiService.get(`/api/zone/${zoneId}`);
      const zoneData = res.data[0];
      const slots = zoneData.slot_names.map(slot => ({
        ...slot,
        zone_id: zoneData._id,
        floor_id: zoneData.floor_id,
        parking_id: zoneData.parking_id,
      }));
      setData(slots);
    } catch (error) {
      console.error("Fetch Zone Details Error:", error);
      setData([]);
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
    }
  }, [selectedZone]);

  const updateSlotStatus = async (slot, newCategory) => {
    let currentCategory = 'available';
    if (slot.is_reserved) currentCategory = 'reserved';
    if (slot.is_maintained) currentCategory = 'maintained';

    if (currentCategory === newCategory) return;

    setLoading(true);
    try {
      const payload = {
        zone_id: slot.zone_id,
        slot_name: slot.slot_name,
        is_reserved: newCategory === 'reserved',
        is_maintained: newCategory === 'maintained',
        action: "update_status"
      };

      const res = await apiService.post("/api/space/status", payload);
      showSuccessToast(`Slot moved to ${newCategory}.`);
      
      // Optimistic update
      setData(prev => prev.map(s => s.slot_name === slot.slot_name ? { ...s, is_reserved: payload.is_reserved, is_maintained: payload.is_maintained } : s));
    } catch (error) {
      showErrorToast(`Failed to move slot.`);
      fetchZoneDetails(selectedZone); // revert on error
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(s => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const slotMatch = s.slot_name?.toLowerCase().includes(query);
    const deviceMatch = s.device_id?.toString().includes(query);
    return slotMatch || deviceMatch;
  });

  const availableSlots = filteredData.filter(s => !s.is_reserved && !s.is_maintained);
  const reservedSlots = filteredData.filter(s => s.is_reserved);
  const maintainedSlots = filteredData.filter(s => s.is_maintained);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-8 pb-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
              <div className="p-2.5 bg-purple-600/20 rounded border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Icon icon="solar:shield-check-bold-duotone" className="text-purple-500 text-2xl" />
              </div>
              Manage Slots
            </h1>
            <p className="text-slate-500 text-sm font-medium">Drag and drop slots to manage reservations and maintenance</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center bg-[#1e293b]/40 backdrop-blur-xl px-4 py-2 rounded-[2.5rem] border border-white/5 shadow-xl min-w-[200px]">
              <Icon icon="solar:magnifer-linear" className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search slot or device..."
                className="bg-transparent text-[12px] font-bold text-white outline-none w-full placeholder:text-slate-500 placeholder:font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-3 bg-[#1e293b]/40 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/5 shadow-xl">
              <select
              className="bg-white/5 border border-white/5 rounded py-2 px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer min-w-[140px] appearance-none"
              value={selectedParking}
              onChange={(e) => setSelectedParking(e.target.value)}
            >
              <option value="" disabled>Vessel</option>
              {parkings.map(p => <option key={p._id} value={p._id}>{p.name || p.parking_name}</option>)}
            </select>
            <Icon icon="solar:arrow-right-linear" className="text-slate-600 text-xs" />
            <select
              className="bg-white/5 border border-white/5 rounded py-2 px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer min-w-[140px] appearance-none"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              disabled={!selectedParking}
            >
              <option value="" disabled>Level</option>
              {floors.map(f => <option key={f._id} value={f._id}>{f.floor_name}</option>)}
            </select>
            <Icon icon="solar:arrow-right-linear" className="text-slate-600 text-xs" />
            <select
              className="bg-white/5 border border-white/5 rounded py-2 px-4 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer min-w-[140px] appearance-none"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              disabled={!selectedFloor}
            >
              <option value="" disabled>Sector</option>
              {zones.map(z => <option key={z._id} value={z._id}>{z.zone_name}</option>)}
            </select>
          </div>
          </div>
        </header>

        <div className="rounded-[3rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden p-8 relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
            </div>
          )}

          {!selectedZone ? (
            <div className="text-center p-10 py-20 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/5 rounded-[2rem]">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Icon icon="solar:map-point-linear" className="text-3xl text-blue-500" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Awaiting Sector selection...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Column 
                title="Available Slots" 
                status="available" 
                slots={availableSlots} 
                onDrop={updateSlotStatus}
                icon="solar:check-circle-bold-duotone"
                colorClass="blue"
              />
              <Column 
                title="Reserved" 
                status="reserved" 
                slots={reservedSlots} 
                onDrop={updateSlotStatus}
                icon="solar:lock-keyhole-bold-duotone"
                colorClass="purple"
              />
              <Column 
                title="Maintained" 
                status="maintained" 
                slots={maintainedSlots} 
                onDrop={updateSlotStatus}
                icon="solar:settings-bold-duotone"
                colorClass="amber"
              />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
