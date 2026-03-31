import { useContext } from "react";
import { apiService } from "../services/api";
import { DeviceContext } from "../context/DeviceContext";

export const apiUtils = () => {
  const { setSpaces, setDevices, setFloors, setParkings } =
    useContext(DeviceContext);

  const getAllSpaces = async () => {
    try {
      const res = await apiService.get("/routes/admin/getAllSpaces");
      //   console.log(res.spaces);
      setSpaces(res.spaces);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllParkings = async () => {
    try {
      const res = await apiService.get("/routes/admin/getAllParkings");
      setParkings(res.parkings);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllDevices = async () => {
    try {
      const res = await apiService.get("/routes/admin/getAllDevices");
      //   console.log("dev", res);
      setDevices(res.devices);
    } catch (error) {
      console.log(error);
    }
  };
  const getAllFloors = async () => {
    let floorData = [];
    try {
      const res = await apiService.get("/routes/admin/getAllFloors");
      res.floors.map((item, index) =>
        floorData.push({ ...item, floor_number: index + 1 })
      );
      setFloors(floorData);
    } catch (error) {
      console.log(error);
    }
  };
  return {
    getAllSpaces,
    getAllDevices,
    getAllFloors,
    getAllParkings,
  };
};
