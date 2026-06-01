import { Signal, Wifi, MapPin } from 'lucide-react';
import PropTypes from 'prop-types';
import FlipButton from '../common/FlipButton';

export const DisplaySection = ({
  display = {},
  isFlipped = false,
  onFlip
}) => {
  const {
    _id,
    display_name = "Unknown Display",
    display_type = "LED",
    display_ipaddress = "0.0.0.0",
    current_value = 0,
    display_signal_strength = 0,
    display_connections_name = []
  } = display;

  const getSignalColor = (strength) => {
    if (strength > 75) return 'text-emerald-400';
    if (strength > 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getLEDColorClass = (val) => {
    if (val > 10) return 'text-emerald-400';
    if (val > 0) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div
      className={`group relative rounded border transition-all duration-300 flex flex-col min-h-[100px] overflow-hidden cursor-pointer ${isFlipped
        ? 'bg-[#0f172a] border-blue-500/30 p-2'
        : 'bg-[#050505] border-white/5 hover:border-white/10 p-2 items-center justify-center'
        }`}
      onClick={() => onFlip(_id)}
    >
      {!isFlipped ? (
        <>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]" />

          <div className="absolute top-3 left-4 right-3 flex justify-between items-start z-20">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 tracking-tight">
                {display_name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 font-bold ${getSignalColor(display_signal_strength)}`}>
                <Signal size={9} />
              </div>
              <FlipButton
                isFlipped={isFlipped}
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip(_id);
                }}
                className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity scale-50 origin-right"
              />
            </div>
          </div>

          <div className="absolute font-mono text-3xl font-black text-white/[0.02] tracking-tighter select-none mt-1">
            888
          </div>

          <div className={`relative z-10 font-mono text-3xl font-black tracking-tighter transition-all duration-300 mt-1 ${getLEDColorClass(current_value)}`}>
            {current_value.toString().padStart(3, '0')}
          </div>

          <div className="absolute bottom-3 flex w-full justify-center">
            <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-600">
              {parseInt(display_type) === 1 ? 'Level Logic' : 'Sector Logic'}
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-col flex-grow animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-500 rounded" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Linked Systems</span>
            </div>
            <FlipButton
              isFlipped={isFlipped}
              onClick={(e) => {
                e.stopPropagation();
                onFlip(_id);
              }}
              className="opacity-50 hover:opacity-100 transition-opacity scale-75 origin-right"
            />
          </div>

          <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar p-1">
            {display_connections_name.length > 0 ? (
              display_connections_name.map((conn, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded bg-white/5 border border-white/5 text-[9px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <div className="w-1 h-1 rounded bg-blue-500" />
                  {conn}
                </div>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic px-2">Isolated node</span>
            )}
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 text-slate-600 uppercase text-[9px] font-bold tracking-widest">
            <div className="flex items-center gap-1.5">
              <Wifi size={10} />
              <span>{display_ipaddress}</span>
            </div>
            <span className="text-blue-500/50">v2.4</span>
          </div>
        </div>
      )}
    </div>
  );
};

DisplaySection.propTypes = {
  display: PropTypes.object.isRequired,
  isFlipped: PropTypes.bool,
  onFlip: PropTypes.func.isRequired
};
