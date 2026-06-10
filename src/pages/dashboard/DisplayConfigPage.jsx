import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { apiService, endpoints } from "../../services/api";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

/* ─── Shared UI Components ────────────────────────────────────── */

const PremiumCard = ({ children, className = "", glowColor = "blue" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded border border-white/5 bg-[#0f172a]/40 backdrop-blur-xl transition-all duration-300 hover:border-white/10 ${className}`}
    >
        <div className={`absolute -right-20 -top-20 h-40 w-40 rounded bg-${glowColor}-500/10 blur-[80px]`} />
        <div className={`absolute -bottom-20 -left-20 h-40 w-40 rounded bg-${glowColor}-500/5 blur-[80px]`} />
        <div className="relative z-10 p-5 sm:p-6">
            {children}
        </div>
    </motion.div>
);

const DisplayConfigPage = () => {
    const [displays, setDisplays] = useState([]);
    const [parkings, setParkings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        display_name: "",
        display_ipaddress: "",
        display_id: "",
        location: "",
        parking_id: "",
        display_connections_id: [],
        display_type: "floor"
    });
    const [isEditing, setIsEditing] = useState(null);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [dispRes, parkRes, floorRes] = await Promise.allSettled([
                apiService.get("/api/displays"),
                apiService.get("/api/parkings"),
                apiService.get("/api/floors")
            ]);

            setDisplays(dispRes.status === 'fulfilled' ? (dispRes.value.data || dispRes.value) : []);
            setParkings(parkRes.status === 'fulfilled' ? (parkRes.value.data || parkRes.value.parkings || []) : []);
            setFloors(floorRes.status === 'fulfilled' ? (floorRes.value.data || floorRes.value.floors || []) : []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (formData.parking_id) {
            apiService.get(`/api/zones/parking/${formData.parking_id}`)
                .then(res => {
                    const fetchedZones = Array.isArray(res.data) ? res.data.flat() : [];
                    setZones(fetchedZones);
                })
                .catch(() => setZones([]));
        } else {
            setZones([]);
        }
    }, [formData.parking_id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "display_connections_id") {
            setFormData(prev => ({ ...prev, display_connections_id: [value] }));
        } else if (name === "display_type") {
            setFormData(prev => ({ ...prev, display_type: value, display_connections_id: [] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                display_connections_name: formData.display_type === "zone"
                    ? zones.filter(z => formData.display_connections_id.includes(z._id || z.id)).map(z => z.zone_name || z.name)
                    : floors.filter(f => formData.display_connections_id.includes(f._id || f.id)).map(f => f.floor_name || f.name)
            };

            if (isEditing) {
                await apiService.put(endpoints.displays.update(isEditing), payload);
                toast.success("Display updated successfully");
            } else {
                await apiService.post("/api/display", payload);
                toast.success("Display added successfully");
            }
            setFormData({ display_name: "", display_ipaddress: "", display_id: "", location: "", parking_id: "", display_connections_id: [], display_type: "floor" });
            setIsEditing(null);
            fetchInitialData();
        } catch (err) {
            toast.error("Process failed.");
        }
    };

    const handleEdit = (display) => {
        setFormData({
            display_name: display.display_name || display.name,
            display_ipaddress: display.display_ipaddress || display.ipAddress,
            display_id: display.display_id || display.displayId,
            location: display.location || "",
            parking_id: display.parking_id || display.parkingId || "",
            display_connections_id: display.display_connections_id || [display.floorId] || [],
            display_type: (display.display_type === "1" || !display.display_type) ? "floor" : display.display_type
        });
        setIsEditing(display._id || display.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await apiService.delete(endpoints.displays.delete(id));
            toast.success("Removed");
            fetchInitialData();
        } catch {
            toast.error("Failed");
        }
    };

    if (loading) return <Loader message="Loading Configurations..." />;

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-[#0f172a] text-white">
            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-3">
                                <Icon icon="solar:settings-bold-duotone" className="text-blue-500" />
                                Hardware Configuration
                            </h1>
                            <Link
                                to="/Displays"
                                className="flex items-center gap-2 px-4 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                            >
                                <Icon icon="solar:monitor-bold" />
                                Live Monitoring
                            </Link>
                        </div>
                        <p className="text-slate-400 text-sm mt-2">Manage and register digital signage hardware nodes.</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-4">
                        <PremiumCard className="sticky top-24">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Icon icon={isEditing ? "solar:pen-new-square-bold-duotone" : "solar:add-circle-bold-duotone"} className="text-blue-400" />
                                {isEditing ? "Edit Node" : "Register New Node"}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5 pb-2 border-b border-white/5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Display Scope</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                            <input type="radio" name="display_type" value="floor" checked={formData.display_type === "floor"} onChange={handleInputChange} className="accent-blue-500" />
                                            Floor-Based
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                                            <input type="radio" name="display_type" value="zone" checked={formData.display_type === "zone"} onChange={handleInputChange} className="accent-blue-500" />
                                            Sector-Based
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Display Name</label>
                                    <input
                                        type="text" name="display_name" value={formData.display_name} onChange={handleInputChange} required
                                        className="w-full bg-white/5 border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">IP Address</label>
                                    <input
                                        type="text" name="display_ipaddress" value={formData.display_ipaddress} onChange={handleInputChange} required
                                        className="w-full bg-white/5 border border-white/10 rounded px-4 py-2.5 text-sm text-white focus:border-blue-500/50 outline-none font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Parking</label>
                                        <select
                                            name="parking_id" value={formData.parking_id} onChange={handleInputChange} required
                                            className="w-full bg-[#1e293b] border border-white/10 rounded px-4 py-2.5 text-sm"
                                        >
                                            <option value="">Select</option>
                                            {parkings.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name || p.parking_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">{formData.display_type === "zone" ? "Sector" : "Floor"}</label>
                                        <select
                                            name="display_connections_id" value={formData.display_connections_id[0] || ""} onChange={handleInputChange} required
                                            className="w-full bg-[#1e293b] border border-white/10 rounded px-4 py-2.5 text-sm"
                                        >
                                            <option value="">Select</option>
                                            {formData.display_type === "zone" ? (
                                                zones.map(z => (
                                                    <option key={z._id || z.id} value={z._id || z.id}>{z.zone_name}</option>
                                                ))
                                            ) : (
                                                floors.filter(f => !formData.parking_id || f.parking_id == formData.parking_id).map(f => (
                                                    <option key={f._id || f.id} value={f._id || f.id}>{f.floor_name}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Hardware ID</label>
                                        <input
                                            type="number" name="display_id" value={formData.display_id} onChange={handleInputChange} required
                                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-2.5 text-sm text-white font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                                        <input
                                            type="text" name="location" value={formData.location} onChange={handleInputChange} required
                                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-2.5 text-sm text-white"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 mt-2 rounded bg-blue-600 text-white text-sm font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
                                    {isEditing ? "Save Changes" : "Register Node"}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button" onClick={() => { setIsEditing(null); setFormData({ display_name: "", display_ipaddress: "", display_id: "", location: "", parking_id: "", display_connections_id: [], display_type: "floor" }); }}
                                        className="w-full py-2 text-xs font-bold text-slate-400"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </form>
                        </PremiumCard>
                    </div>

                    {/* Table/List Section */}
                    <div className="lg:col-span-8">
                        <PremiumCard>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Display</th>
                                            <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Configuration</th>
                                            <th className="pb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {displays.map((d) => (
                                            <tr key={d._id || d.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-2">
                                                    <div className="font-bold text-white">{d.display_name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono italic">{d.display_ipaddress}</div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <div className="text-xs text-slate-300">
                                                        {(() => {
                                                            const p = parkings.find(p => (p._id || p.id) == d.parking_id);
                                                            return p?.name || p?.parking_name || "Unknown";
                                                        })()}
                                                    </div>
                                                    <div className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter">
                                                        {d.display_type === "zone" ? "Sector: " : "Floor: "}
                                                        {d.display_connections_name?.[0] || 'Unassigned'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleEdit(d)} className="p-2 rounded bg-blue-500/10 text-blue-400 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Icon icon="solar:pen-bold" />
                                                        </button>
                                                        <button onClick={() => handleDelete(d._id || d.id)} className="p-2 rounded bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                                                            <Icon icon="solar:trash-bin-trash-bold" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisplayConfigPage;
