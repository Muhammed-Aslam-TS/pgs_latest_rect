import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useAuth } from "../../context/AuthContext";

const ADMIN_MENU_ITEMS = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: "solar:widget-linear",
  },
  {
    label: "Parkings",
    to: "parkings",
    icon: "solar:parking-linear",
  },
  {
    label: "Floors",
    to: "floors",
    icon: "solar:layers-linear",
  },
  {
    label: "Zones",
    to: "zones",
    icon: "solar:map-point-wave-linear",
  },
  {
    label: "Spaces",
    to: "spaces",
    icon: "solar:square-academic-cap-linear",
  },
  {
    label: "Devices",
    to: "devices",
    icon: "solar:camera-linear",
  },
  {
    label: "System Settings",
    to: "#",
    icon: "solar:settings-linear",
    subItems: [
      {
        label: "Hardware Config",
        to: "configpgs",
        icon: "solar:cpu-linear",
      },
      {
        label: "User Access",
        to: "#",
        icon: "solar:users-group-rounded-linear",
      },
    ],
  },
];

const DASH_MENU_ITEMS = [
  {
    label: "Dashboard",
    to: "/",
    icon: "solar:home-smile-linear",
  },
  {
    label: "Live Monitoring",
    to: "Displays",
    icon: "solar:monitor-linear",
  },
  {
    label: "Analytics",
    to: "Reports",
    icon: "solar:chart-linear",
  },
];

const Sidebar = ({ isOpen, content }) => {
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const location = useLocation();
  const { user } = useAuth();

  const isActivePath = (path) => {
    if (path === "#") return false;
    if (path === "/admin" && location.pathname === "/admin") return true;
    if (path === "/" && location.pathname === "/") return true;
    
    // Check if the current location starts with the path
    const fullPath = content === "admin" ? `/admin/${path}` : `/${path}`;
    return location.pathname.includes(path) && path !== "";
  };
  
  const isSubActive = (subItems) => {
    return subItems?.some(item => isActivePath(item.to));
  };

  const toggleDropdown = (index) => {
    setOpenDropdownIndex((prev) => (prev === index ? null : index));
  };

  const menuItems = content === "admin" ? ADMIN_MENU_ITEMS : DASH_MENU_ITEMS;

  const renderMenuItem = (item, index) => {
    const isActive = isActivePath(item.to);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isDropdownOpen = openDropdownIndex === index;
    const isParentActive = hasSubItems && (isDropdownOpen || isSubActive(item.subItems));

    return (
      <li key={index} className="flex flex-col gap-1">
        {hasSubItems ? (
          <div>
            <button
              onClick={() => toggleDropdown(index)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                isParentActive
                  ? "bg-blue-500/5 text-blue-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  icon={item.icon} 
                  className={`text-xl transition-colors ${isParentActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"}`} 
                />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              
              <Icon
                icon="solar:alt-arrow-down-linear"
                className={`transition-transform duration-300 text-xs ${isDropdownOpen ? "rotate-180 text-blue-400" : "text-slate-600"}`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <ul className="flex flex-col gap-1 mt-1 ml-6 pl-4 border-l border-white/5">
                    {item.subItems.map((subItem, subIndex) => (
                      <li key={subIndex}>
                        <NavLink
                          to={subItem.to}
                          className={({ isActive }) => `
                            flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-medium transition-all
                            ${isActive 
                              ? "text-blue-400 bg-blue-500/5" 
                              : "text-slate-500 hover:text-white hover:bg-white/5"
                            }
                          `}
                        >
                          <Icon icon={subItem.icon} className="text-lg opacity-80" />
                          <span>{subItem.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <NavLink
            to={item.to}
            className={({ isActive }) => `
              flex items-center justify-between p-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <Icon 
                icon={item.icon} 
                className={`text-xl transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-300"}`} 
              />
              <span className="text-sm font-semibold">{item.label}</span>
            </div>
            
            {isActive && (
              <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </NavLink>
        )}
      </li>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 w-72 h-screen pt-16 bg-[#0b0f1a] border-r border-white/5 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
        <div className="h-full flex flex-col px-4 py-8 overflow-y-auto scrollbar-none">
            {/* Header Section Label */}
            <p className="px-4 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</p>
            
            <ul className="flex flex-col gap-1">
                {menuItems.map(renderMenuItem)}
            </ul>
            
            <div className="mt-auto border-t border-white/5 pt-6 pb-2">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white ring-4 ring-blue-600/10">
                        <span className="font-bold">{user?.name?.[0]?.toUpperCase() || "S"}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user?.name || "Operator"}</p>
                        <p className="text-[10px] font-medium text-slate-500 group-hover:text-blue-400 transition-colors uppercase tracking-wider">
                          {user?.role || "Administrator"}
                        </p>
                    </div>
                    <Icon icon="solar:alt-arrow-right-linear" className="ml-auto text-slate-600 group-hover:text-white transition-all" />
                </div>
            </div>
        </div>
    </aside>
  );
};

export default Sidebar;
