import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReusableTable from "../../components/common/reusableTable";
import CrudModal from "../../components/common/CrudModal";
import { apiService } from "../../services/api";
import { Icon } from "@iconify/react";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Zones() {
  const [loading, setLoading] = useState(false);
  const [parkings, setParkings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParkingId = searchParams.get("parkingId") || "";
  const initialFloorId = searchParams.get("floorId") || "";

  const [selectedParking, setSelectedParking] = useState(initialParkingId);
  const [selectedFloor, setSelectedFloor] = useState(initialFloorId);
  const [data, setData] = useState([]);
  const [currentPage] = useState(1);
  const [pageSize] = useState(10);
  const [rowsToAdd, setRowsToAdd] = useState(0);

  // CRUD modal state
  const [editItem, setEditItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      const res = await apiService.get("/api/parkings");
      setParkings(res.data || []);
    } catch (error) {
      showErrorToast("Failed to fetch vessel hubs.");
    }
  };

  const fetchFloors = async (parkingId) => {
    if (!parkingId) return;
    try {
      const res = await apiService.get(`/api/floors/${parkingId}`);
      setFloors(res.data || res.floors_data || []);
    } catch (error) {
      console.error("Fetch Floors Error:", error);
      setFloors([]);
    }
  };

  const fetchZones = async (floorId) => {
    if (!floorId) return;
    setLoading(true);
    try {
      const res = await apiService.get(`/api/zones/${floorId}`);
      const fetchedData = res.data || [];
      
      // Auto-generate drafts if fetched count is less than floor.total_zones
      const floor = floors.find(f => f._id === floorId);
      if (floor && floor.total_zones > fetchedData.length) {
        const missingCount = floor.total_zones - fetchedData.length;
        const newRows = Array.from({ length: missingCount }, (_, i) => ({
          zone_number: fetchedData.length + i + 1,
          zone_name: `Zone ${String.fromCharCode(65 + fetchedData.length + i)}`,
          total_spaces: 0,
          isNew: true,
        }));
        setData([...fetchedData, ...newRows]);
      } else {
        setData(fetchedData);
      }
    } catch (error) {
      console.error("Fetch Zones Error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedParking) {
      fetchFloors(selectedParking);
      setSelectedFloor("");
    } else {
      setFloors([]);
    }
  }, [selectedParking]);

  useEffect(() => {
    if (selectedFloor) {
      fetchZones(selectedFloor);
    } else {
      setData([]);
    }
  }, [selectedFloor]);

  const handleAddRows = () => {
    if (!selectedFloor) {
      showErrorToast("Mission requires a Level selection first.");
      return;
    }
    const count = parseInt(rowsToAdd);
    if (isNaN(count) || count <= 0) return;

    const newRows = Array.from({ length: count }, (_, i) => ({
      zone_number: data.length + i + 1,
      zone_name: "",
      total_spaces: 0,
      isNew: true,
    }));

    setData((prev) => [...prev, ...newRows]);
    setRowsToAdd(0);
  };

  const handleInputChange = (index, field, value) => {
    setData((prev) => {
      const newData = [...prev];
      newData[index][field] = value;
      return newData;
    });
  };

  const handleSaveAll = async () => {
    const newItems = data.filter(item => item.isNew);
    if (newItems.length === 0) return;

    if (newItems.some(i => !i.zone_name || i.total_spaces <= 0)) {
      showErrorToast("Incomplete sector data detected.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        zone_numbers: newItems.map(i => i.zone_number),
        zone_names: newItems.map(i => i.zone_name),
        total_spaces: newItems.map(i => parseInt(i.total_spaces)),
        floor_id: selectedFloor,
        parking_id: selectedParking,
      };

      const res = await apiService.post("/api/zones", payload);
      showSuccessToast(res.message || "Sectors deployed successfully.");
      fetchZones(selectedFloor);
    } catch (error) {
      showErrorToast("Sector deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD handlers ---
  const handleEdit = (row) => {
    setEditItem({
      _id: row._id,
      zone_name: row.zone_name || "",
      total_spaces: row.total_spaces || 0,
    });
    setShowEditModal(true);
  };

  const handleEditSave = async (formData) => {
    setEditLoading(true);
    try {
      const res = await apiService.put(`/api/zones/${formData._id}`, {
        zone_name: formData.zone_name,
        total_spaces: parseInt(formData.total_spaces),
      });
      showSuccessToast(res.message || "Zone updated successfully.");
      setShowEditModal(false);
      setEditItem(null);
      fetchZones(selectedFloor);
    } catch (error) {
      showErrorToast("Failed to update zone.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.zone_name}"?\n\nThis will also remove all associated spaces.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await apiService.delete(`/api/zones/${row._id}`);
      showSuccessToast(res.message || "Zone deleted successfully.");
      fetchZones(selectedFloor);
    } catch (error) {
      showErrorToast("Failed to delete zone.");
    } finally {
      setLoading(false);
    }
  };

  const editFields = [
    { key: "_id", label: "Record ID", disabled: true },
    { key: "zone_name", label: "Zone Designation", placeholder: "e.g. Zone A (North)" },
    { key: "total_spaces", label: "Allocation Count", type: "number" },
  ];

  const currentFloor = floors.find(f => f._id === selectedFloor);

  const columns = useMemo(() => [
    {
      header: "Sector ID",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-purple-400">SEC-{row.zone_number}</span>
          {row.isNew && <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-black uppercase">Draft</span>}
        </div>
      )
    },
    {
      header: "Zone Designation",
      accessor: (row, index) => (
        <input
          className={`w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-bold text-white transition-all outline-none ${!row.isNew ? "opacity-60 bg-transparent border-transparent" : "hover:bg-white/10 focus:border-purple-500/50"
            }`}
          disabled={!row.isNew}
          placeholder="e.g. Zone A (North)"
          value={row.zone_name}
          onChange={(e) => handleInputChange(index, "zone_name", e.target.value)}
        />
      )
    },
    {
      header: "Allocation Count",
      accessor: (row, index) => (
        <input
          type="number"
          className={`w-24 bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-mono font-bold text-white transition-all outline-none ${!row.isNew ? "opacity-60 bg-transparent border-transparent" : "hover:bg-white/10 focus:border-emerald-500/50"
            }`}
          disabled={!row.isNew}
          value={row.total_spaces}
          onChange={(e) => handleInputChange(index, "total_spaces", e.target.value)}
        />
      )
    },
    {
      header: "Occupancy State",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded ${row.isNew ? 'bg-amber-500/50' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${row.isNew ? 'text-slate-600' : 'text-emerald-400'}`}>
            {row.isNew ? "Pending" : "Synchronized"}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        row.isNew ? (
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Draft</span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(row)}
              className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all"
              title="Edit"
            >
              <Icon icon="solar:pen-bold-duotone" className="text-sm" />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
              title="Delete"
            >
              <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-sm" />
            </button>
          </div>
        )
      ),
    },
  ], [data]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <div className="p-2.5 bg-purple-600/20 rounded border border-purple-500/30">
              <Icon icon="solar:map-point-wave-bold-duotone" className="text-purple-500 text-2xl" />
            </div>
            Sector Allocation
          </h1>
          <p className="text-slate-500 text-sm font-medium">Coordinate specific zones within established levels</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Custom Selects Container */}
          <div className="flex items-center gap-4 bg-[#1e293b]/40 backdrop-blur-xl p-2 rounded-[2rem] border border-white/5">
            <div className="relative">
              <select
                className="bg-white/5 border border-white/10 rounded py-2 px-4 pr-10 text-[10px] font-black uppercase tracking-widest text-white appearance-none outline-none focus:border-blue-500/30 transition-all cursor-pointer min-w-[160px]"
                value={selectedParking}
                onChange={(e) => {
                  setSelectedParking(e.target.value);
                  setSearchParams({ parkingId: e.target.value });
                }}
              >
                <option value="" disabled>Select Vessel</option>
                {parkings.map(p => <option key={p._id} value={p._id}>{p.name || p.parking_name}</option>)}
              </select>
              <Icon icon="solar:alt-arrow-down-bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none" />
            </div>

            <div className="w-[1px] h-6 bg-white/10" />

            <div className="relative">
              <select
                className="bg-white/5 border border-white/10 rounded py-2 px-4 pr-10 text-[10px] font-black uppercase tracking-widest text-white appearance-none outline-none focus:border-emerald-500/30 transition-all cursor-pointer min-w-[160px]"
                value={selectedFloor}
                onChange={(e) => {
                  setSelectedFloor(e.target.value);
                  setSearchParams({ parkingId: selectedParking, floorId: e.target.value });
                }}
                disabled={!selectedParking}
              >
                <option value="" disabled>Select Level</option>
                {floors.map(f => <option key={f._id} value={f._id}>{f.floor_name}</option>)}
              </select>
              <Icon icon="solar:alt-arrow-down-bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#1e293b]/40 backdrop-blur-xl p-1.5 rounded-[1.8rem] border border-white/5">
            <input
              type="number"
              className="bg-transparent text-white px-4 py-1.5 text-xs font-bold outline-none w-16 text-center"
              value={rowsToAdd || ""}
              onChange={(e) => setRowsToAdd(e.target.value)}
              placeholder="+"
            />
            <button
              onClick={handleAddRows}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all"
            >
              New Sectors
            </button>
          </div>
        </div>
      </header>

      {currentFloor && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-[2.5rem] bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/20"
        >
          <div className="flex items-center gap-6">
            <div className="p-4 bg-purple-600/20 rounded border border-purple-500/30">
              <Icon icon="solar:bill-list-bold-duotone" className="text-2xl text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{currentFloor.floor_name} Overview</h3>
              <div className="flex gap-8 mt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available spaces: <span className="text-emerald-400">{currentFloor.free}</span></p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sectors expected: <span className="text-purple-400">{currentFloor.total_zones}</span></p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sectors active: <span className="text-blue-400">{data.filter(z => !z.isNew).length}</span></p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="rounded-[3rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden p-8 relative">
        {loading && !data.length && (
          <div className="absolute inset-0 z-10 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded animate-spin" />
          </div>
        )}

        <ReusableTable
          columns={columns}
          data={data}
          currentPage={currentPage}
          pageSize={pageSize}
          message={selectedFloor ? "No sectors defined for current level." : "Terminal awaiting Level selection..."}
        />

        <AnimatePresence>
          {data.some(i => i.isNew) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="mt-10 flex justify-end gap-4"
            >
              <button
                onClick={() => setData(data.filter(i => !i.isNew))}
                className="px-8 py-3 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
              >
                Wipe Local Data
              </button>
              <button
                disabled={loading}
                onClick={handleSaveAll}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-10 py-4 rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-500/20 flex items-center gap-3"
              >
                {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded animate-spin" />}
                Deploy Sectors
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <CrudModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditItem(null); }}
        onSave={handleEditSave}
        title="Edit Zone"
        fields={editFields}
        initialData={editItem}
        loading={editLoading}
        accentColor="purple"
      />
    </div>
  );
}
