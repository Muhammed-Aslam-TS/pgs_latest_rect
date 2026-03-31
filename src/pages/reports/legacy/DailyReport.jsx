import React, { useState, useEffect } from 'react';
import { apiService, endpoints } from '../../../services/api';

export const DaylyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(endpoints.reports.daily);
      setReportData(data);
    } catch (error) {
      console.error('Error fetching daily report:', error);
      setError('Failed to fetch daily report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading daily report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Daily Report</h1>
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Add your report data display components here */}
          <div className="bg-[#162447] p-4 rounded-lg">
            <h2 className="text-xl text-white mb-2">Summary</h2>
            <div className="text-white">
              <p>Total Entries: {reportData.totalEntries}</p>
              <p>Total Exits: {reportData.totalExits}</p>
              <p>Average Occupancy: {reportData.averageOccupancy}%</p>
            </div>
          </div>
          {/* Add more report sections as needed */}
        </div>
      )}
    </div>
  );
};
