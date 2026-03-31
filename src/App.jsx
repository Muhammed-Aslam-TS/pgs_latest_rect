import "./App.css";
import { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "./components/common/Loader";

import PrivateRoute from "./components/layout/PrivateRoute";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider

// Lazy-loaded components
const Wrapper = lazy(() => import("./components/layout/Wrapper"));
const DashBoard = lazy(() => import("./pages/dashboard/DashboardPage"));
const Displays = lazy(() => import("./pages/dashboard/DisplaysPage"));
const DisplayConfig = lazy(() => import("./pages/dashboard/DisplayConfigPage"));
const Reports = lazy(() => import("./pages/reports/ReportsPage"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Register = lazy(() => import("./pages/auth/Register")); // Add Register import
const Parkings = lazy(() => import("./pages/admin/Parkings"));
const Floors = lazy(() => import("./pages/admin/Floors"));
const Zones = lazy(() => import("./pages/admin/Zones"));
const Spaces = lazy(() => import("./pages/admin/Spaces"));
const Devices = lazy(() => import("./pages/admin/Devices"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

function App() {
  return (
    <Suspense fallback={<Loader fullScreen={true} message="Authenticating Connection..." />}>
      <ToastContainer theme="dark" />
      
      {/* AuthProvider must be inside Router (Router is usually in main.jsx) 
          but AuthProvider must wrap Routes to provide checking for PrivateRoute 
      */}
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} /> {/* Add Register Route */}
          {/* Redirect generic /admin/login to /login for consistency */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />

          {/* Protected Admin Section - Only for 'admin' role */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Wrapper content="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="parkings" element={<Parkings />} />
              <Route path="floors" element={<Floors />} />
              <Route path="zones" element={<Zones />} />
               <Route path="spaces" element={<Spaces />} />
               <Route path="devices" element={<Devices />} />
               <Route path="configpgs" element={<DisplayConfig />} />
            </Route>
          </Route>

          {/* Protected User/Dashboard Section - For 'admin' and 'user' */}
          <Route element={<PrivateRoute allowedRoles={['admin', 'user']} />}>
            <Route path="/" element={<Wrapper content="dashboard" />}>
               <Route index element={<DashBoard />} />
               <Route path="Displays" element={<Displays />} />
               <Route path="Reports" element={<Reports />} />
            </Route>
          </Route>

          {/* Fallback route - Redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </AuthProvider>
    </Suspense>
  );
}

export default App;
