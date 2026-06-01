const DeviceList = ({ devices, setSelectedDevice, selectedDevice }) => {
  //   console.log("dev", devices);

  return (
    <div className="p-4 bg-gray-100 rounded">
      <input
        type="text"
        placeholder="Search Devices.."
        className="border border-gray-400 mb-5 text-gray-800 rounded px-2 py-1"
      />
      {devices?.map((device) => (
        <div
          onClick={() => setSelectedDevice(device)}
          key={device._id}
          className={`p-2 relative  text-white text-center rounded mb-2 cursor-pointer ${device?._id === selectedDevice?._id
            ? "bg-yellow-500"
            : "bg-blue-500"
            }`}
        >
          {device.device_id}
        </div>
      ))}
    </div>
  );
};

export default DeviceList;
