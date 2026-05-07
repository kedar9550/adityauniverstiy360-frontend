import React, { useState } from "react";
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
import { LockReset as LockResetIcon } from "@mui/icons-material";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:7000';
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // redirect after success
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password. Please try again.");
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
        minHeight: "calc(100vh - 100px)"
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
            <LockResetIcon sx={{ fontSize: 32 }} />
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
            Change Password
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: "#64748b", 
              mb: 2,
              textAlign: "center"
            }}
          >
            Update your account password securely.
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

          <Box component="form" onSubmit={handleChangePassword} sx={{ width: "100%" }}>
            <TextField
              margin="dense"
              required
              fullWidth
              name="currentPassword"
              label="Current Password"
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              variant="outlined"
              sx={{
                mb: 1.5,
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
                mb: 1.5,
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
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              variant="outlined"
              sx={{
                mb: 2,
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
                mt: 1,
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
              {loading ? "Updating..." : "Update Password"}
            </Button>
            <Button
              fullWidth
              onClick={() => navigate(-1)}
              sx={{
                mt: 1,
                color: "#64748b",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { backgroundColor: "transparent", color: "#032649" }
              }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ChangePassword;
