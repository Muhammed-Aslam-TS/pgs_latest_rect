import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const occupancyData = {
  hourly: [
    { time: "00:00", occupancy: 10 },
    { time: "01:00", occupancy: 12 },
    { time: "02:00", occupancy: 8 },
    { time: "03:00", occupancy: 7 },
    { time: "04:00", occupancy: 6 },
    { time: "05:00", occupancy: 5 },
    { time: "06:00", occupancy: 15 },
    { time: "07:00", occupancy: 20 },
    { time: "08:00", occupancy: 30 },
    { time: "09:00", occupancy: 40 },
    { time: "10:00", occupancy: 45 },
    { time: "11:00", occupancy: 50 },
    { time: "12:00", occupancy: 55 },
    { time: "13:00", occupancy: 60 },
    { time: "14:00", occupancy: 58 },
    { time: "15:00", occupancy: 52 },
    { time: "16:00", occupancy: 48 },
    { time: "17:00", occupancy: 45 },
    { time: "18:00", occupancy: 40 },
    { time: "19:00", occupancy: 35 },
    { time: "20:00", occupancy: 30 },
    { time: "21:00", occupancy: 28 },
    { time: "22:00", occupancy: 22 },
    { time: "23:00", occupancy: 20 },
  ],
  daily: [
    { date: "2025-04-01", occupancy: 24 },
    { date: "2025-04-02", occupancy: 30 },
    { date: "2025-04-03", occupancy: 18 },
    { date: "2025-04-04", occupancy: 28 },
    { date: "2025-04-05", occupancy: 32 },
    { date: "2025-04-06", occupancy: 35 },
    { date: "2025-04-07", occupancy: 38 },
    { date: "2025-04-03", occupancy: 18 },
    { date: "2025-04-04", occupancy: 28 },
    { date: "2025-04-05", occupancy: 32 },
    { date: "2025-04-06", occupancy: 35 },
    { date: "2025-04-07", occupancy: 38 },
  ],
  weekly: [
    { week: "Week 1", occupancy: 150 },
    { week: "Week 2", occupancy: 160 },
    { week: "Week 3", occupancy: 170 },
    { week: "Week 4", occupancy: 180 },
  ],
  monthly: [
    { month: "Jan", occupancy: 750 },
    { month: "Feb", occupancy: 800 },
    { month: "Mar", occupancy: 850 },
    { month: "Apr", occupancy: 900 },
    { month: "May", occupancy: 950 },
  ],
};

const OccupancyReport = () => {
  const [view, setView] = useState("daily");

  const getXAxisKey = () => {
    switch (view) {
      case "hourly":
        return "time";
      case "daily":
        return "date";
      case "weekly":
        return "week";
      case "monthly":
        return "month";
      default:
        return "date";
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Occupancy Report
          </h2>
          <p className="text-sm text-gray-500">
            View occupancy trends by hour, day, week, or month.
          </p>
        </div>
        <div>
          {["hourly", "daily", "weekly", "monthly"].map((type) => (
            <button
              key={type}
              onClick={() => setView(type)}
              className={`px-3 py-1 mx-1 rounded-full text-sm font-medium transition ${
                view === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={occupancyData[view]}>
          <XAxis dataKey={getXAxisKey()} />
          <YAxis />
          <Tooltip />
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <Line
            type="monotone"
            dataKey="occupancy"
            stroke="#4f46e5"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OccupancyReport;
