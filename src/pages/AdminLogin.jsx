import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, LockOutlined } from "@mui/icons-material";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/` || 'http://localhost:7000/';
  const { login, user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "REPORT_ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "CONFIG_ADMIN") {
        navigate("/admin/config");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");

    const result = await login(email, password);
    if (!result.success) {
      setLocalError(result.message);
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 2.5, sm: 3 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            borderRadius: "24px",
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Box
            sx={{
              mb: 2,
              bgcolor: "#032649",
              borderRadius: "16px",
              p: 2,
              display: "flex",
              color: "white",
              boxShadow: "0 8px 16px rgba(3, 38, 73, 0.2)",
            }}
          >
            <LockOutlined sx={{ fontSize: 32 }} />
          </Box>
          
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              color: "#032649", 
              mb: 0.5, 
              fontWeight: 800,
              letterSpacing: "-0.5px"
            }}
          >
            Admin Login
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: "#64748b", 
              mb: 2,
              textAlign: "center"
            }}
          >
            Sign in to manage your 360-degree feedback system
          </Typography>

          {localError && (
            <Alert 
              severity="error" 
              sx={{ 
                width: "100%", 
                mb: 2, 
                borderRadius: "12px",
                border: "1px solid rgba(211, 47, 47, 0.1)"
              }}
            >
              {localError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ width: "100%" }}>
            <TextField
              margin="dense"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": { borderColor: "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#032649" },
                }
              }}
            />
            <TextField
              margin="dense"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": { borderColor: "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#032649" },
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#64748b" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Link
                to="/admin/forgot-password"
                style={{ 
                  textDecoration: "none", 
                  color: "#032649", 
                  fontSize: "0.875rem",
                  fontWeight: 600
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 1,
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                borderRadius: "12px",
                backgroundColor: "#032649",
                boxShadow: "0 10px 20px rgba(3, 38, 73, 0.2)",
                "&:hover": {
                  backgroundColor: "#04386b",
                  boxShadow: "0 12px 24px rgba(3, 38, 73, 0.3)",
                },
              }}
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin;
