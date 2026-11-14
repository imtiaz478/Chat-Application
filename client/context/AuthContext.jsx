import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || "";
const backendUrl = rawBackendUrl.replace(/\/$/, "");

axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    // Check if user is authenticated
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            localStorage.removeItem("token");
            setToken(null);
            setAuthUser(null);
            delete axios.defaults.headers.common["token"];
        }
    };

    // Login / Signup
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);

                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token);

                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Logout
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        delete axios.defaults.headers.common["token"];
        toast.success("Logged out successfully");
        socket?.disconnect();
        setSocket(null);
    };

    // Update Profile
    const updateProfile = async (body) => {
        try {
            console.log("PROFILE BODY:", body);

            const { data } = await axios.put("/api/auth/update-profile", body);

            console.log("PROFILE RESPONSE:", data);

            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            } else {
                console.log("PROFILE UPDATE FAILED:", data.message);
                toast.error(data.message);
            }
        } catch (error) {
            console.log("PROFILE ERROR:", error);
            console.log("STATUS:", error.response?.status);
            console.log("ERROR DATA:", error.response?.data);

            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Connect Socket.IO
    const connectSocket = (userData) => {
        if (!userData || socket?.connected || !backendUrl) return;

        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            },
        });

        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token;
            checkAuth();
        }
    }, [token]);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};