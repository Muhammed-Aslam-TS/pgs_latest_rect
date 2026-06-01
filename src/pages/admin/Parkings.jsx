import { useEffect, useMemo, useState } from "react";
import ReusableTable from "../../components/common/reusableTable";
import CrudModal from "../../components/common/CrudModal";
import { apiService } from "../../services/api";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

export default function Parkings() {
  const [loading, setLoading] = useState(false);
  const [parkingsCount, setParkingsCount] = useState(0);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // CRUD modal state
  const [editItem, setEditItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const getAllParkings = async () => {
    setLoading(true);
    try {
      const res = await apiService.get("/api/parkings");
      setData(res.data || []);
    } catch (error) {
      console.error("Fetch Parkings Error:", error);
      showErrorToast("Failed to fetch parkings from system.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllParkings();
  }, []);

  const handleAddRows = () => {
    const count = parseInt(parkingsCount);
    if (isNaN(count) || count <= 0) {
      showErrorToast("Please enter a valid number of parkings.");
      return;
    }

    const newRows = Array.from({ length: count }, (_, i) => ({
      id: data.length + i + 1,
      name: "",
      total_floors: 0,
      total_spaces: 0,
      isNew: true,
    }));

    setData((prev) => [...prev, ...newRows]);
    setParkingsCount(0);
  };

  const handleInputChange = (index, field, value) => {
    setData((prevData) => {
      const newData = [...prevData];
      newData[index][field] = value;
      return newData;
    });
  };

  const handleSaveAll = async () => {
    const newItems = data.filter(item => item.isNew);
    if (newItems.length === 0) {
      showErrorToast("No new parkings to save.");
      return;
    }

    const invalid = newItems.some(item => !item.name || item.total_floors <= 0 || item.total_spaces <= 0);
    if (invalid) {
      showErrorToast("Please fill all fields with valid data for new parkings.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        parking_ids: newItems.map(item => item.id),
        parking_names: newItems.map(item => item.name),
        floors: newItems.map(item => parseInt(item.total_floors)),
        spaces: newItems.map(item => parseInt(item.total_spaces)),
      };

      const response = await apiService.post("/api/parkings", payload);
      if (response && response.message) {
        showSuccessToast(response.message);
        getAllParkings();
      }
    } catch (error) {
      console.error("Save Parkings Error:", error);
      showErrorToast("System failed to enroll new parkings.");
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD handlers ---
  const handleEdit = (row) => {
    setEditItem({
      _id: row._id,
      name: row.name || row.parking_name || "",
      total_floors: row.total_floors || 0,
      total_spaces: row.total_spaces || 0,
    });
    setShowEditModal(true);
  };

  const handleEditSave = async (formData) => {
    setEditLoading(true);
    try {
      const res = await apiService.put(`/api/parkings/${formData._id}`, {
        name: formData.name,
        total_floors: parseInt(formData.total_floors),
        total_spaces: parseInt(formData.total_spaces),
      });
      showSuccessToast(res.message || "Parking updated successfully.");
      setShowEditModal(false);
      setEditItem(null);
      getAllParkings();
    } catch (error) {
      showErrorToast("Failed to update parking.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.name || row.parking_name}"?\n\nThis will also remove all associated floors, zones, and spaces.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await apiService.delete(`/api/parkings/${row._id}`);
      showSuccessToast(res.message || "Parking deleted successfully.");
      getAllParkings();
    } catch (error) {
      showErrorToast("Failed to delete parking.");
    } finally {
      setLoading(false);
    }
  };

  const editFields = [
    { key: "_id", label: "Record ID", disabled: true },
    { key: "name", label: "Vessel Name", placeholder: "e.g. Alpha Terminal" },
    { key: "total_floors", label: "Total Floors", type: "number" },
    { key: "total_spaces", label: "Max Capacity", type: "number" },
  ];

  const columns = useMemo(
    () => [
      {
        header: "Parking ID",
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-400">#{row.id}</span>
            {row.isNew && (
              <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase font-black">Draft</span>
            )}
          </div>
        ),
      },
      {
        header: "Vessel Name (Parking)",
        accessor: (row, index) => (
          <input
            className={`w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-bold text-white transition-all focus:border-blue-500/50 outline-none ${!row.isNew ? "opacity-60 cursor-not-allowed bg-transparent border-transparent" : "hover:bg-white/10"
              }`}
            disabled={!row.isNew}
            type="text"
            placeholder="e.g. Alpha Terminal"
            value={row.name || row.parking_name || ""}
            onChange={(e) => handleInputChange(index, "name", e.target.value)}
          />
        ),
      },
      {
        header: "Floors",
        accessor: (row, index) => (
          <input
            type="number"
            className={`w-24 bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-mono font-bold text-white transition-all focus:border-emerald-500/50 outline-none ${!row.isNew ? "opacity-60 cursor-not-allowed bg-transparent border-transparent" : "hover:bg-white/10"
              }`}
            disabled={!row.isNew}
            value={row.total_floors}
            onChange={(e) => handleInputChange(index, "total_floors", e.target.value)}
          />
        ),
      },
      {
        header: "Max Capacity",
        accessor: (row, index) => (
          <input
            type="number"
            className={`w-32 bg-white/5 border border-white/10 rounded px-4 py-2 text-xs font-mono font-bold text-white transition-all focus:border-purple-500/50 outline-none ${!row.isNew ? "opacity-60 cursor-not-allowed bg-transparent border-transparent" : "hover:bg-white/10"
              }`}
            disabled={!row.isNew}
            value={row.total_spaces}
            onChange={(e) => handleInputChange(index, "total_spaces", e.target.value)}
          />
        ),
      },
      {
        header: "Status",
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded ${row.isNew ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${row.isNew ? 'text-amber-500' : 'text-emerald-500'}`}>
              {row.isNew ? "Pending Review" : "System Live"}
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
                className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all"
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
    ],
    [data]
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <div className="p-2.5 bg-blue-600/20 rounded border border-blue-500/30">
              <Icon icon="solar:parking-bold-duotone" className="text-blue-500 text-2xl" />
            </div>
            Vessel Registry
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Provision and manage new parking facilities</p>
        </div>

        <div className="flex items-center gap-3 bg-[#1e293b]/40 backdrop-blur-xl p-2 rounded-[2rem] border border-white/5">
          <input
            className="bg-transparent text-white px-5 py-2.5 text-xs font-bold outline-none border-none placeholder:text-slate-600 w-48"
            placeholder="Count of Units..."
            type="number"
            value={parkingsCount || ""}
            onChange={(e) => setParkingsCount(e.target.value)}
          />
          <button
            onClick={handleAddRows}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
          >
            Add Units
          </button>
        </div>
      </header>

      <div className="rounded-[3rem] bg-[#1e293b]/40 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden p-8">
        <ReusableTable
          columns={columns}
          data={data}
          currentPage={currentPage}
          pageSize={pageSize}
          message="No active units detected in registry."
        />

        <AnimatePresence>
          {data.some(i => i.isNew) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-10 flex justify-end gap-4"
            >
              <button
                onClick={() => setData(data.filter(i => !i.isNew))}
                className="px-8 py-3 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
              >
                Discard Drafts
              </button>
              <button
                disabled={loading}
                onClick={handleSaveAll}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-10 py-4 rounded text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3"
              >
                {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded animate-spin" />}
                Commit to Core
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
        {[
          { label: "Registry Health", value: "Optimal", icon: "solar:shield-check-bold-duotone", color: "text-emerald-400" },
          { label: "Sync Latency", value: "< 24ms", icon: "solar:bolt-bold-duotone", color: "text-blue-400" },
          { label: "Total Capacity", value: data.reduce((acc, curr) => acc + (curr.total_spaces || 0), 0), icon: "solar:database-bold-duotone", color: "text-purple-400" }
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/5 border border-white/5">
            <Icon icon={stat.icon} className={`text-2xl ${stat.color}`} />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
              <p className="text-lg font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <CrudModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditItem(null); }}
        onSave={handleEditSave}
        title="Edit Parking"
        fields={editFields}
        initialData={editItem}
        loading={editLoading}
        accentColor="blue"
      />
    </div>
  );
}
