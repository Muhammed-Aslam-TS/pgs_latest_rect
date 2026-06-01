import { DonutChart } from '../common/DonutChart';
import { X } from 'lucide-react';
import MenuButton from '../common/MenuButton';
import FlipButton from '../common/FlipButton';
import PropTypes from 'prop-types';

export const ParkingSection = ({
  title,
  isActive = false,
  onClick,
  section = {},
  menuOpen,
  handleMenuClick,
  setFlippedSection,
  flippedSection
}) => {
  const isFlipped = flippedSection === section._id;
  const occupied = section.occupied || 0;
  const available = section.available || 0;
  const total_spaces = section.total_spaces || 0;
  const total_floors = section.total_floors || 0;

  const handleMenuItemClick = (action) => {
    switch (action) {
      case 'blockParking':
        console.log('Block parking clicked for section:', section._id);
        break;
      case 'unblockParking':
        console.log('Unblock parking clicked for section:', section._id);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div
      className={`group relative p-3 sm:p-4 rounded cursor-pointer transition-all duration-300 border ${isActive
        ? 'bg-[#0f172a] border-blue-500/50 shadow-lg shadow-blue-500/10'
        : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
        }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <h3 className={`text-base font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>{title}</h3>
        <div className="flex items-center space-x-2 relative">
          <FlipButton
            isFlipped={isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              setFlippedSection(isFlipped ? null : section._id);
            }}
          />
          <MenuButton
            isOpen={menuOpen === section._id}
            onClick={(e) => handleMenuClick(e, section)}
          />
        </div>
      </div>

      {/* Centered action overlay on 3-dot click */}
      {menuOpen === section._id && (
        <div
          className="absolute inset-0 rounded z-20 flex flex-col items-center justify-center gap-3 bg-[#0b1120]/95"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); handleMenuClick(e, section); }}
          >
            <X size={18} />
          </button>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Management Controls</p>
          <button
            className="w-[85%] py-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all"
            onClick={(e) => { e.stopPropagation(); handleMenuItemClick('blockParking'); handleMenuClick(e, section); }}
          >
            Block Vessel Entry
          </button>
          <button
            className="w-[85%] py-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 active:scale-95 transition-all"
            onClick={(e) => { e.stopPropagation(); handleMenuItemClick('unblockParking'); handleMenuClick(e, section); }}
          >
            Restore Entry Sync
          </button>
        </div>
      )}

      {!isFlipped ? (
        <div className="flex flex-col items-center justify-center py-2">
          <DonutChart
            data={[
              { name: 'Occupied', value: occupied },
              { name: 'Available', value: available }
            ]}
            width={160}
            height={160}
            colors={['#f43f5e', '#10b981']}
          />
          <div className="flex gap-3 mt-6 w-full">
            <div className="flex-1 bg-white/5 rounded p-2 text-center border border-white/5">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Occupied</p>
              <p className="text-lg font-bold text-rose-400">{occupied}</p>
            </div>
            <div className="flex-1 bg-white/5 rounded p-2 text-center border border-white/5">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Free</p>
              <p className="text-lg font-bold text-emerald-400">{available}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded p-4 bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Total Slots</p>
            <span className="text-xl font-bold text-white">{total_spaces ?? '—'}</span>
          </div>

          <div className="rounded p-4 bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Levels</p>
            <span className="text-xl font-bold text-white">{total_floors ?? '—'}</span>
          </div>

          <div className="rounded p-4 bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-all">
            <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500/70 mb-1">Occupaide</p>
            <span className="text-xl font-bold text-rose-400">{occupied ?? '—'}</span>
          </div>

          <div className="rounded p-4 bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/70 mb-1">Available</p>
            <span className="text-xl font-bold text-emerald-400">{available ?? '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

ParkingSection.propTypes = {
  title: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  section: PropTypes.object.isRequired,
  menuOpen: PropTypes.string,
  handleMenuClick: PropTypes.func.isRequired,
  setFlippedSection: PropTypes.func.isRequired,
  flippedSection: PropTypes.string
};
