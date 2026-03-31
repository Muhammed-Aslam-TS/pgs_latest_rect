import React from 'react';
import IconButton from './IconButton';

const MenuButton = ({
  isOpen,
  onClick,
  className = '',
  icon = (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  )
}) => {
  return (
    <IconButton
      icon={icon}
      onClick={onClick}
      variant="ghost"
      size="medium"
      className={className}
      tooltip={isOpen ? "Close menu" : "Open menu"}
      ariaLabel={isOpen ? "Close menu" : "Open menu"}
    />
  );
};

export default MenuButton; 