/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import { useState, memo, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = memo(({ setSidebarOpen }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useAuth();

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  return (
    <nav className="fixed top-0 z-50 w-full backdrop-blur-xl bg-[#0f172a]/60 border-b border-white/5 h-16 shadow-2xl">
      <div className="px-4 h-full lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <SidebarToggle setSidebarOpen={setSidebarOpen} />
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Icon icon="solar:transmission-bold-duotone" className="text-white text-xl" />
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-sm font-black text-white uppercase tracking-widest leading-none">LiquidPark</h1>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter mt-0.5">Parking Guidance System</p>
                </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Healthy</span>
            </div>

            <UserDropdown
              user={user}
              isDropdownOpen={isDropdownOpen}
              toggleDropdown={toggleDropdown}
              closeDropdown={() => setIsDropdownOpen(false)}
            />
          </div>
        </div>
      </div>
    </nav>
  );
});

const SidebarToggle = ({ setSidebarOpen }) => (
  <button
    onClick={() => setSidebarOpen((prev) => !prev)}
    className="inline-flex items-center p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all md:hidden"
  >
    <Icon icon="solar:hamburger-menu-linear" className="text-2xl" />
  </button>
);

const UserDropdown = ({ user, isDropdownOpen, toggleDropdown, closeDropdown }) => {
  const dropdownRef = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
      >
        <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-white leading-none capitalize">{user?.name || "System User"}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{user?.role || "Operator"}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-xl group-hover:scale-105 transition-transform">
            {user?.name?.[0]?.toUpperCase() || "S"}
        </div>
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-14 z-50 mt-2 w-56 bg-[#1e293b]/90 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-white/10 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Signed in as</p>
                <p className="text-xs font-bold text-white truncate">{user?.email}</p>
            </div>
            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                <Icon icon="solar:user-circle-bold-duotone" className="text-lg text-blue-400" />
                Profile Settings
              </button>
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <Icon icon="solar:logout-bold-duotone" className="text-lg" />
                Terminate Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
