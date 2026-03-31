// import Parkings from "../components/parkings";
// import Home from "../components/home";
// import { Header } from "../components/header";

import { Home } from "../../components/features/DashboardHome";
import { useEffect } from 'react';
import { initSocket } from '../../services/socket';





// import Floors from "../components/floors";
// import Zones from "../components/zones";

const DashBoard = () => {
  useEffect(() => {
    // Initialize socket when dashboard mounts
    initSocket();
  }, []);

  return (
    <div>
      {/* <Header /> */}
      <div className="flex gap-3 ">
        {/* <Parkings /> */}
       <Home />
      </div>
      {/* <Zones/> */}
    </div>
  );
};

export default DashBoard;
