import PropTypes from 'prop-types';
import { memo } from 'react';

const ProgressBar = memo(({ 
  progress, 
  height = "h-1.5",
  barColor = "bg-blue-500",
  backgroundColor = "bg-white/10",
  animated = true,
  showLabel = false,
  labelPosition = "right",
  className = ""
}) => {
  const progressValue = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      {showLabel && labelPosition === "left" && (
        <span className="text-xs font-medium min-w-[2rem] text-center">
          {progressValue}%
        </span>
      )}
      
      <div className={`w-full ${height} ${backgroundColor} rounded-full relative overflow-hidden`}>
        <div
          className={`h-full rounded-full ${barColor} ${
            animated ? "transition-all duration-300" : ""
          }`}
          style={{ width: `${progressValue}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-white/10 rounded-full" />
          )}
        </div>
      </div>

      {showLabel && labelPosition === "right" && (
        <span className="text-xs font-medium min-w-[2rem] text-center">
          {progressValue}%
        </span>
      )}
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  height: PropTypes.string,
  barColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  animated: PropTypes.bool,
  showLabel: PropTypes.bool,
  labelPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string
};

export default ProgressBar; 