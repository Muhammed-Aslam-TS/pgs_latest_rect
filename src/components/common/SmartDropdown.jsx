import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * SmartDropdown — renders children dropdown menu that auto-detects
 * whether to open LEFT or RIGHT based on available viewport space.
 */
const SmartDropdown = ({ isOpen, children, className = '' }) => {
  const ref = useRef(null);
  const [openLeft, setOpenLeft] = useState(false);

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.left;
      const menuWidth = 176; // w-44 = 11rem = 176px
      setOpenLeft(spaceOnRight < menuWidth + 16); // 16px safety buffer
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={`absolute top-8 mt-2 w-44 bg-[#1e293b] rounded shadow-xl z-[9999] border border-white/10 backdrop-blur-md overflow-hidden flex flex-col ${openLeft ? 'right-0' : 'left-0'
        } ${className}`}
    >
      {children}
    </div>
  );
};

SmartDropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default SmartDropdown;
