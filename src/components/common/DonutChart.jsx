import PropTypes from 'prop-types';
import ReactApexChart from "react-apexcharts";

// Reusable DonutChart Component
export const DonutChart = ({ 
  data = [
    { name: 'Occupied', value: 0 },
    { name: 'Available', value: 0 }
  ], 
  title = '', 
  type = 'zone', 
  id = '', 
  colors, 
  width = 190, 
  height 
}) => {
  const occupied = data?.[0]?.value || 0;
  const available = data?.[1]?.value || 0;
  const total = occupied + available;
  const safeOccupancy = total === 0 ? 0 : Math.round((occupied / total) * 100);
  
  const getDisplayText = () => {
    switch(type) {
      case 'parking':
        return {
          title: title || '',
          countText: `${occupied} Floor${occupied !== 1 ? 's' : ''}`,
          totalText: `${total} Total Floors`,
          id: id ? `P${id}` : ''
        };
      case 'floor':
        return {
          title: title || '',
          countText: `${occupied} Occupied`,
          totalText: `${total} Total Spaces`,
          id: id ? `F${id}` : ''
        };
      case 'zone':
        return {
          title: title || '',
          countText: `${occupied} Occupied`,
          totalText: `${total} Spaces`,
          id: id ? `Z${id}` : ''
        };
      default:
        return {
          title: title || 'Section',
          countText: `${occupied} Occupied`,
          totalText: `${total} Total`,
          id: ''
        };
    }
  };

  const { title: displayTitle, countText, totalText, id: displayId } = getDisplayText();
  
  const options = {
    chart: { type: "donut", background: "transparent" },
    labels: ["Occupied", "Free"],
    colors: colors || ["#FF0000", "#00FF00"],
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "88%",
          labels: { show: true, name: { show: false }, value: { show: false } },
        },
      },
    },
    stroke: { show: false },
    legend: { show: false },
    annotations: {
      position: "front",
      texts: [
        { 
          text: displayTitle, 
          x: "50%", 
          y: "35%", 
          textAnchor: "middle", 
          fontSize: "12px", 
          fontWeight: "600", 
          foreColor: "#94a3b8" 
        },
        { 
          text: `${safeOccupancy}%`, 
          x: "50%", 
          y: "55%", 
          textAnchor: "middle", 
          fontSize: "28px", 
          fontWeight: "800", 
          foreColor: "#fff" 
        }
      ],
    },
  };

  return <ReactApexChart options={options} series={[safeOccupancy, 100 - safeOccupancy]} type="donut" width={width} height={height} />;
};

DonutChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  type: PropTypes.oneOf(['parking', 'floor', 'zone']),
  id: PropTypes.string
};



