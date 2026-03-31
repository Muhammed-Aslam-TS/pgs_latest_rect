import PropTypes from "prop-types";
import { memo } from "react";
import ProgressBar from "./ProgressBar";

const Section = memo(
  ({
    title,
    type = "basic", // 'basic' or 'progress'
    content,
    progressData,
    className = "",
  }) => {
    const renderContent = () => {
      if (type === "basic") {
        return (
          <div className="glass h-12 w-full flex items-center justify-center rounded-xl px-4 text-xs text-white sm:text-sm md:text-base glass-hover">
            {content}
          </div>
        );
      }

      if (type === "progress") {
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            {progressData.map((item, index) => (
              <div
                key={index}
                className="glass flex w-full flex-col gap-2 rounded-xl p-2.5 text-white sm:w-1/2 glass-hover"
              >
                <div className="text-center text-xs sm:text-sm md:text-base">
                  {item.label}
                </div>
                <ProgressBar
                  progress={item.progress}
                  barColor={
                    item.label === "Availability"
                      ? "bg-green-500"
                      : "bg-red-600"
                  }
                  height="h-1.5"
                  animated={true}
                  showLabel={true}
                  labelPosition="left"
                  className="px-1.5"
                />
              </div>
            ))}
          </div>
        );
      }
    };

    return (
      <div className={`space-y-2 px-3 ${className}`}>
        <h1 className="text-white text-start text-sm sm:text-base font-medium flex items-center gap-2">
          <span className="w-0.5 h-4 bg-blue-500 rounded-full"></span>
          {title}
        </h1>
        {renderContent()}
      </div>
    );
  }
);

Section.displayName = "Section";

Section.propTypes = {
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["basic", "progress"]),
  content: PropTypes.string,
  progressData: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      progress: PropTypes.number.isRequired,
    })
  ),
  className: PropTypes.string,
};

export default Section;
