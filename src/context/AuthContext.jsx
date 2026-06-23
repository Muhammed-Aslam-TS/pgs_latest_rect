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
            const data = await apiService.post(endpoints.auth.login, { username: email, password });

            const responseData = data.data;

            if (responseData && responseData.token && responseData.id) {
                const userObj = { 
                    _id: responseData.id, 
                    name: responseData.username || responseData.usename, 
                    email: responseData.username || responseData.usename, 
                    role: responseData.role || "user" 
                };
                setUser(userObj);
                localStorage.setItem("user", JSON.stringify(userObj));
                localStorage.setItem("token", responseData.token);
                return { success: true, role: userObj.role };
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
            const data = await apiService.post(endpoints.auth.register, { 
                username: userData.email, 
                password: userData.password,
                role: userData.role
            });

            if (data && data.status === 200) {
                if (data.message === "admin exist") {
                    return { success: false, message: "Admin already exists. Please login." };
                }
                // Registration successful, but no token is returned. 
                // Return success so the component can redirect to login.
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message || "Registration failed. Unexpected server response." };
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
