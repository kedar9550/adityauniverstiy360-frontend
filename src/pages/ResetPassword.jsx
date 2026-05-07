import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LockOutlined } from "@mui/icons-material";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    const storedMaskedMobile = sessionStorage.getItem("maskedMobile");
    if (!storedEmail) {
      navigate("/admin/forgot-password");
    } else {
      setEmail(storedEmail);
      setMaskedMobile(storedMaskedMobile || "your registered mobile");
    }
  }, [navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7000';
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/reset-password`,
        { email, otpCode, newPassword }
      );

      if (response.data.success) {
        setSuccess("Password reset successfully!");
        sessionStorage.removeItem("resetEmail");
        sessionStorage.removeItem("maskedMobile");
        
        // Wait 2 seconds and redirect to login
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
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
            Reset Password
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: "#64748b", 
              mb: 2,
              textAlign: "center"
            }}
          >
            OTP sent to: <strong>{maskedMobile}</strong>
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: "100%", 
                mb: 2, 
                borderRadius: "12px",
                border: "1px solid rgba(211, 47, 47, 0.1)"
              }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                width: "100%", 
                mb: 2, 
                borderRadius: "12px",
                border: "1px solid rgba(76, 175, 80, 0.1)"
              }}
            >
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleResetPassword} sx={{ width: "100%" }}>
            <TextField
              margin="dense"
              required
              fullWidth
              id="otp"
              label="6-Digit OTP"
              name="otp"
              autoFocus
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
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
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": { borderColor: "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#032649" },
                }
              }}
            />
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
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword;
