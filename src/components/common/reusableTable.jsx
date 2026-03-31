import React, { useState } from "react";

const ReusableTable = ({
  columns,
  data,
  currentPage = 1,
  pageSize = 10,
  message,
}) => {
  const [sortConfig, setSortConfig] = useState(null);

  const getSortedData = () => {
    if (!sortConfig) return data;

    const { key, direction } = sortConfig;
    return [...data].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (col) => {
    if (!col.sortKey) return;

    setSortConfig((prev) => {
      if (prev?.key === col.sortKey) {
        return {
          key: col.sortKey,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: col.sortKey, direction: "asc" };
    });
  };

  const sortedData = getSortedData();

  return (
    <div className=" border text-white">
      <table className="min-w-full text-left border">
        <thead className="">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                onClick={() => handleSort(col)}
                className={`p-3 font-semibold border cursor-pointer whitespace-nowrap ${
                  col.sortKey ? "hover:text-blue-500" : ""
                }`}
              >
                {col.header}
                {col.sortKey &&
                  sortConfig?.key === col.sortKey &&
                  (sortConfig.direction === "asc" ? " ↑" : " ↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? ( // Check if sorted data is empty
            <tr>
              <td
                colSpan={columns.length}
                className="p-4 text-center text-gray-500 text-white"
              >
                {message}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-3 border">
                    {typeof col.accessor === "function"
                      ? col.accessor(row, rowIndex, currentPage, pageSize)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReusableTable;
