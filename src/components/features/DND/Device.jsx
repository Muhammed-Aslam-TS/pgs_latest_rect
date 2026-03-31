import { useContext, useEffect } from "react";
import DndIndex from "./DndIndex";
import { useState } from "react";
import { DeviceContext } from "../../../context/DeviceContext";
import { showSuccessToast } from "../../../utils/toast";
import { apiService } from "../../../services/api";

const Device = ({ selectedDevice, setSelectedDevice }) => {
  const { indexes, setIndexes } = useContext(DeviceContext);
  const handleDrop = (indexId, slot) => {
    setSelectedDevice((prev) => {
      const currentSlots = prev.slots || {};

      return {
        ...prev,
        slots: {
          ...currentSlots,
          [indexId]: { ...slot, device_id: prev.device_id },
        },
      };
    });
  };

  useEffect(() => {
    setIndexes(selectedDevice.slots);
  }, [selectedDevice]);

  console.log(selectedDevice);

  const handleRemoveSlot = (idx) => {
    setSelectedDevice((prev) => {
      const currentSlots = prev.slots || {};
      return {
        ...prev,
        slots: {
          ...currentSlots,
          [idx]: null,
        },
      };
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await apiService.put(
        `/routes/admin/updateDevice/${selectedDevice._id}`,
        selectedDevice
      );
      // Handle the data
      // console.log(response);
      console.log(response);

      if (response.success) showSuccessToast("Device Configured successfully.");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white text-black border-2 border-black p-4 rounded">
        Device ID : {selectedDevice.device_id}
      </div>
      <div className="flex justify-center gap-8">
        {[1, 2, 3].map((id) => (
          <DndIndex
            key={id}
            indexId={id}
            assignedSlot={indexes[id]}
            onDrop={handleDrop}
            handleRemoveSlot={handleRemoveSlot}
          />
        ))}
      </div>
      <div className="flex justify-end w-[98%]">
        <button
          onClick={handleUpdate}
          className="bg-green-600 rounded p-2 cursor-pointer"
        >
          Configure
        </button>
      </div>
    </div>
  );
};

export default Device;
