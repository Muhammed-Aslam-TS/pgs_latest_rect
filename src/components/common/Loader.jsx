import { motion } from "framer-motion";

const Loader = ({ message = "Initializing Systems...", fullScreen = true }) => {
  return (
    <div
      className={`flex items-center justify-center z-[9999] overflow-hidden ${fullScreen ? "fixed inset-0 bg-[#020617]/80 backdrop-blur-2xl" : "w-full h-full py-20 bg-transparent"
        }`}
    >
      {/* Dynamic Background Orbs */}
      {fullScreen && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, 50, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1],
              x: [0, -30, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded blur-[120px]"
          />
        </>
      )}

      <div className="relative flex flex-col items-center">
        {/* Hardware Core Logo/Graphic */}
        <div className="relative w-24 h-24 mb-8">
          {/* Rotating Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded"
          />

          {/* Orbiting Pulsing Ring */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-2 border-4 border-emerald-500 rounded shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          />

          {/* Core Symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-[2px] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
            </motion.div>
          </div>

          {/* Scanline pattern over circle */}
          <div className="absolute inset-0 rounded overflow-hidden pointer-events-none opacity-20">
            <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.5)_2px,rgba(0,0,0,0.5)_4px)]" />
          </div>
        </div>

        {/* Text Area */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: ["4px", "16px", "4px"],
                    backgroundColor: ["rgba(16,185,129,0.3)", "rgba(16,185,129,1)", "rgba(16,185,129,0.3)"]
                  }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 rounded"
                />
              ))}
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-[0.3em] font-mono">
              {message}
            </h2>
          </motion.div>

          {/* Progress Simulation */}
          <div className="w-64 h-1 bg-white/5 rounded overflow-hidden border border-white/5 mx-auto">
            <motion.div
              animate={{ x: [-256, 256] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            />
          </div>

          <motion.p
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] italic"
          >
            Secure Data link active • PGS Core v2.4
          </motion.p>
        </div>
      </div>

      {/* Industrial Bezels */}
      {fullScreen && (
        <>
          <div className="absolute top-8 left-8 border-l-2 border-t-2 border-white/10 w-16 h-16 rounded-tl-xl pointer-events-none" />
          <div className="absolute top-8 right-8 border-r-2 border-t-2 border-white/10 w-16 h-16 rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-8 left-8 border-l-2 border-b-2 border-white/10 w-16 h-16 rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-8 right-8 border-r-2 border-b-2 border-white/10 w-16 h-16 rounded-br-xl pointer-events-none" />
        </>
      )}
    </div>
  );
};

export default Loader;
