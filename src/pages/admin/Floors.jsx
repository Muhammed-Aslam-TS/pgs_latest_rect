import { useMemo, useState, useEffect } from "react";
import ReusableTable from "../../components/common/reusableTable";
import CrudModal from "../../components/common/CrudModal";
import { apiService } from "../../services/api";
import { Icon } from "@iconify/react";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Floors() {
  const [loading, setLoading] = useState(false);
  const [selectedParking, setSelectedParking] = useState("");
  const [parkings, setParkings] = useState([]);
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
      showErrorToast("Failed to initialize vessel parkings.");
    }
  };

  const fetchFloors = async (parkingId) => {
    if (!parkingId) return;
    setLoading(true);
    try {
      const res = await apiService.get(`/api/floors/${parkingId}`);
      const fetchedData = res.data || [];
      
      // Auto-generate drafts if fetched count is less than parking.total_floors
      const parking = parkings.find(p => p._id === parkingId);
      if (parking && parking.total_floors > fetchedData.length) {
        const missingCount = parking.total_floors - fetchedData.length;
        const newRows = Array.from({ length: missingCount }, (_, i) => ({
          floor_number: fetchedData.length + i + 1,
          floor_name: `Level ${fetchedData.length + i + 1}`,
          total_spaces: 0,
          total_zones: 0,
          isNew: true,
        }));
        setData([...fetchedData, ...newRows]);
      } else {
        setData(fetchedData);
      }
    } catch (error) {
      console.error("Fetch Floors Error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedParking) {
      fetchFloors(selectedParking);
    } else {
      setData([]);
    }
  }, [selectedParking]);

  const handleAddRows = () => {
    if (!selectedParking) {
      showErrorToast("Please select a parking vessel first.");
      return;
    }
    const count = parseInt(rowsToAdd);
    if (isNaN(count) || count <= 0) return;

    const newRows = Array.from({ length: count }, (_, i) => ({
      floor_number: data.length + i + 1,
      floor_name: "",
      total_spaces: 0,
      total_zones: 0,
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

    if (newItems.some(i => !i.floor_name || i.total_spaces <= 0 || i.total_zones <= 0)) {
      showErrorToast("Please populate all mission-critical fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        parking_id: selectedParking,
        floor_numbers: newItems.map(i => i.floor_number),
        floor_names: newItems.map(i => i.floor_name),
        total_spaces: newItems.map(i => parseInt(i.total_spaces)),
        total_zones: newItems.map(i => parseInt(i.total_zones)),
      };

      const response = await apiService.post("/api/floors", payload);
      showSuccessToast(response.message || "Floors deployed successfully.");
      fetchFloors(selectedParking);
    } catch (error) {
      showErrorToast("Failed to commit floor topology.");
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD handlers ---
  const handleEdit = (row) => {
    setEditItem({
      _id: row._id,
      floor_name: row.floor_name || "",
      total_zones: row.total_zones || 0,
      total_spaces: row.total_spaces || 0,
    });
    setShowEditModal(true);
  };

  const handleEditSave = async (formData) => {
    setEditLoading(true);
    try {
      const res = await apiService.put(`/api/floors/${formData._id}`, {
        floor_name: formData.floor_name,
        total_spaces: parseInt(formData.total_spaces),
        total_zones: parseInt(formData.total_zones),
      });
      showSuccessToast(res.message || "Floor updated successfully.");
      setShowEditModal(false);
      setEditItem(null);
      fetchFloors(selectedParking);
    } catch (error) {
      showErrorToast("Failed to update floor.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.floor_name}"?\n\nThis will also remove all associated zones and spaces.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await apiService.delete(`/api/floors/${row._id}`);
      showSuccessToast(res.message || "Floor deleted successfully.");
      fetchFloors(selectedParking);
    } catch (error) {
      showErrorToast("Failed to delete floor.");
    } finally {
      setLoading(false);
    }
  };

  const editFields = [
    { key: "_id", label: "Record ID", disabled: true },
    { key: "floor_name", label: "Floor Designation", placeholder: "e.g. Basement 01" },
    { key: "total_zones", label: "Total Zones", type: "number" },
    { key: "total_spaces", label: "Capacity", type: "number" },
  ];

  const currentParking = parkings.find(p => p._id === selectedParking);

  const columns = useMemo(() => [
    {
      header: "Level",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-emerald-400">LVL-{row.floor_number}</span>
          {row.isNew && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase font-black">Draft</span>}
        </div>
      )
    },
    {
      header: "Floor Designation",
      accessor: (row, index) => (
        <input
          className={`w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-bold text-white transition-all outline-none ${!row.isNew ? "opacity-60 bg-transparent border-transparent" : "hover:bg-white/10 focus:border-blue-500/50"
            }`}
          disabled={!row.isNew}
          placeholder="e.g. Basement 01"
          value={row.floor_name}
          onChange={(e) => handleInputChange(index, "floor_name", e.target.value)}
        />
      )
    },
    {
      header: "Zones",
      accessor: (row, index) => (
        <input
          type="number"
          className={`w-24 bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-mono font-bold text-white transition-all outline-none ${!row.isNew ? "opacity-60 bg-transparent border-transparent" : "hover:bg-white/10 focus:border-emerald-500/50"
            }`}
          disabled={!row.isNew}
          value={row.total_zones}
          onChange={(e) => handleInputChange(index, "total_zones", e.target.value)}
        />
      )
    },
    {
      header: "Capacity",
      accessor: (row, index) => (
        <input
          type="number"
          className={`w-24 bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-mono font-bold text-white transition-all outline-none ${!row.isNew ? "opacity-60 bg-transparent border-transparent" : "hover:bg-white/10 focus:border-purple-500/50"
            }`}
          disabled={!row.isNew}
          value={row.total_spaces}
          onChange={(e) => handleInputChange(index, "total_spaces", e.target.value)}
        />
      )
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
              className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
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
            <div className="p-2.5 bg-emerald-600/20 rounded border border-emerald-500/30">
              <Icon icon="solar:layers-bold-duotone" className="text-emerald-500 text-2xl" />
            </div>
            Topology Mapping
          </h1>
          <p className="text-slate-500 text-sm font-medium">Define levels and sectors within a vessel</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
              <Icon icon="solar:parking-bold-duotone" />
            </div>
            <select
              className="bg-[#1e293b]/60 backdrop-blur-xl border border-white/5 rounded-[1.5rem] pl-10 pr-10 py-3 text-xs font-black uppercase tracking-wider text-white appearance-none outline-none focus:border-blue-500/40 transition-all cursor-pointer min-w-[240px]"
              value={selectedParking}
              onChange={(e) => setSelectedParking(e.target.value)}
            >
              <option value="" disabled>Select Vessel Hub</option>
              {parkings.map(p => <option key={p._id} value={p._id}>{p.name || p.parking_name}</option>)}
            </select>
            <Icon icon="solar:alt-arrow-down-bold" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Add Levels
            </button>
          </div>
        </div>
      </header>

      {currentParking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Designated Vessel", value: currentParking.name, icon: "solar:buildings-bold-duotone", color: "text-blue-400" },
            { label: "Hub Capacity", value: currentParking.total_spaces, icon: "solar:users-group-rounded-bold-duotone", color: "text-purple-400" },
            { label: "Level Count", value: currentParking.total_floors, icon: "solar:layers-bold-duotone", color: "text-emerald-400" },
            { label: "Sync Status", value: "Verified", icon: "solar:shield-check-bold-duotone", color: "text-blue-400" }
          ].map((info, i) => (
            <div key={i} className="p-4 rounded bg-white/5 border border-white/5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{info.label}</span>
                <Icon icon={info.icon} className={`text-sm ${info.color}`} />
              </div>
              <p className="text-sm font-black text-white">{info.value}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="rounded-[3rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden p-8 relative">
        {loading && !data.length && (
          <div className="absolute inset-0 z-10 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded animate-spin" />
          </div>
        )}

        <ReusableTable
          columns={columns}
          data={data}
          currentPage={currentPage}
          pageSize={pageSize}
          message={selectedParking ? "No sectors defined for this level." : "Waiting for Vessel selection..."}
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
                Reset Registry
              </button>
              <button
                disabled={loading}
                onClick={handleSaveAll}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-4 rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
              >
                {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded animate-spin" />}
                Deploy Topology
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
        title="Edit Floor"
        fields={editFields}
        initialData={editItem}
        loading={editLoading}
        accentColor="emerald"
      />
    </div>
  );
}
