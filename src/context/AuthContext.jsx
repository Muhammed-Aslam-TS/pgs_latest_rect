import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, endpoints } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Load persisted session
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Backend returns a flat object: { _id, name, email, role, token }
            const data = await apiService.post(endpoints.auth.login, { email, password });

            const { _id, name, email: userEmail, role, token } = data;

            if (token && _id) {
                const userObj = { _id, name, email: userEmail, role };
                setUser(userObj);
                localStorage.setItem("user", JSON.stringify(userObj));
                localStorage.setItem("token", token);
                return { success: true, role };
            } else {
                return { success: false, message: "Invalid response from server" };
            }

        } catch (error) {
            console.error("Login error:", error);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message || "Login failed. Please try again." 
            };
        }
    };

    const register = async (userData) => {
        try {
            // Backend returns a flat object: { _id, name, email, role, token }
            const data = await apiService.post(endpoints.auth.register, userData);

            const { _id, name, email, role, token } = data;

            if (token && _id) {
                const userObj = { _id, name, email, role };
                setUser(userObj);
                localStorage.setItem("user", JSON.stringify(userObj));
                localStorage.setItem("token", token);
                return { success: true, role };
            } else {
                return { success: false, message: "Registration failed. Unexpected server response." };
            }

        } catch (error) {
            console.error("Registration error:", error);
            return { 
                success: false, 
                message: error.response?.data?.message || error.message || "Registration failed. Please try again." 
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
