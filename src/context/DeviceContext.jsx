import { createContext, useEffect, useState } from "react";

export const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
  const [indexes, setIndexes] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [devices, setDevices] = useState([]);
  const [floors, setFloors] = useState([]);

  console.log(indexes, "indexes");

  return (
    <DeviceContext.Provider
      value={{
        indexes,
        devices,
        parkings,
        spaces,
        setParkings,
        setDevices,
        setSpaces,
        setIndexes,
        filteredSlots,
        setFilteredSlots,
        floors,
        setFloors,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};
