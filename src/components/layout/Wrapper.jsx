import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Wrapper = ({ content }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
      {/* Sidebar - Fixed Position */}
      <Sidebar isOpen={sidebarOpen} content={content} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Navbar - Fixed at top of content area or full width */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Main Content Area - Scrollable */}
        <main
          className={`flex-1 overflow-y-auto pt-16 transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-56" : "translate-x-0"
            } md:translate-x-0 md:ml-56 relative z-0`}
        >
          {/* Subtle Page Background Effect */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded blur-[120px]" />
          </div>

          <div className="relative z-10 p-2 sm:p-3 lg:p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Wrapper;

// bg-[#0A1931]"
