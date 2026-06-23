import { DonutChart } from '../common/DonutChart';
import { Car, Box, CheckCircle, X } from 'lucide-react';
import MenuButton from '../common/MenuButton';
import FlipButton from '../common/FlipButton';
import PropTypes from 'prop-types';
import { apiService } from '../../services/api';

export const ZoneSection = ({
  title = "Unknown Zone",
  id,
  total_spaces = 0,
  occupied = 0,
  status = "Available",
  isActive = false,
  onClick,
  menuOpen,
  handleMenuClick,
  setFlippedSection,
  flippedSection,
  compact = false
}) => {
  const isFlipped = flippedSection === title;

  const handleMenuItemClick = async (action) => {
    console.log(`${action} clicked for zone ID: ${id}`);
    
    // Connect to backend API if it's a real MongoDB ObjectId
    const isMongoId = typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
    if (isMongoId) {
      try {
        let endpoint = "";
        let payload = { zoneObjID: id };
        
        if (action === 'blockZone') {
          endpoint = "/api/blockSpacesByZone";
        } else if (action === 'unblockZone') {
          endpoint = "/api/unBlockSpacesByZone";
        }
        
        if (endpoint) {
          const res = await apiService.post(endpoint, payload);
          console.log(`Backend zone action ${action} response:`, res);
        }
      } catch (err) {
        console.error(`Failed to execute zone action ${action}:`, err);
      }
    }
  };

  return (
    <div
      className={`group relative min-w-0 ${compact ? 'p-3' : 'p-5'} rounded cursor-pointer transition-all duration-300 border ${isActive
        ? 'bg-[#0f172a] border-blue-500/50 shadow-lg shadow-blue-500/10'
        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
        }`}
      onClick={onClick}
    >
      <div className={`flex justify-between items-start ${compact ? 'mb-2' : 'mb-6'}`}>
        <div className="flex flex-col gap-0.5 min-w-0 pr-1">
          <h3 className={`${compact ? 'text-xs' : 'text-lg'} font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{title}</h3>
          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider w-max ${
            status === 'Full' || status === 'Occupied'
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.1)]'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
          }`}>
            {status}
          </span>
        </div>
        <div className="flex items-center space-x-1 relative">
          <FlipButton
            isFlipped={isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              setFlippedSection(isFlipped ? null : title);
            }}
          />
          <MenuButton
            isOpen={menuOpen === id}
            onClick={(e) => handleMenuClick(e, { _id: id })}
            className={compact ? "scale-75" : ""}
          />
        </div>
      </div>

      {/* Centered action overlay */}
      {menuOpen === id && (
        <div
          className="absolute inset-0 rounded z-20 flex flex-col items-center justify-center gap-3 bg-[#0b1120]/95"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); handleMenuClick(e, { _id: id }); }}
          >
            <X size={18} />
          </button>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Zone Actions</p>
          <button
            className="w-[85%] py-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all"
            onClick={(e) => { e.stopPropagation(); handleMenuItemClick('blockZone'); handleMenuClick(e, { _id: id }); }}
          >
            Block Zone
          </button>
          <button
            className="w-[85%] py-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 active:scale-95 transition-all"
            onClick={(e) => { e.stopPropagation(); handleMenuItemClick('unblockZone'); handleMenuClick(e, { _id: id }); }}
          >
            Unblock Zone
          </button>
        </div>
      )}

      {!isFlipped ? (
        <div className="flex flex-col items-center justify-center py-1">
          <DonutChart
            data={[
              { name: 'Occupied', value: occupied },
              { name: 'Available', value: total_spaces - occupied }
            ]}
            width={compact ? 120 : 160}
            height={compact ? 120 : 160}
            colors={['#f43f5e', '#10b981']}
          />
          <div className={`flex gap-2 ${compact ? 'mt-3' : 'mt-6'} w-full`}>
            <div className={`flex-1 bg-white/5 rounded ${compact ? 'p-2' : 'p-3'} text-center border border-white/5`}>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Full</p>
              <p className={`${compact ? 'text-xs' : 'text-lg'} font-bold text-rose-400`}>{occupied}</p>
            </div>
            <div className={`flex-1 bg-white/5 rounded ${compact ? 'p-2' : 'p-3'} text-center border border-white/5`}>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Open</p>
              <p className={`${compact ? 'text-xs' : 'text-lg'} font-bold text-emerald-400`}>{total_spaces - occupied}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mt-4`}>
          <div className="bg-white/5 p-3 rounded border border-white/5 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-2 text-slate-500 text-[9px] uppercase font-bold tracking-widest">
              <Car size={13} className="group-hover:text-blue-400 transition-colors" />
              <span>Scale</span>
            </div>
            <span className="text-xl font-bold text-white block mt-1">{total_spaces}</span>
          </div>

          <div className="bg-rose-500/5 p-3 rounded border border-rose-500/10 hover:bg-rose-500/10 transition-all">
            <div className="flex items-center gap-2 text-rose-400/70 text-[9px] uppercase font-bold tracking-widest">
              <Box size={13} />
              <span>Busy</span>
            </div>
            <span className="text-xl font-bold text-rose-400 block mt-1">{occupied}</span>
          </div>

          {!compact && (
            <div className="bg-emerald-500/5 p-3 rounded border border-emerald-500/10 hover:bg-emerald-500/10 transition-all col-span-2">
              <div className="flex items-center gap-2 text-emerald-400/70 text-[9px] uppercase font-bold tracking-widest">
                <CheckCircle size={13} />
                <span>Ready Nodes</span>
              </div>
              <span className="text-xl font-bold text-emerald-400 block mt-1">{total_spaces - occupied}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ZoneSection.propTypes = {
  title: PropTypes.string.isRequired,
  total_spaces: PropTypes.number.isRequired,
  occupied: PropTypes.number.isRequired,
  status: PropTypes.string,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  menuOpen: PropTypes.string,
  handleMenuClick: PropTypes.func.isRequired,
  setFlippedSection: PropTypes.func.isRequired,
  flippedSection: PropTypes.string,
  compact: PropTypes.bool
};
