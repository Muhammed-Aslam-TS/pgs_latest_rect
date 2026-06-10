import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import EntryExitReport from "../reports/legacy/EntryExitReport";
import DailyOccupancyChart from "../reports/legacy/OccupancyReport";
import { useState, useEffect } from "react";
import { apiService, endpoints } from "../../services/api";
import { initSocket } from "../../services/socket";

const StatCard = ({ title, value, color, icon, detail }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="relative group p-6 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-all shadow-sm flex-1"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded bg-${color}-500/10`}>
                <Icon icon={icon} className={`text-2xl text-${color}-400`} />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 border border-white/10">
                <span className={`w-1.5 h-1.5 rounded bg-${color}-500 animate-pulse`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live</span>
            </div>
        </div>
        <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-4xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{detail}</p>
            <Icon icon="solar:alt-arrow-right-linear" className="text-slate-600 group-hover:text-white transition-all" />
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hardcoded logs for now since no specific endpoint was verified
    const [logs, setLogs] = useState([
        { vehicle: "TN-01-AX-4231", time: "12:14 PM", status: "ENTRY", gate: "Main North Gate" },
        { vehicle: "PY-01-BZ-1122", time: "12:08 PM", status: "EXIT", gate: "South Exit Hub" },
        { vehicle: "KA-05-MM-9900", time: "11:55 AM", status: "ENTRY", gate: "Level 1 Transit" },
        { vehicle: "DL-03-CC-5566", time: "11:42 AM", status: "ENTRY", gate: "B2 Ramp Gate" },
    ]);

    const fetchData = async () => {
        try {
            const data = await apiService.get(endpoints.spaces.getList);
            if (data && data.data) {
                setSpaces(data.data);
            }
        } catch (err) {
            console.error("Error fetching spaces for dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const socket = initSocket();
        if (socket) {
            socket.on('dashboard', (msg) => {
                // If dashboard socket sends an update, re-fetch spaces
                fetchData();
            });
            socket.on('spaceUpdate', () => {
                fetchData();
            });
        }
        return () => {
            if (socket) {
                socket.off('dashboard');
                socket.off('spaceUpdate');
            }
        };
    }, []);

    const totalCapacity = spaces.length;
    const occupiedSlots = spaces.filter(s => s.device_occupied).length;
    const availableNow = totalCapacity - occupiedSlots;
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedSlots / totalCapacity) * 100) : 0;

    const stats = [
        { title: "Total Capacity", value: loading ? "..." : totalCapacity, color: "blue", icon: "solar:parking-linear", detail: "Across all active hubs" },
        { title: "Occupied Slots", value: loading ? "..." : occupiedSlots, color: "rose", icon: "solar:signpost-linear", detail: `Real-time occupancy at ${occupancyRate}%` },
        { title: "Available Now", value: loading ? "..." : availableNow, color: "emerald", icon: "solar:leaf-linear", detail: "Ready for traffic influx" },
    ];

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/10 rounded border border-blue-500/20">
                            <Icon icon="solar:widget-linear" className="text-blue-500" />
                        </div>
                        Operational Overview
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Command Center Status: All systems synchronized.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1 rounded border border-white/5">
                    <button className="px-5 py-2.5 rounded hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all">Export Report</button>
                    <button onClick={fetchData} className="px-5 py-2.5 rounded bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2">
                        <Icon icon="solar:restart-linear" className={loading ? "animate-spin" : ""} />
                        System Sync
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6">
                {stats.map((s, idx) => <StatCard key={idx} {...s} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                <div className="lg:col-span-8 space-y-8">
                    <div className="p-6 md:p-8 rounded-[2rem] bg-white/5 border border-white/5 shadow-sm overflow-x-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-4">
                            <div className="flex items-center gap-3">
                                <Icon icon="solar:graph-up-linear" className="text-blue-500 text-xl" />
                                <h2 className="text-lg font-bold text-white tracking-tight">Real-time Traffic Flow</h2>
                            </div>
                            <select className="bg-transparent border-none text-xs font-bold text-slate-500 focus:ring-0 cursor-pointer">
                                <option>Last 24 Hours</option>
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                        <EntryExitReport />
                    </div>

                    <div className="p-6 md:p-8 rounded-[2rem] bg-white/5 border border-white/5 shadow-sm overflow-x-auto">
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                            <Icon icon="solar:pie-chart-linear" className="text-emerald-500 text-xl" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Sector Utilization Analysis</h2>
                        </div>
                        <DailyOccupancyChart />
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="sticky top-24 p-6 md:p-8 rounded-[2rem] bg-[#0b0f1a] border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Recent Activity</h2>
                            <Icon icon="solar:tuning-linear" className="text-slate-600 cursor-pointer hover:text-white" />
                        </div>
                        <div className="space-y-3">
                            {logs.map((log, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded ${log.status === 'ENTRY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            <Icon icon={log.status === 'ENTRY' ? 'solar:login-3-linear' : 'solar:logout-3-linear'} className="text-lg" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white tracking-tight">{log.vehicle}</p>
                                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{log.gate}</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-slate-400">{log.time}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-4 rounded border border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                            View Comprehensive Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
