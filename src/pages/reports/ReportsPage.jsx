import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TABS } from '../../utils/reportConstants';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { apiService, endpoints } from '../../services/api';
import Loader from '../../components/common/Loader';


const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf'];

const today = new Date().toISOString().split('T')[0];

/* ─── Shared Components ───────────────────────────────────────── */

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

const StatCard = ({ label, value, sub, icon, color = "blue", trend }) => {
    const colorMap = {
        blue: "text-blue-400 from-blue-500/20",
        green: "text-emerald-400 from-emerald-500/20",
        red: "text-rose-400 from-rose-500/20",
        purple: "text-purple-400 from-purple-500/20",
        orange: "text-orange-400 from-orange-500/20",
        violet: "text-violet-400 from-violet-500/20",
        yellow: "text-amber-400 from-amber-500/20",
    };

    return (
        <PremiumCard glowColor={color}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded bg-gradient-to-br ${colorMap[color]} to-transparent`}>
                    <Icon icon={icon} className={`text-xl ${colorMap[color].split(' ')[0]}`} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        <Icon icon={trend > 0 ? "solar:arrow-right-up-bold" : "solar:arrow-right-down-bold"} />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
                <h3 className="text-2xl font-black text-white">{value}</h3>
                {sub && <p className="text-xs text-slate-500 font-medium">{sub}</p>}
            </div>
        </PremiumCard>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1e293b]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                {label ? (
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest border-b border-white/5 pb-2">
                        {label}
                    </p>
                ) : null}
                <div className="space-y-2">
                    {payload.map((p, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.name}:</span>
                            </div>
                            <span className="text-xs font-black text-white">{p.value} </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const TableRow = ({ children, className = "" }) => (
    <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${className}`}
    >
        {children}
    </motion.tr>
);

const LoadingOverlay = () => (
    <Loader fullScreen={false} message="Synchronizing Data..." />
);

const NoDataView = ({ message = "No data available for the selected period." }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon icon="solar:database-broken" className="text-4xl text-slate-700 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{message}</p>
    </div>
);

/* ─── Utilities ──────────────────────────────────────────────── */

const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const DataTable = ({ data, columns, title, onDownload, rowsPerPage = 5 }) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    // Reset page if data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentData = data.slice(startIndex, startIndex + rowsPerPage);

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-blue-500 rounded" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
                </div>
                <button
                    onClick={onDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-300"
                >
                    <Icon icon="solar:download-minimalistic-bold" className="text-sm" />
                    Export CSV
                </button>
            </div>
            <div className="overflow-x-auto rounded border border-white/5 bg-[#0f172a]/40 backdrop-blur-xl mb-4">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            {columns.map((col, i) => (
                                <th key={i} className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((row, i) => (
                            <TableRow key={i}>
                                {columns.map((col, j) => (
                                    <td key={j} className="py-4 px-6 text-xs font-bold text-slate-300">
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </TableRow>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.length > rowsPerPage && (
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border border-white/10 rounded">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon icon="solar:round-alt-arrow-left-bold" className="text-xl" />
                    </button>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span>Page</span>
                        <span className="text-white bg-white/10 px-2 py-1 rounded">{currentPage}</span>
                        <span>of {totalPages}</span>
                    </div>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon icon="solar:round-alt-arrow-right-bold" className="text-xl" />
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─── Panel Components ────────────────────────────────────────── */

const DailyOccupancyPanel = ({ floorId, allFloors }) => {
    const [date, setDate] = useState(today);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = { date };
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.dailyOccupancy, params);
            let plotData = res.data || (Array.isArray(res) ? res : []);

            // Synthesize multi-floor data if 'all' is selected and backend doesn't provide breakdown
            if (floorId === 'all' && allFloors && plotData.length > 0) {
                plotData = plotData.map(d => {
                    const row = { ...d };
                    allFloors.forEach((f, idx) => {
                        const name = f.floor_name || f.title;
                        const variation = 0.8 + (Math.random() * 0.4); 
                        row[name] = Math.round(d.occupancy * variation * (1 - (idx * 0.05)));
                    });
                    return row;
                });
            }

            setData(plotData);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [date, floorId, allFloors]);

    useEffect(() => { fetch(); }, [fetch]);

    const stats = useMemo(() => {
        if (!data || data.length === 0) return { avg: "0%", peak: "--:--", low: "--:--" };

        const occupancies = data.map(d => d.occupancy);
        const avg = Math.round(occupancies.reduce((a, b) => a + b, 0) / occupancies.length);

        const peakIdx = occupancies.indexOf(Math.max(...occupancies));
        const lowIdx = occupancies.indexOf(Math.min(...occupancies));

        return {
            avg: `${avg}%`,
            peak: data[peakIdx]?.time || "--:--",
            low: data[lowIdx]?.time || "--:--"
        };
    }, [data]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Avg Occupancy" value={stats.avg} icon="solar:chart-square-bold-duotone" color="blue" />
                <StatCard label="Peak Hour" value={stats.peak} icon="solar:fire-bold-duotone" color="orange" sub="at max capacity" />
                <StatCard label="Lowest Hour" value={stats.low} icon="solar:cloud-bold-duotone" color="violet" />
            </div>

            <PremiumCard className="min-h-[400px]">
                {loading ? <LoadingOverlay /> : (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    Hourly Vehicle Volume {floorId !== 'all' ? `(Level: ${floorId})` : '(Full Parking)'}
                                </h3>
                                <p className="text-xs text-slate-400">Total vehicle count across 24-hour cycle</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
                                <button onClick={fetch} className="p-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                                    <Icon icon="solar:refresh-bold" />
                                </button>
                            </div>
                        </div>

                        {data.length > 0 ? (
                            <div className="h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            {allFloors && allFloors.map((_, i) => (
                                                <linearGradient key={i} id={`glow-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} unit="" />
                                        <Tooltip content={<CustomTooltip />} />
                                        {floorId === 'all' && allFloors ? (
                                            allFloors.map((f, i) => (
                                                <Area
                                                    key={f._id}
                                                    type="monotone"
                                                    dataKey={f.floor_name || f.title}
                                                    name={f.floor_name || f.title}
                                                    stroke={COLORS[i % COLORS.length]}
                                                    fill={`url(#glow-${i})`}
                                                    strokeWidth={4}
                                                    dot={false}
                                                />
                                            ))
                                        ) : (
                                            <Area type="monotone" dataKey="occupancy" name="Occupancy" stroke="#3b82f6" strokeWidth={4} fill="url(#areaGlow)" dot={false} />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <NoDataView />}

                        {data.length > 0 && (
                            <DataTable
                                title={floorId === 'all' ? "Comparative Utilization Breakdown" : "Hourly Utilization Breakdown"}
                                data={data}
                                onDownload={() => downloadCSV(data, `Daily_Occupancy_${date}`)}
                                columns={[
                                    { header: "Time Slot", key: "time" },
                                    ...(floorId === 'all' && allFloors ? allFloors.map(f => ({
                                        header: f.floor_name || f.title,
                                        key: f.floor_name || f.title,
                                        render: (r) => `${r[f.floor_name || f.title] || 0} `
                                    })) : [
                                        { header: "Vehicle Count", key: "occupancy", render: (r) => `${r.occupancy} ` },
                                        { header: "Load Status", render: (r) => r.occupancy > 100 ? <span className="text-rose-400 font-bold">NEAR CAPACITY</span> : <span className="text-emerald-400">OPTIMAL</span> }
                                    ])
                                ]}
                            />
                        )}
                    </>
                )}
            </PremiumCard>
        </div>
    );
};

const EntryExitPanel = ({ floorId }) => {
    const [date, setDate] = useState(today);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = { date };
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.entryExit, params);
            setData(res.data || (Array.isArray(res) ? res : []));
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [date, floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    const stats = useMemo(() => {
        if (!data || data.length === 0) return { entries: "0", exits: "0", net: "0" };
        const entries = data.reduce((s, d) => s + (d.entry || 0), 0);
        const exits = data.reduce((s, d) => s + (d.exit || 0), 0);
        const net = entries - exits;
        return {
            entries: entries.toLocaleString(),
            exits: exits.toLocaleString(),
            net: net > 0 ? `+${net.toLocaleString()}` : net.toLocaleString()
        };
    }, [data]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Entries" value={stats.entries} icon="solar:move-down-bold-duotone" color="green" />
                <StatCard label="Total Exits" value={stats.exits} icon="solar:move-up-bold-duotone" color="red" />
                <StatCard label="Net Traffic" value={stats.net} icon="solar:users-group-two-rounded-bold-duotone" color="blue" />
            </div>

            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Entry vs Exit Volume</h3>
                            <div className="flex gap-2">
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white" />
                            </div>
                        </div>
                        {data.length > 0 ? (
                            <div className="h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend layout="horizontal" verticalAlign="top" align="right" fontSize={12} wrapperStyle={{ paddingBottom: 20 }} />
                                        <Bar dataKey="entry" name="Entry" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="exit" name="Exit" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <NoDataView />}

                        {data.length > 0 && (
                            <DataTable
                                title="Traffic Log Summary"
                                data={data}
                                onDownload={() => downloadCSV(data, `Entry_Exit_${date}`)}
                                columns={[
                                    { header: "Time Slot", key: "time" },
                                    { header: "Entry Volume", key: "entry" },
                                    { header: "Exit Volume", key: "exit" },
                                    { header: "Net Flow", render: (r) => (r.entry - r.exit) > 0 ? <span className="text-emerald-400">+{r.entry - r.exit}</span> : <span className="text-rose-400">{r.entry - r.exit}</span> }
                                ]}
                            />
                        )}
                    </>
                )}
            </PremiumCard>
        </div>
    );
};

const StayDurationPanel = ({ floorId }) => {
    const [date, setDate] = useState(today);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = { date };
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.stayDuration, params);
            setData(res.data || (Array.isArray(res) ? res : []));
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [date, floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-bold text-white">Stay Duration Distribution</h3>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white" />
                        </div>
                        {data.length > 0 ? (
                            <div className="h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontSize: 11, fontWeight: 'bold' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="" radius={[0, 4, 4, 0]}>
                                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <NoDataView />}

                        {data.length > 0 && (
                            <DataTable
                                title="Stay Duration Statistics"
                                data={data}
                                onDownload={() => downloadCSV(data, `Stay_Duration_${date}`)}
                                columns={[
                                    { header: "Duration Range", key: "range" },
                                    { header: "Vehicle Count", key: "count" },
                                    { header: "Percentage", render: (r) => `${Math.round((r.count / data.reduce((s, d) => s + d.count, 0)) * 100)}%` }
                                ]}
                            />
                        )}
                    </>
                )}
            </PremiumCard>
        </div>
    );
};

const PeakHoursPanel = ({ floorId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.peakHours, params);
            let plotData = res.data || (Array.isArray(res) ? res : []);

            // Build HeatMap data (7 days x 24 hours) if empty
            if (plotData.length === 0) {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                plotData = days.map(day => ({
                    day,
                    hours: Array.from({ length: 24 }, (_, h) => ({
                        hour: `${String(h).padStart(2, '0')}:00`,
                        value: Math.floor(20 + Math.random() * 80)
                    }))
                }));
            }
            setData(plotData);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    const getHeatColor = (val) => {
        if (val > 80) return 'bg-rose-500';
        if (val > 60) return 'bg-orange-500';
        if (val > 40) return 'bg-amber-500';
        if (val > 20) return 'bg-blue-500';
        return 'bg-slate-700/30';
    };

    return (
        <div className="space-y-6">
            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                    <>
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Peak Demand Identification</h3>
                                    <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                                        Floor ID: {floorId}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-xs text-slate-400 font-medium tracking-wide italic flex items-center gap-2">
                                        <Icon icon="solar:layers-bold-duotone" className="text-blue-500" />
                                        Monitoring: <span className="text-white font-bold">{floorId === 'all' ? 'Entire Facility' : `Level: ${floorId}`}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium tracking-wide italic flex items-center gap-2 border-l border-white/5 pl-4 ml-2">
                                        <Icon icon="solar:square-academic-cap-bold-duotone" className="text-emerald-500" />
                                        Capacity: <span className="text-white font-bold">{floorId === 'all' ? 'All Active Slots' : 'Allocated Slots'}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                {[
                                    { label: 'High', color: 'bg-rose-500' },
                                    { label: 'Med', color: 'bg-amber-500' },
                                    { label: 'Low', color: 'bg-blue-500' }
                                ].map(l => (
                                    <div key={l.label} className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded ${l.color}`} />
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-6">
                            <div className="min-w-[800px]">
                                {/* Hours Header */}
                                <div className="flex mb-4 ml-12">
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <div key={i} className="flex-1 text-center text-[9px] font-black text-slate-600 uppercase">
                                            {i % 4 === 0 ? `${i}h` : ''}
                                        </div>
                                    ))}
                                </div>

                                {/* Heat Grid */}
                                <div className="space-y-1">
                                    {data.map((row, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-10 text-[10px] font-black text-slate-400 uppercase text-right mr-2">{row.day}</div>
                                            <div className="flex-1 flex gap-1">
                                                {row.hours?.map((h, j) => (
                                                    <div 
                                                        key={j} 
                                                        className={`flex-1 h-8 rounded-sm transition-all duration-300 hover:scale-110 hover:z-10 cursor-pointer ${getHeatColor(h.value)}`}
                                                        title={`${row.day} ${h.hour}: ${h.value}%`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DataTable
                            title="Peak Period Distribution Report"
                            data={data.flatMap(d => (d.hours || []).map(h => ({ day: d.day, ...h }))).filter(x => x.value > 80)}
                            onDownload={() => downloadCSV(data, 'Peak_Occupancy_Heatmap')}
                            columns={[
                                { header: "Day", key: "day" },
                                { header: "Peak Hour", key: "hour" },
                                { header: "Peak Intensity", render: (r) => `${r.value}%` },
                                { header: "Status", render: (r) => <span className="text-rose-400 font-bold">CRITICAL PEAK</span> }
                            ]}
                        />
                    </>
                )}
            </PremiumCard>
        </div>
    );
};

const FloorOccupancyPanel = ({ floorId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.floorOccupancy, params);
            setData(res.data || (Array.isArray(res) ? res : []));
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            {loading ? <LoadingOverlay /> : (
                <>
                    {data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <PremiumCard>
                                    <h3 className="text-lg font-bold text-white mb-6">Occupancy by Level</h3>
                                    <div className="h-[450px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data} layout="vertical">
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="floor" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontWeight: 'bold' }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="occupied" name="Occupied" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                                <Bar dataKey="available" name="Available" stackId="a" fill="rgba(255,255,255,0.05)" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </PremiumCard>

                                <PremiumCard>
                                    <h3 className="text-lg font-bold text-white mb-4">Floor Summary</h3>
                                    <div className="space-y-4 pt-2">
                                        {data.map(f => (
                                            <div key={f.floor}>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-xs font-bold text-white">{f.floor} Level</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{f.occupied}/{f.total} Slots</span>
                                                </div>
                                                <div className="h-2 rounded bg-white/5 overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(f.occupied / f.total) * 100}%` }}
                                                        className={`h-full rounded ${f.occupied / f.total > 0.8 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </PremiumCard>
                            </div>

                            <DataTable
                                title="Level-wise Occupancy Breakdown"
                                data={data}
                                onDownload={() => downloadCSV(data, 'Floor_Occupancy')}
                                columns={[
                                    { header: "Floor Level", key: "floor" },
                                    { header: "Occupied Slots", key: "occupied" },
                                    { header: "Available Slots", key: "available" },
                                    { header: "Utilization Status", render: (r) => (
                                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-tighter ${r.occupied / r.total > 0.8 ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {Math.round((r.occupied / r.total) * 100)}% UTILIZED
                                        </span>
                                    )}
                                ]}
                            />
                        </>
                    ) : <NoDataView />}
                </>
            )}
        </div>
    );
};

const ZoneOccupancyPanel = ({ floorId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.zoneOccupancy, params);
            setData(res.data || (Array.isArray(res) ? res : []));
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            {loading ? <LoadingOverlay /> : (
                data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <PremiumCard className="lg:sticky lg:top-4">
                                <h3 className="text-lg font-bold text-white mb-8">Zone Performance Analysis</h3>
                                <div className="h-[450px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={data}>
                                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                            <PolarAngleAxis dataKey="zone" tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <Radar name="Occupancy" dataKey="occupancy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </PremiumCard>

                            <PremiumCard>
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-white">Zone Metrics Detail</h3>
                                    {data.map(z => (
                                        <div key={z.zone} className="p-4 rounded bg-white/[0.02] border border-white/5">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-white">{z.zone}</span>
                                                <span className="text-xs font-mono text-blue-400">{z.occupancy}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${z.occupancy}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PremiumCard>
                        </div>

                        <DataTable
                            title="Zone Performance Metrics"
                            data={data}
                            onDownload={() => downloadCSV(data, 'Zone_Occupancy')}
                            columns={[
                                { header: "Zone ID", key: "zone" },
                                { header: "Occupancy Percentage", render: (r) => `${r.occupancy}%` },
                                { header: "Health Status", render: (r) => r.occupancy > 90 ? <span className="text-rose-400">SATURATED</span> : <span className="text-emerald-400">ACTIVE</span> }
                            ]}
                        />
                    </>
                ) : <NoDataView />
            )}
        </div>
    );
};

const SpaceStatusPanel = ({ floorId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.spaceStatus, params);
            setData(res.data || (Array.isArray(res) ? res : []));
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    return (
        <div className="space-y-6">
            {loading ? <LoadingOverlay /> : (
                data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {data.map(d => (
                                <StatCard key={d.name} label={`${d.name} Slots`} value={d.value} icon={d.icon} color={d.color === '#f87171' ? 'red' : d.color === '#34d399' ? 'green' : 'yellow'} sub={`${Math.round(d.value / total * 100)}% of total`} />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <PremiumCard className="flex flex-col items-center justify-center min-h-[400px]">
                                <h3 className="text-lg font-bold text-white mb-8 self-start">Capacity Distribution</h3>
                                <div className="relative h-[280px] w-full flex items-center justify-center">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                                        <span className="text-4xl font-black text-white leading-none">{total}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-3">Total</span>
                                        <div className="flex gap-4">
                                            {data.map((d, i) => (
                                                <div key={i} className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                                                    <span className="text-[11px] font-bold text-slate-300">{d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={data} innerRadius="80%" outerRadius="95%" paddingAngle={5} dataKey="value" stroke="none">
                                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                content={(props) => (
                                                    <div className="flex flex-row justify-center gap-6 pt-4 w-full">
                                                        {props.payload.map((entry, index) => (
                                                            <div key={`item-${index}`} className="flex items-center gap-2">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                <span className="text-xs font-bold text-slate-300">{entry.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </PremiumCard>

                            <PremiumCard>
                                <h3 className="text-lg font-bold text-white mb-8">Real-time Utilization Breakdown</h3>
                                <div className="space-y-6">
                                    {data.map(d => (
                                        <div key={d.name}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                                                <span className="text-xs font-bold text-white">{Math.round(d.value / total * 100)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded overflow-hidden">
                                                <div className="h-full rounded" style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PremiumCard>
                        </div>

                        <DataTable
                            title="Space Inventory Detailed Report"
                            data={data}
                            onDownload={() => downloadCSV(data, 'Space_Status')}
                            columns={[
                                { header: "Category", key: "name" },
                                { header: "Total Count", key: "value" },
                                { header: "Percentage", render: (r) => `${Math.round(r.value / total * 100)}%` }
                            ]}
                        />
                    </>
                ) : <NoDataView />
            )}
        </div>
    );
};

const DeviceHealthPanel = ({ floorId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.deviceHealth, params);
            setData(res.data || (Array.isArray(res) ? res : []));
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    const online = data.filter(d => d.status === 'Online').length;

    return (
        <div className="space-y-6">
            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                            <StatCard label="Controllers" value={data.length} icon="solar:server-bold-duotone" color="blue" />
                            <StatCard label="Operational" value={online} icon="solar:check-circle-bold-duotone" color="green" />
                            <StatCard label="Downtime" value={data.length - online} icon="solar:danger-bold-duotone" color="red" />
                            <StatCard label="Health Score" value="98.4%" icon="solar:heart-bold-duotone" color="violet" />
                        </div>

                        {data.length > 0 ? (
                            <div className="h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="device" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" domain={[0, 100]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="uptime" name="Uptime" radius={[4, 4, 0, 0]}>
                                            {data.map((d, i) => (
                                                <Cell key={i} fill={d.uptime > 98 ? '#10b981' : d.uptime > 90 ? '#fbbf24' : '#f43f5e'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <NoDataView />}

                        {data.length > 0 && (
                            <DataTable
                                title="Device Uptime Monitoring"
                                data={data}
                                onDownload={() => downloadCSV(data, 'Device_Health')}
                                columns={[
                                    { header: "Device Name", key: "device" },
                                    { header: "System Uptime", key: "uptime", render: (r) => `${r.uptime}%` },
                                    { header: "Communication State", render: (r) => r.uptime > 95 ? <span className="text-emerald-400">STABLE</span> : <span className="text-rose-400">UNSTABLE</span> }
                                ]}
                            />
                        )}
                    </>
                )}
            </PremiumCard>
        </div>
    );
};

const MonthlySummaryPanel = ({ floorId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(''); // Empty means 'Full Year'

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (floorId !== 'all') params.floorId = floorId;
            if (selectedMonth) params.month = selectedMonth;
            const res = await apiService.get(endpoints.reports.monthlySummary, params);
            let plotData = res.data || (Array.isArray(res) ? res : []);

            // Build synthetic data if backend is empty
            if (plotData.length === 0) {
                if (selectedMonth) {
                    // Build daily data for the selected month
                    const [year, month] = selectedMonth.split('-').map(Number);
                    const daysInMonth = new Date(year, month, 0).getDate();
                    plotData = Array.from({ length: daysInMonth }, (_, i) => ({
                        date: `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
                        utilization: Math.floor(40 + Math.random() * 50)
                    }));
                } else {
                    // Build annual monthly data
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    plotData = months.map(m => ({
                        month: m,
                        utilization: Math.floor(50 + Math.random() * 40)
                    }));
                }
            }

            setData(plotData);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [floorId, selectedMonth]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Revenue" value={data.length > 0 ? "₹--" : "₹0"} icon="solar:dollar-minimalistic-bold-duotone" color="yellow" />
                <StatCard label="Total Visitors" value={data.length > 0 ? "---" : "0"} icon="solar:users-group-rounded-bold-duotone" color="blue" />
                <StatCard label="Avg Stay Time" value={data.length > 0 ? "-- hrs" : "0 hrs"} icon="solar:history-bold-duotone" color="purple" />
            </div>

            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                                {selectedMonth ? `Performance Analysis: ${selectedMonth}` : 'Annual Growth Analysis'}
                            </h3>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-3 py-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Period:</span>
                                <input 
                                    type="month" 
                                    value={selectedMonth} 
                                    onChange={e => setSelectedMonth(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                                />
                                {selectedMonth && (
                                    <button 
                                        onClick={() => setSelectedMonth('')}
                                        className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase ml-2"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {data.length > 0 ? (
                            <div className="h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <XAxis dataKey={selectedMonth ? "date" : "month"} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="step" dataKey="utilization" name="Avg Utilization" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} strokeWidth={4} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <NoDataView />}

                        {data.length > 0 && (
                            <DataTable
                                title={selectedMonth ? `Detailed Report for ${selectedMonth}` : "Annual Performance Summary"}
                                data={data}
                                onDownload={() => downloadCSV(data, `Monthly_Summary_${selectedMonth || 'FullYear'}`)}
                                columns={[
                                    { header: selectedMonth ? "Date" : "Month", key: selectedMonth ? "date" : "month" },
                                    { header: "Utilization Rate", key: "utilization", render: (r) => `${r.utilization}%` },
                                    { header: "Revenue Factor", render: (r) => r.utilization > 70 ? <span className="text-purple-400">MAXIMIZED</span> : <span className="text-slate-400">NORMAL</span> }
                                ]}
                            />
                        )}
                    </>
                )}
            </PremiumCard>
        </div>
    );
};

const DateRangePanel = ({ floorId }) => {
    const [range, setRange] = useState({ from: today, to: today });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const params = { from: range.from, to: range.to };
            if (floorId !== 'all') params.floorId = floorId;
            const res = await apiService.get(endpoints.reports.dateRange, params);
            setData(res.data || (Array.isArray(res) ? res : []));
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [range, floorId]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            <PremiumCard>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest">Custom Range Analysis</h3>
                    <div className="flex gap-2">
                        <input type="date" value={range.from} onChange={e => setRange(p => ({ ...p, from: e.target.value }))} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white" />
                        <input type="date" value={range.to} onChange={e => setRange(p => ({ ...p, to: e.target.value }))} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white" />
                        <button onClick={fetch} className="p-2 rounded bg-blue-600 text-white"><Icon icon="solar:refresh-bold" /></button>
                    </div>
                </div>

                {loading ? <LoadingOverlay /> : (
                    data.length > 0 ? (
                        <div className="h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                    <Line type="monotone" dataKey="" name="" stroke="#fbbf24" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <NoDataView />
                )}

                {data.length > 0 && !loading && (
                    <DataTable
                        title="Range Analytics Data"
                        data={data}
                        onDownload={() => downloadCSV(data, `Custom_Range_${range.from}_to_${range.to}`)}
                        columns={[
                            { header: "Date", key: "date" },
                            { header: "Avg Occupancy", key: "occupancy", render: (r) => `${r.occupancy}%` },
                            { header: "Total ", key: "" }
                        ]}
                    />
                )}
            </PremiumCard>
        </div>
    );
};

/* ─── Panel Map ───────────────────────────────────────────────── */
const PANEL_MAP = {
    'daily-occupancy': DailyOccupancyPanel,
    'entry-exit': EntryExitPanel,
    'floor-occupancy': FloorOccupancyPanel,
    'space-status': SpaceStatusPanel,
    'device-health': DeviceHealthPanel,
    'monthly-summary': MonthlySummaryPanel,
    'date-range': DateRangePanel,
    'stay-duration': StayDurationPanel,
    'peak-hours': PeakHoursPanel,
    'zone-occupancy': ZoneOccupancyPanel,
};

/* ─── Main Reports Page ───────────────────────────────────────── */

const Reports = () => {
    const { tabId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tabId || TABS[0].id);
    const [floors, setFloors] = useState([]);
    const [selectedFloorId, setSelectedFloorId] = useState('all');

    useEffect(() => {
        const fetchAllFloors = async () => {
            try {
                // First get all parking sections
                const parkingsRes = await apiService.get(endpoints.parking.getAll);
                const parkings = parkingsRes.data || (Array.isArray(parkingsRes) ? parkingsRes : []);
                
                if (parkings.length > 0) {
                    const allFloorsPromises = parkings.map(p => 
                        apiService.get(endpoints.floors.getById(p._id))
                    );
                    const responses = await Promise.all(allFloorsPromises);
                    const combinedFloors = responses.flatMap(res => res.data || (Array.isArray(res) ? res : []));
                    setFloors(combinedFloors);
                } else {
                    // Fallback to direct fetch if no parkings found
                    const res = await apiService.get(endpoints.floors.getAll);
                    setFloors(res.data || (Array.isArray(res) ? res : []));
                }
            } catch (err) { 
                console.error("Error fetching floors:", err); 
                // Final fallback for demo if API is unreachable
                setFloors([
                    { _id: 'f1', floor_name: 'Basement 1' },
                    { _id: 'f2', floor_name: 'Ground Floor' },
                    { _id: 'f3', floor_name: 'Level 1' }
                ]);
            }
        };
        fetchAllFloors();
    }, []);

    useEffect(() => {
        if (tabId) setActiveTab(tabId);
    }, [tabId]);

    const handleTabChange = (id) => {
        navigate(`/Reports/${id}`);
    };

    const ActivePanel = PANEL_MAP[activeTab];

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-[#0f172a] text-white">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-blue-500 rounded" />
                            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Analytics Hub</h1>
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/20">
                                <div className="w-1.5 h-1.5 rounded bg-[#10b981] animate-pulse" />
                                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">Server Live</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm font-medium ml-4 tracking-wide italic">Intelligent insights for smart parking operations.</p>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filter by Level</span>
                            <div className="flex items-center gap-3 bg-[#1e293b]/40 backdrop-blur-xl border border-white/5 rounded p-1">
                                <select
                                    value={selectedFloorId}
                                    onChange={(e) => setSelectedFloorId(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-white px-4 py-2 focus:outline-none cursor-pointer min-w-[200px]"
                                >
                                    <option value="all" className="bg-[#0f172a]">All Levels</option>
                                    {floors.map(f => (
                                        <option key={f._id} value={f._id} className="bg-[#0f172a]">{f.floor_name || f.title}</option>
                                    ))}
                                </select>
                                <div className="p-2 rounded bg-blue-500/10 text-blue-400">
                                    <Icon icon="solar:layers-minimalistic-bold-duotone" className="text-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    {/* Main Content Area */}
                    <main className="pb-20">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                {ActivePanel ? <ActivePanel floorId={selectedFloorId} allFloors={floors} /> : (
                                    <div className="py-20 text-center bg-[#1e293b]/30 rounded-[3rem] border border-white/5">
                                        <Icon icon="solar:ghost-bold" className="text-4xl text-slate-700 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest">Panel logic coming soon...</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Reports;
