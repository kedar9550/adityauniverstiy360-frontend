import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Home2 from "./pages/Home2";
import Feed from "./pages/FeedBackPage";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";

import { Box } from "@mui/system";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { LoadingProvider } from "./context/LoadingContext";
import Loader from "./components/Loader";
import axios from "axios";
import { useLoading } from "./context/LoadingContext";

import FeedbackDashboard from "./reportsadmin/dashboard";
import Reports from "./reportsadmin/reports";
import AdminConfig from "./configadmin/Admin_Config";
import ChangePassword from "./pages/ChangePassword";

const AdminRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (user) {
    if (user.role === "REPORT_ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "CONFIG_ADMIN") return <Navigate to="/admin/config" replace />;
  }
  return <Navigate to="/admin/login" replace />;
};

const AxiosInterceptor = ({ children }) => {
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        setIsLoading(true);
        return config;
      },
      (error) => {
        setIsLoading(false);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setIsLoading(false);
        return response;
      },
      (error) => {
        setIsLoading(false);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [setIsLoading]);

  return children;
};

function App() {
  return (
    <BrowserRouter basename="/360degreefeedback/">
      <LoadingProvider>
        <AuthProvider>
          <AxiosInterceptor>
            <Loader />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                background: "#f7f9fc",
              }}
            >
              <Header />

          <Box
            component="main"
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              marginTop: "85px", // Reduced from 100px for better fit
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home2 />} />
              <Route path="/feedback" element={<Feed />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRedirect />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin/reset-password" element={<ResetPassword />} />

              <Route element={<ProtectedRoute allowedRoles={["REPORT_ADMIN", "CONFIG_ADMIN"]} />}>
                <Route path="/admin/change-password" element={<ChangePassword />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={["REPORT_ADMIN"]} />}>
                <Route path="/admin/dashboard" element={<FeedbackDashboard />} />
                <Route path="/feedback360reports/:id" element={<Reports />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["CONFIG_ADMIN"]} />}>
                <Route path="/admin/config" element={<AdminConfig />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>

          <Footer />
            </Box>
          </AxiosInterceptor>
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;