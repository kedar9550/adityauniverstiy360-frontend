import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// Set default axios config for all auth requests
axios.defaults.withCredentials = true;
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`);
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (err) {
        // User is not logged in or token expired
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.get(`${API_URL}/logout`);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
