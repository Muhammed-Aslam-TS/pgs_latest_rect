import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but doesn't have the required role
    // Redirect to a page they have access to, or a "Forbidden" page
    // For now, if they are 'user' trying to access 'admin', send them to dashboard
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
