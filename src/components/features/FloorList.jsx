import { DonutChart } from '../common/DonutChart';
import { Car, Layers, CheckCircle, X } from 'lucide-react';
import MenuButton from '../common/MenuButton';
import FlipButton from '../common/FlipButton';
import PropTypes from 'prop-types';

export const FloorSection = ({
  title = "Unknown Floor",
  id,
  total_spaces = 0,
  occupied = 0,
  total_zones = 0,
  isActive = false,
  onClick,
  menuOpen,
  handleMenuClick,
  setFlippedSection,
  flippedSection
}) => {
  const isFlipped = flippedSection === title;

  const handleMenuItemClick = (action) => {
    switch (action) {
      case 'blockFloor':
        console.log('Block floor clicked for floor:', title);
        break;
      case 'unblockFloor':
        console.log('Unblock floor clicked for floor:', title);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div
      className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${
        isActive
          ? 'bg-[#0f172a] border-blue-500/50 shadow-lg shadow-blue-500/10'
          : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <h3 className={`text-lg font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>{title}</h3>
        <div className="flex items-center space-x-2 relative">
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
          />
        </div>
      </div>

      {/* Centered action overlay */}
      {menuOpen === id && (
        <div
          className="absolute inset-0 rounded-2xl z-20 flex flex-col items-center justify-center gap-3 bg-[#0b1120]/95"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); handleMenuClick(e, { _id: id }); }}
          >
            <X size={18} />
          </button>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Internal Controls</p>
          <button
            className="w-[85%] py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all"
            onClick={(e) => { e.stopPropagation(); handleMenuItemClick('blockFloor'); handleMenuClick(e, { _id: id }); }}
          >
            Disable Level Access
          </button>
          <button
            className="w-[85%] py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 active:scale-95 transition-all"
            onClick={(e) => { e.stopPropagation(); handleMenuItemClick('unblockFloor'); handleMenuClick(e, { _id: id }); }}
          >
            Enable Level Access
          </button>
        </div>
      )}

      {!isFlipped ? (
        <div className="flex flex-col items-center justify-center py-2">
          <DonutChart
            data={[
              { name: 'Occupied', value: occupied },
              { name: 'Available', value: total_spaces - occupied }
            ]}
            width={160}
            height={160}
            colors={['#f43f5e', '#10b981']}
          />
          <div className="flex gap-3 mt-6 w-full">
             <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Occupied</p>
                <p className="text-xl font-bold text-rose-400">{occupied}</p>
             </div>
             <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Free</p>
                <p className="text-xl font-bold text-emerald-400">{total_spaces - occupied}</p>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-2 text-slate-500 text-[9px] uppercase font-bold tracking-widest">
              <Car size={13} className="group-hover:text-blue-400 transition-colors" />
              <span>Spaces</span>
            </div>
            <span className="text-2xl font-bold text-white block mt-2">{total_spaces}</span>
          </div>
          
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
            <div className="flex items-center gap-2 text-slate-500 text-[9px] uppercase font-bold tracking-widest">
              <Layers size={13} className="group-hover:text-purple-400 transition-colors" />
              <span>Zones</span>
            </div>
            <span className="text-2xl font-bold text-white block mt-2">{total_zones}</span>
          </div>

          <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 hover:bg-rose-500/10 transition-all">
            <div className="flex items-center gap-2 text-rose-400/70 text-[9px] uppercase font-bold tracking-widest">
              <span>Occupied</span>
            </div>
            <span className="text-2xl font-bold text-rose-400 block mt-2">{occupied}</span>
          </div>

          <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
            <div className="flex items-center gap-2 text-emerald-400/70 text-[9px] uppercase font-bold tracking-widest">
              <span>Available</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400 block mt-2">{total_spaces - occupied}</span>
          </div>
        </div>
      )}
    </div>
  );
};

FloorSection.propTypes = {
  title: PropTypes.string.isRequired,
  total_spaces: PropTypes.number.isRequired,
  occupied: PropTypes.number.isRequired,
  total_zones: PropTypes.number,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  menuOpen: PropTypes.string,
  handleMenuClick: PropTypes.func.isRequired,
  setFlippedSection: PropTypes.func.isRequired,
  flippedSection: PropTypes.string
};

// export default FloorSection
