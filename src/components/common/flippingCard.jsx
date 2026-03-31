import { useState } from "react";
import { motion } from "framer-motion";

const FlipCard = ({ frontContent, backContent }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-64 h-40 perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-700 transform-style-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Front Side */}
        <div className="absolute w-full h-full flex items-center justify-center bg-[#0A1931] text-white text-lg font-bold rounded-xl shadow-lg backface-hidden">
          {frontContent}
        </div>

        {/* Back Side */}
        <div className="absolute w-full h-full flex items-center justify-center bg-[#0A1931] text-white text-lg font-bold rounded-xl shadow-lg transform rotateY-180 backface-hidden">
          {backContent}
        </div>
      </motion.div>
    </div>
  );
};

// Container Component for Mapping
const FlipCardContainer = ({ frontContent, backContent }) => {
  return (
    <FlipCard frontContent={frontContent} backContent={backContent} />
  );
};

export default FlipCardContainer;
