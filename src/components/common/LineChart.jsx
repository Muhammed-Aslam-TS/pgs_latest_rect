import PropTypes from 'prop-types';

import ReactApexChart from "react-apexcharts";

export const ApexChart = ({ data = [] }) => {
  // Transform the data for the chart
  const series = data ? [
    {
      name: 'Occupied Spaces',
      data: data.map(point => ({
        x: point.time,
        y: point.occupancy !== undefined ? point.occupancy : (point.parkingArray?.reduce((sum, park) => sum + (park.total_occupied || 0), 0) || 0)
      }))
    }
  ] : [];

  const options = {
    chart: {
      type: "area",
      height: 350,
      background: "transparent",
      foreColor: "#cbd5e1", // slate-300
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    colors: ["#38bdf8"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 4,
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: 'dark',
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#818cf8"],
        inverseColors: true,
        opacityFrom: 0.8,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    xaxis: {
      type: "category",
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '10px',
          fontWeight: 600,
        }
      }
    },
    yaxis: {
      title: {
        text: "Occupancy Count",
        style: {
          color: '#94a3b8'
        }
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val) {
          return val;
        }
      }
    },
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Parking Occupancy Over Time</h2>
      <div id="chart" className="">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={350}
        />
      </div>
      <div id="html-dist"></div>
    </div>
  );
};

ApexChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    time: PropTypes.string,
    parkingArray: PropTypes.arrayOf(PropTypes.shape({
      total_occupied: PropTypes.number
    }))
  }))
};


