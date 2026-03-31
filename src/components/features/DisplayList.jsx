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
      className={`group relative p-5 rounded-3xl border transition-all duration-300 flex flex-col min-h-[220px] overflow-hidden ${
        isFlipped 
          ? 'bg-[#0f172a] border-blue-500/30' 
          : 'bg-white/5 border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div className="max-w-[80%]">
          <h3 className={`text-sm font-bold truncate transition-colors tracking-tight ${isFlipped ? 'text-white' : 'text-slate-300'}`}>
            {display_name}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
            {parseInt(display_type) === 1 ? 'Level Logic' : 'Sector Logic'}
          </p>
        </div>
        <FlipButton
          isFlipped={isFlipped}
          onClick={(e) => {
            e.stopPropagation();
            onFlip(_id);
          }}
          className="opacity-50 hover:opacity-100 transition-opacity"
        />
      </div>

      {!isFlipped ? (
        <div className="flex flex-col flex-grow">
          <div className="flex-grow flex flex-col items-center justify-center relative my-2 bg-black/40 rounded-2xl border border-white/5 py-6">
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px]" />
            
            <div className="absolute font-mono text-5xl font-black text-white/[0.02] tracking-tighter select-none">
              888
            </div>

            <div className={`relative z-10 font-mono text-5xl font-black tracking-tighter transition-all duration-300 ${getLEDColorClass(current_value)}`}>
              {current_value.toString().padStart(3, '0')}
            </div>
            
            <p className="mt-3 text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">
               Operational Node
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-white/5 border border-white/5">
                 <Wifi size={11} className="text-slate-500" />
              </div>
              <span className="font-mono text-[10px] text-slate-400">{display_ipaddress}</span>
            </div>
            <div className={`flex items-center gap-1.5 font-bold ${getSignalColor(display_signal_strength)}`}>
              <Signal size={12} />
              <span className="text-[10px]">{display_signal_strength}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-grow animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3 bg-blue-500 rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Linked Systems</span>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar p-1">
            {display_connections_name.length > 0 ? (
              display_connections_name.map((conn, idx) => (
                <div 
                  key={idx} 
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  {conn}
                </div>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic px-2">Isolated node</span>
            )}
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5 text-slate-600 uppercase text-[9px] font-bold tracking-widest">
             <span>Cloud Verified</span>
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
