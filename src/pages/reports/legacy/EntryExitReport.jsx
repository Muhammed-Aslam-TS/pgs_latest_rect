import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const dataOptions = {
  hourlyData: [
    { time: "00:00", entry: 5, exit: 3 },
    { time: "01:00", entry: 4, exit: 2 },
    { time: "02:00", entry: 3, exit: 1 },
    { time: "03:00", entry: 3, exit: 4 },
    { time: "04:00", entry: 2, exit: 3 },
    { time: "05:00", entry: 6, exit: 5 },
    { time: "06:00", entry: 10, exit: 8 },
    { time: "07:00", entry: 15, exit: 12 },
    { time: "08:00", entry: 20, exit: 18 },
    { time: "09:00", entry: 30, exit: 25 },
    { time: "10:00", entry: 25, exit: 20 },
    { time: "11:00", entry: 22, exit: 17 },
    { time: "12:00", entry: 18, exit: 16 },
    { time: "13:00", entry: 21, exit: 19 },
    { time: "14:00", entry: 19, exit: 15 },
    { time: "15:00", entry: 17, exit: 14 },
    { time: "16:00", entry: 22, exit: 19 },
    { time: "17:00", entry: 30, exit: 28 },
    { time: "18:00", entry: 27, exit: 22 },
    { time: "19:00", entry: 18, exit: 14 },
    { time: "20:00", entry: 15, exit: 12 },
    { time: "21:00", entry: 12, exit: 10 },
    { time: "22:00", entry: 8, exit: 6 },
    { time: "23:00", entry: 7, exit: 5 },
  ],

  dailyData: [
    { time: "2025-04-01", entry: 200, exit: 180 },
    { time: "2025-04-02", entry: 220, exit: 210 },
    { time: "2025-04-03", entry: 210, exit: 195 },
    { time: "2025-04-04", entry: 240, exit: 220 },
    { time: "2025-04-05", entry: 230, exit: 215 },
    { time: "2025-04-06", entry: 250, exit: 230 },
    { time: "2025-04-07", entry: 280, exit: 260 },
  ],

  weeklyData: [
    { time: "Week 1", entry: 500, exit: 450 },
    { time: "Week 2", entry: 450, exit: 430 },
    { time: "Week 3", entry: 400, exit: 380 },
    { time: "Week 4", entry: 550, exit: 500 },
  ],

  monthlyData: [
    { time: "Jan", entry: 2200, exit: 2100 },
    { time: "Feb", entry: 2100, exit: 2000 },
    { time: "Mar", entry: 2500, exit: 2400 },
    { time: "Apr", entry: 2400, exit: 2300 },
    { time: "May", entry: 2600, exit: 2500 },
  ],
};

const EntryExitReport = () => {
  const [view, setView] = useState("daily");

  const selectedData = dataOptions[`${view}Data`];

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Entry/Exit Report</h2>
          <p className="text-sm text-gray-500">
            Analyze vehicle entry and exit data by hour, day, week, or month.
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
        <BarChart data={selectedData}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="entry" fill="#4ade80" name="Entry" />
          <Bar dataKey="exit" fill="#f87171" name="Exit" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EntryExitReport;
