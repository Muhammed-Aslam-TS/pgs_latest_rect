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

const StatCard = ({ label, value, icon, color = "blue", sub }) => {
    const colorMap = {
        blue: "text-blue-400 from-blue-500/20",
        emerald: "text-emerald-400 from-emerald-500/20",
        rose: "text-rose-400 from-rose-500/20",
        amber: "text-amber-400 from-amber-500/20",
    };
    return (
        <PremiumCard glowColor={color}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded bg-gradient-to-br ${colorMap[color]} to-transparent`}>
                    <Icon icon={icon} className={`text-xl ${colorMap[color].split(' ')[0]}`} />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <h3 className="text-2xl font-black text-white">{value}</h3>
                {sub && <p className="text-xs text-slate-500 font-medium">{sub}</p>}
            </div>
        </PremiumCard>
    );
};

/* ─── Main Displays Component ─────────────────────────────────── */

const Displays = () => {
    const [displays, setDisplays] = useState([]);
    const [parkings, setParkings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [filterParking, setFilterParking] = useState("all");
    const [filterFloor, setFilterFloor] = useState("all");

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
            setDisplays([]);
            setParkings([]);
            setFloors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this display?")) return;
        try {
            await apiService.delete(endpoints.displays.delete(id));
            toast.success("Display removed");
            fetchInitialData();
        } catch {
            toast.error("Deletion failed");
        }
    };

    // Derived filtered list with normalized field access
    const filteredDisplays = useMemo(() => {
        return displays.filter(d => {
            const pId = d.parking_id || d.parkingId;
            const fId = (d.display_connections_id && d.display_connections_id[0]) || d.floorId;
            const matchParking = filterParking === "all" || pId == filterParking;
            const matchFloor = filterFloor === "all" || fId == filterFloor;
            return matchParking && matchFloor;
        });
    }, [displays, filterParking, filterFloor]);

    // Grouping logic for the summary view
    const groupedData = useMemo(() => {
        const groups = {};
        filteredDisplays.forEach(display => {
            const pId = display.parking_id || display.parkingId || "unassigned";
            const fId = (display.display_connections_id && display.display_connections_id[0]) || display.floorId || "unassigned";

            if (!groups[pId]) {
                const matchedParking = parkings.find(p => (p._id || p.id || p.parking_id) == pId);
                groups[pId] = { name: matchedParking?.name || matchedParking?.parking_name || "Unknown Parking", floors: {} };
            }
            if (!groups[pId].floors[fId]) groups[pId].floors[fId] = { name: floors.find(f => (f._id || f.id) == fId)?.floor_name || "General Area", items: [] };

            groups[pId].floors[fId].items.push(display);
        });
        return groups;
    }, [filteredDisplays, parkings, floors]);

    if (loading) return <Loader message="Accessing Hardware Nodes..." />;

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-[#0f172a] text-white">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/5 rounded blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-blue-500 rounded" />
                            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Display Monitoring</h1>
                            <Link
                                to="/admin/configpgs"
                                className="ml-4 flex items-center gap-2 px-4 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                            >
                                <Icon icon="solar:settings-bold" />
                                Configure
                            </Link>
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/20">
                                <div className="w-1.5 h-1.5 rounded bg-[#10b981] animate-pulse" />
                                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">Live Monitoring</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm font-medium ml-4 tracking-wide italic">Configure and monitor your premises' digital signage based on parking levels.</p>
                    </motion.div>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Filter Parking</label>
                            <select
                                value={filterParking}
                                onChange={(e) => { setFilterParking(e.target.value); setFilterFloor("all"); }}
                                className="bg-[#1e293b]/50 border border-white/10 rounded px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 min-w-[160px]"
                            >
                                <option value="all">All Parkings</option>
                                {parkings.map(p => <option key={p._id || p.parking_id || p.id} value={p._id || p.parking_id || p.id}>{p.parking_name || p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Filter Floor</label>
                            <select
                                value={filterFloor}
                                onChange={(e) => setFilterFloor(e.target.value)}
                                className="bg-[#1e293b]/50 border border-white/10 rounded px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 min-w-[160px]"
                            >
                                <option value="all">All Floors</option>
                                {floors.filter(f => filterParking === "all" || (f.parking_id || f.parkingId) == filterParking).map(f => (
                                    <option key={f._id || f.id} value={f._id || f.id}>{f.floor_name || f.name || f.title}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => { setFilterParking("all"); setFilterFloor("all"); }}
                            className="mt-5 p-2 rounded bg-white/5 text-slate-400 hover:text-white transition-colors border border-white/5"
                            title="Reset Filters"
                        >
                            <Icon icon="solar:restart-bold" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Total (Filtered)" value={filteredDisplays.length} icon="solar:display-bold-duotone" color="blue" />
                    <StatCard label="Active Nodes" value={filteredDisplays.filter(d => (d.status === 'Online' || d.currentValue > 0)).length} icon="solar:check-circle-bold-duotone" color="emerald" />
                    <StatCard label="Offline" value={filteredDisplays.filter(d => d.status === 'Offline').length} icon="solar:danger-bold-duotone" color="rose" />
                    <StatCard label="Avg Refresh" value="120ms" icon="solar:history-bold-duotone" color="amber" sub="Low Latency" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12 space-y-12">
                        {Object.keys(groupedData).length > 0 ? Object.entries(groupedData).map(([pId, parkingEntry]) => (
                            <div key={pId} className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                        Parking: {parkingEntry.name}
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
                                </div>

                                {Object.entries(parkingEntry.floors).map(([fId, floorEntry]) => (
                                    <div key={fId} className="space-y-4">
                                        <div className="flex items-center gap-3 ml-4">
                                            <Icon icon="solar:floor-plan-bold-duotone" className="text-emerald-500 text-lg" />
                                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">{floorEntry.name}</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 ml-4">
                                            <AnimatePresence mode="popLayout">
                                                {floorEntry.items.map((display) => (
                                                    <motion.div
                                                        key={display._id || display.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.9 }}
                                                    >
                                                        <PremiumCard glowColor={(display.status === 'Online' || (display.current_value || display.currentValue) > 0) ? 'emerald' : 'rose'}>
                                                            <div className="flex justify-between items-start mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-3 h-3 rounded ${(display.status === 'Online' || (display.current_value || display.currentValue) > 0) ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                                    <div>
                                                                        <h4 className="text-base font-bold text-white whitespace-nowrap">{display.display_name || display.name}</h4>
                                                                        <p className="text-[10px] font-mono text-slate-500">ID: {display.display_id || display.displayId} • {parkingEntry.name}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleDelete(display._id || display.id)} className="p-2 rounded bg-white/5 text-slate-400 hover:text-rose-400 border border-white/5 transition-all">
                                                                        <Icon icon="solar:trash-bin-trash-bold-duotone" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="relative h-32 w-full bg-[#0a0f1e] border-4 border-[#1e293b] rounded overflow-hidden shadow-inner flex flex-col items-center justify-center mb-6">
                                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                                                                <div className="text-center space-y-1 relative z-10">
                                                                    <div className="text-emerald-500 font-mono text-3xl font-black tracking-widest drop-shadow-[0_0_8px_#10b981]">
                                                                        {String(display.current_value || display.currentValue || '000').padStart(3, '0')}
                                                                    </div>
                                                                    <div className="text-emerald-500/80 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                                                                        {display.unitType || 'SPACES FREE'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">IP Address</p>
                                                                    <p className="text-xs text-slate-300 font-mono">{display.display_ipaddress || display.ipAddress}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">Level</p>
                                                                    <p className="text-xs text-slate-300 truncate">{floorEntry.name}</p>
                                                                </div>
                                                            </div>
                                                        </PremiumCard>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )) : (
                            <div className="col-span-full py-20 text-center">
                                <Icon icon="solar:display-broken-bold-duotone" className="text-5xl text-slate-700 mx-auto mb-4" />
                                <h4 className="text-lg font-bold text-slate-500">No Displays Found</h4>
                                <p className="text-slate-600 text-sm">No hardware nodes found for your parking floors.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Displays;
