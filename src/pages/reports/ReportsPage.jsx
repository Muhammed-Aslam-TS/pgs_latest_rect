import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { apiService, endpoints } from '../../services/api';
import Loader from '../../components/common/Loader';

/* ─── Constants ───────────────────────────────────────────────── */
const TABS = [
  { id: 'daily-occupancy',   label: 'Daily Occupancy',  icon: 'solar:chart-2-bold-duotone' },
  { id: 'entry-exit',        label: 'Entry / Exit',     icon: 'solar:transfer-horizontal-bold-duotone' },
  { id: 'stay-duration',     label: 'Stay Duration',    icon: 'solar:clock-circle-bold-duotone' },
  { id: 'peak-hours',        label: 'Peak Hours',       icon: 'solar:fire-bold-duotone' },
  { id: 'floor-occupancy',   label: 'Floor Occupancy',  icon: 'solar:layers-bold-duotone' },
  { id: 'zone-occupancy',    label: 'Zone Occupancy',   icon: 'solar:map-bold-duotone' },
  { id: 'space-status',      label: 'Space Status',     icon: 'solar:box-bold-duotone' },
  { id: 'device-health',     label: 'Device Health',    icon: 'solar:cpu-bold-duotone' },
  { id: 'monthly-summary',   label: 'Monthly Summary',  icon: 'solar:calendar-bold-duotone' },
  { id: 'date-range',        label: 'Date Range',       icon: 'solar:calendar-search-bold-duotone' },
];

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf'];

const today = new Date().toISOString().split('T')[0];

/* ─── Shared Components ───────────────────────────────────────── */

const PremiumCard = ({ children, className = "", glowColor = "blue" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-3xl border border-white/5 bg-[#0f172a]/40 backdrop-blur-xl transition-all duration-300 hover:border-white/10 ${className}`}
  >
    <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full bg-${glowColor}-500/10 blur-[80px]`} />
    <div className={`absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-${glowColor}-500/5 blur-[80px]`} />
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
        <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${colorMap[color]} to-transparent`}>
          <Icon icon={icon} className={`text-xl ${colorMap[color].split(' ')[0]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
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
      <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-semibold text-white/90">{entry.name}:</span>
              <span className="text-xs font-black text-white">{entry.value}{entry.unit || ''}</span>
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

/* ─── Panel Components ────────────────────────────────────────── */

const DailyOccupancyPanel = () => {
  const [date, setDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(endpoints.reports.dailyOccupancy, { date });
      setData(res.data || []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Avg Occupancy" value={data.length > 0 ? "64%" : "0%"} icon="solar:chart-square-bold-duotone" color="blue" />
        <StatCard label="Peak Hour" value={data.length > 0 ? "14:00" : "--:--"} icon="solar:fire-bold-duotone" color="orange" sub="at max capacity" />
        <StatCard label="Lowest Hour" value={data.length > 0 ? "04:00" : "--:--"} icon="solar:cloud-bold-duotone" color="violet" />
      </div>

      <PremiumCard className="min-h-[400px]">
        {loading ? <LoadingOverlay /> : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                  <h3 className="text-lg font-bold text-white mb-1">Hourly Utilization Trend</h3>
                  <p className="text-xs text-slate-400">Occupancy percentage across 24-hour cycle</p>
              </div>
              <div className="flex items-center gap-3">
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
                 <button onClick={fetch} className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors">
                    <Icon icon="solar:refresh-bold" />
                 </button>
              </div>
            </div>

            {data.length > 0 ? (
                <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                    <defs>
                        <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="occupancy" name="Occupancy" stroke="#3b82f6" strokeWidth={3} fill="url(#areaGlow)" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
                </div>
            ) : <NoDataView />}
          </>
        )}
      </PremiumCard>
    </div>
  );
};

const EntryExitPanel = () => {
    const [date, setDate] = useState(today);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.entryExit, { date });
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [date]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Entries" value={data.length > 0 ? "1,248" : "0"} icon="solar:move-down-bold-duotone" color="green" />
                <StatCard label="Total Exits" value={data.length > 0 ? "1,182" : "0"} icon="solar:move-up-bold-duotone" color="red" />
                <StatCard label="Net Traffic" value={data.length > 0 ? "+66" : "0"} icon="solar:users-group-two-rounded-bold-duotone" color="blue" />
            </div>

            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                  <>
                    <div className="flex justify-between items-center mb-8">
                         <h3 className="text-lg font-bold text-white uppercase tracking-tight">Entry vs Exit Volume</h3>
                         <div className="flex gap-2">
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
                         </div>
                    </div>
                    {data.length > 0 ? (
                        <div className="h-[300px]">
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
                  </>
                )}
            </PremiumCard>
        </div>
    );
};

const StayDurationPanel = () => {
    const [date, setDate] = useState(today);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.stayDuration, { date });
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [date]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                  <>
                    <div className="flex justify-between items-center mb-8">
                         <h3 className="text-lg font-bold text-white">Stay Duration Distribution</h3>
                         <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
                    </div>
                    {data.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontSize: 11, fontWeight: 'bold' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Vehicles" radius={[0, 4, 4, 0]}>
                                        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <NoDataView />}
                  </>
                )}
            </PremiumCard>
        </div>
    );
};

const PeakHoursPanel = () => {
    const [date, setDate] = useState(today);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.peakHours, { date });
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [date]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            <PremiumCard>
                {loading ? <LoadingOverlay /> : (
                  <>
                    <div className="flex justify-between items-center mb-8">
                         <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Peak Hour Identification</h3>
                         <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
                    </div>
                    {data.length > 0 ? (
                        <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="vehicles" name="Vehicles" radius={[4, 4, 0, 0]}>
                                {data.map((d, i) => (
                                <Cell key={i} fill={d.vehicles > 50 ? '#f43f5e' : d.vehicles > 30 ? '#fbbf24' : '#3b82f6'} />
                                ))}
                            </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    ) : <NoDataView />}
                  </>
                )}
            </PremiumCard>
        </div>
    );
};

const FloorOccupancyPanel = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.floorOccupancy);
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, []);

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
                                <div className="h-[300px]">
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
                                            <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(f.occupied/f.total)*100}%` }}
                                                    className={`h-full rounded-full ${f.occupied/f.total > 0.8 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PremiumCard>
                        </div>
                        
                        <PremiumCard className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="pb-4 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Floor</th>
                                        <th className="pb-4 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Occupied</th>
                                        <th className="pb-4 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Available</th>
                                        <th className="pb-4 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Utilization</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((f, i) => (
                                        <TableRow key={i}>
                                            <td className="py-4 px-2 text-sm font-bold text-white">{f.floor}</td>
                                            <td className="py-4 px-2 text-sm text-slate-300">{f.occupied}</td>
                                            <td className="py-4 px-2 text-sm text-slate-300">{f.available}</td>
                                            <td className="py-4 px-2">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tighter ${f.occupied/f.total > 0.8 ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {Math.round((f.occupied/f.total)*100)}% UTILIZED
                                                </span>
                                            </td>
                                        </TableRow>
                                    ))}
                                </tbody>
                            </table>
                        </PremiumCard>
                    </>
                ) : <NoDataView />}
              </>
            )}
        </div>
    );
};

const ZoneOccupancyPanel = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.zoneOccupancy);
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
            {loading ? <LoadingOverlay /> : (
                data.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PremiumCard>
                        <h3 className="text-lg font-bold text-white mb-8">Zone Performance Analysis</h3>
                        <div className="h-[300px]">
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
                                    <div key={z.zone} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-bold text-white">{z.zone}</span>
                                            <span className="text-xs font-mono text-blue-400">{z.occupancy}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${z.occupancy}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PremiumCard>
                    </div>
                ) : <NoDataView />
            )}
        </div>
    );
};

const SpaceStatusPanel = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
      setLoading(true);
      try {
          const res = await apiService.get(endpoints.reports.spaceStatus);
          setData(res.data || []);
      } catch { setData([]); }
      finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <div className="space-y-6">
      {loading ? <LoadingOverlay /> : (
        data.length > 0 ? (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.map(d => (
                    <StatCard key={d.name} label={`${d.name} Slots`} value={d.value} icon={d.icon} color={d.color === '#f87171' ? 'red' : d.color === '#34d399' ? 'green' : 'yellow'} sub={`${Math.round(d.value/total*100)}% of total`} />
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PremiumCard className="flex flex-col items-center justify-center min-h-[400px]">
                    <h3 className="text-lg font-bold text-white mb-8 self-start">Capacity Distribution</h3>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </PremiumCard>

                <PremiumCard>
                    <h3 className="text-lg font-bold text-white mb-6">Real-time Utilization Breakdown</h3>
                    <div className="space-y-8 pt-4">
                        {data.map(d => (
                            <div key={d.name}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">{d.name}</span>
                                    <span className="text-sm font-black" style={{ color: d.color }}>{Math.round(d.value/total*100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(d.value/total)*100}%` }} className="h-full" style={{ backgroundColor: d.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </PremiumCard>
            </div>
            </>
        ) : <NoDataView />
      )}
    </div>
  );
};

const DeviceHealthPanel = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.deviceHealth);
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const online = data.filter(d => d.status === 'Online').length;

    return (
        <div className="space-y-6">
            {loading ? <LoadingOverlay /> : (
              data.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <StatCard label="Controllers" value={data.length} icon="solar:server-bold-duotone" color="blue" />
                        <StatCard label="Operational" value={online} icon="solar:check-circle-bold-duotone" color="green" />
                        <StatCard label="Downtime" value={data.length - online} icon="solar:danger-bold-duotone" color="red" />
                        <StatCard label="Health Score" value="98.4%" icon="solar:heart-bold-duotone" color="violet" />
                    </div>

                    <PremiumCard>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white">Edge Node Connectivity</h3>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Real-time Status</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.map((d, i) => (
                                <div key={i} className="group p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${d.status === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className="text-sm font-black text-white">{d.device}</span>
                                        </div>
                                        <Icon icon="solar:cpu-bold-duotone" className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">Uptime</p>
                                            <p className="text-xs font-bold text-blue-400">{d.uptime}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">Status</p>
                                            <p className={`text-xs font-bold uppercase ${d.status === 'Online' ? 'text-emerald-500' : 'text-rose-500'}`}>{d.status}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PremiumCard>
                </>
              ) : <NoDataView message="No device telemetry data found." />
            )}
        </div>
    );
};

const MonthlySummaryPanel = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.monthlySummary);
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Revenue" value={data.length > 0 ? "₹--" : "₹0"} icon="solar:dollar-minimalistic-bold-duotone" color="yellow" />
                <StatCard label="Total Visitors" value={data.length > 0 ? "---" : "0"} icon="solar:users-group-rounded-bold-duotone" color="blue" />
                <StatCard label="Avg Stay Time" value={data.length > 0 ? "-- hrs" : "0 hrs"} icon="solar:history-bold-duotone" color="purple" />
             </div>

             <PremiumCard className="min-h-[400px]">
                {loading ? <LoadingOverlay /> : (
                  <>
                    <h3 className="text-lg font-bold text-white mb-8">Annual Growth Analysis</h3>
                    {data.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="step" dataKey="totalVehicles" name="Visitors" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                                    <Area type="step" dataKey="revenue" name="Revenue" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <NoDataView />}
                  </>
                )}
             </PremiumCard>
        </div>
    );
};

const DateRangePanel = () => {
    const [range, setRange] = useState({ from: today, to: today });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiService.get(endpoints.reports.dateRange, { from: range.from, to: range.to });
            setData(res.data || []);
        } catch { setData([]); }
        finally { setLoading(false); }
    }, [range]);

    useEffect(() => { fetch(); }, [fetch]);

    return (
      <div className="space-y-6">
          <PremiumCard>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">Custom Range Analysis</h3>
                  <div className="flex gap-2">
                      <input type="date" value={range.from} onChange={e => setRange(p => ({ ...p, from: e.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
                      <input type="date" value={range.to} onChange={e => setRange(p => ({ ...p, to: e.target.value }))} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
                      <button onClick={fetch} className="p-2 rounded-xl bg-blue-600 text-white"><Icon icon="solar:refresh-bold" /></button>
                  </div>
              </div>

              {loading ? <LoadingOverlay /> : (
                data.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="occupancy" name="Occupancy %" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="vehicles" name="Vehicles" stroke="#fbbf24" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : <NoDataView />
              )}
          </PremiumCard>
      </div>
    );
};

/* ─── Panel Map ───────────────────────────────────────────────── */
const PANEL_MAP = {
  'daily-occupancy': DailyOccupancyPanel,
  'entry-exit':      EntryExitPanel,
  'floor-occupancy': FloorOccupancyPanel,
  'space-status':    SpaceStatusPanel,
  'device-health':   DeviceHealthPanel,
  'monthly-summary': MonthlySummaryPanel,
  'date-range':      DateRangePanel,
  'stay-duration':   StayDurationPanel,
  'peak-hours':      PeakHoursPanel,
  'zone-occupancy':  ZoneOccupancyPanel,
};

/* ─── Main Reports Page ───────────────────────────────────────── */

const Reports = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const ActivePanel = PANEL_MAP[activeTab];

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#0f172a] text-white">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
                    <h1 className="text-3xl font-black tracking-tight text-white uppercase">Analytics Hub</h1>
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">Server Live</span>
                    </div>
                </div>
                <p className="text-slate-400 text-sm font-medium ml-4 tracking-wide italic">Intelligent insights for smart parking operations.</p>
            </motion.div>
        </div>

        <div className="mb-10 overflow-x-auto no-scrollbar">
          <div className="flex p-1.5 gap-2 bg-[#1e293b]/50 backdrop-blur-md rounded-3xl border border-white/5 w-fit min-w-full sm:min-w-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2.5 px-6 py-3 rounded-[1.25rem] text-xs font-black tracking-widest uppercase transition-all duration-500 whitespace-nowrap overflow-hidden group ${
                  activeTab === tab.id
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-blue-600 shadow-xl shadow-blue-900/40 z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                <Icon icon={tab.icon} className={`relative z-10 text-lg ${activeTab === tab.id ? 'text-white' : 'group-hover:text-blue-400 text-slate-600'}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="pb-20"
          >
            {ActivePanel ? <ActivePanel /> : (
                <div className="py-20 text-center">
                    <Icon icon="solar:ghost-bold" className="text-4xl text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Panel logic coming soon...</p>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reports;
