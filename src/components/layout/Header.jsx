import { memo } from "react";
import PropTypes from "prop-types";

/* ─── Animated segmented bar ───────────────────────────────────── */
const SplitBar = memo(({ occupied, available }) => (
  <div className="w-full flex h-1.5 rounded overflow-hidden gap-0.5 bg-white/5">
    <div
      className="h-full rounded bg-rose-500 transition-all duration-700 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
      style={{ width: `${occupied}%` }}
    />
    <div
      className="h-full rounded bg-emerald-500 transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
      style={{ width: `${available}%` }}
    />
  </div>
));
SplitBar.displayName = "SplitBar";

/* ─── KPI card (simple stat) ────────────────────────────────────── */
const KpiCard = memo(({ icon, label, primary, sub, accentColor, borderColor }) => (
  <div
    className={`
      relative rounded p-3 sm:p-4 overflow-hidden
      bg-[#0b0f1a] border ${borderColor}
      hover:border-white/10 transition-all duration-300 group
    `}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded flex items-center justify-center bg-${accentColor}-500/10 text-${accentColor}-400`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Metric</span>
    </div>

    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">{primary}</span>
        {sub && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sub}</span>}
      </div>
    </div>
  </div>
));
KpiCard.displayName = "KpiCard";

/* ─── Occupancy card (with live bar) ───────────────────────────── */
const OccupancyCard = memo(({ title, dotColor, occupied, available, borderColor }) => (
  <div
    className={`
      relative rounded p-3 sm:p-4 overflow-hidden
      bg-[#0b0f1a] border ${borderColor}
      hover:border-white/10 transition-all duration-300 group
    `}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded ${dotColor} animate-pulse shadow-[0_0_8px_currentColor]`} />
        <span className="text-xs font-bold text-white uppercase tracking-widest">{title} Hub</span>
      </div>
      <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
        <span className="text-[9px] font-bold text-slate-500 uppercase">Live Sync</span>
      </div>
    </div>

    <div className="flex justify-between items-end mb-4">
      <div className="space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Occupancy</span>
        <p className="text-xl font-bold text-rose-400 tracking-tight">{occupied}%</p>
      </div>

      <div className="w-px h-8 bg-white/5" />

      <div className="space-y-1 text-right">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Available</span>
        <p className="text-xl font-bold text-emerald-400 tracking-tight">{available}%</p>
      </div>
    </div>

    <SplitBar occupied={occupied} available={available} />
  </div>
));
OccupancyCard.displayName = "OccupancyCard";

/* ─── Main Header ───────────────────────────────────────────────── */
export const Header = memo(({
  totalParkings,
  totalSlots,
  mlcpData,
  basementData,
}) => (
  <div className="w-full pb-0">
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-blue-600 rounded" />
        <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Operational Pulse</h2>
      </div>
      <div className="flex-1 h-[1px] bg-white/5" />
      <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/5">
        <div className="w-1.5 h-1.5 rounded bg-emerald-500 animate-pulse" />
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Systems Active</span>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path strokeLinecap="round" d="M3 9h18M9 21V9" />
          </svg>
        }
        label="Vessel Count"
        primary={totalParkings}
        sub="Units"
        accentColor="blue"
        borderColor="border-white/5"
      />

      <KpiCard
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="4" />
            <path strokeLinecap="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        }
        label="Total Capacity"
        primary={totalSlots.toLocaleString()}
        sub="Slots"
        accentColor="violet"
        borderColor="border-white/5"
      />

      <OccupancyCard
        title="MLCP"
        dotColor="bg-blue-400"
        occupied={mlcpData?.occupied || 0}
        available={mlcpData?.availability || 100}
        borderColor="border-white/5"
      />

      <OccupancyCard
        title="Basement"
        dotColor="bg-purple-400"
        occupied={basementData?.occupied || 0}
        available={basementData?.availability || 100}
        borderColor="border-white/5"
      />
    </div>
  </div>
));
Header.displayName = "Header";

/* ─── PropTypes ─────────────────────────────────────────────────── */
SplitBar.propTypes = {
  occupied: PropTypes.number.isRequired,
  available: PropTypes.number.isRequired,
};

KpiCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  primary: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
  accentFrom: PropTypes.string.isRequired,
  accentTo: PropTypes.string.isRequired,
  borderColor: PropTypes.string.isRequired,
};

OccupancyCard.propTypes = {
  title: PropTypes.string.isRequired,
  dotColor: PropTypes.string.isRequired,
  occupied: PropTypes.number.isRequired,
  available: PropTypes.number.isRequired,
  accentFrom: PropTypes.string.isRequired,
  accentTo: PropTypes.string.isRequired,
  borderColor: PropTypes.string.isRequired,
};

Header.propTypes = {
  totalParkings: PropTypes.number.isRequired,
  totalSlots: PropTypes.number.isRequired,
  mlcpData: PropTypes.shape({
    occupied: PropTypes.number.isRequired,
    availability: PropTypes.number.isRequired,
  }).isRequired,
  basementData: PropTypes.shape({
    occupied: PropTypes.number.isRequired,
    availability: PropTypes.number.isRequired,
  }).isRequired,
};
