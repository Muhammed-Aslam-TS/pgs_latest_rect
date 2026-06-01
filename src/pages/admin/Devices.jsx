import { DndProvider } from "react-dnd";
import Device from "../../components/features/DND/Device";
import SlotList from "../../components/features/DND/SlotList";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useContext, useEffect, useState } from "react";
import { DeviceContext } from "../../context/DeviceContext";
import { apiUtils } from "../../utils/apiUtils";
import DeviceList from "../../components/features/DND/DeviceList";
export default function Devices() {
  const { getAllSpaces, getAllDevices, getAllParkings, getAllFloors } =
    apiUtils();
  const {
    filteredSlots,
    devices,
    indexes,
    spaces,
    parkings,
    floors,
    setFilteredSlots,
  } = useContext(DeviceContext);
  const [selectedParking, setSelectedParking] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    getAllSpaces();
    getAllDevices();
    getAllParkings();
    getAllFloors();
  }, []);

  useEffect(() => {
    const usedSlotIds = Object.values(indexes)
      .filter((val) => val !== null)
      .map((slot) => slot._id);
    const filtered = spaces?.filter((item) => item.floor_id === selectedFloor);
    const updated = filtered?.filter((slot) => !usedSlotIds.includes(slot._id));
    setFilteredSlots(updated);
  }, [indexes, spaces, selectedFloor]);

  useEffect(() => {
    const filteredData = devices.filter(
      (item) => item.floor_id == selectedFloor
    );
    setFilteredDevices(filteredData);
  }, [selectedFloor]);

  console.log(selectedDevice);

  return (
    <div className="flex flex-col gap-5">
      <select
        className="bg-gray-200 w-[30%] rounded px-3 py-2 text-sm text-gray-700"
        //   value={selectedParking}
        onChange={(e) => {
          setSelectedParking(e.target.value);
          setSelectedDevice(null);
        }}
      >
        <option value="" disabled selected>
          Select Parking
        </option>
        {parkings?.map((item, index) => (
          <option key={index} value={item.parking_id}>
            {item.parking_name}
          </option>
        ))}
      </select>
      <select
        className="bg-gray-200 w-[30%] rounded px-3 py-2 text-sm text-gray-700"
        // value={selectedFloor}
        onChange={(e) => {
          setSelectedFloor(e.target.value);
          setSelectedDevice(null);
        }}
      >
        <option value="" disabled selected>
          Select Floor
        </option>
        {floors
          ?.filter((floor) => floor?.parking_id == selectedParking)
          .map((item, index) => (
            <option key={index} value={item._id}>
              {item.floor_name || "Floor name unavailable."}
            </option>
          ))}
      </select>
      {selectedFloor && selectedParking ? (
        <DndProvider backend={HTML5Backend}>
          <div className="flex justify-evenly">
            <DeviceList
              devices={filteredDevices}
              setSelectedDevice={setSelectedDevice}
              selectedDevice={selectedDevice}
            />
            {selectedDevice ? (
              <Device
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
              />
            ) : (
              <p>Select a Device.</p>
            )}
            <SlotList slots={filteredSlots} />
          </div>
        </DndProvider>
      ) : (
        <div className="mt-2 width-full">
          <p>Select Parking and floor to start mapping.</p>
        </div>
      )}
    </div>
  );
}
