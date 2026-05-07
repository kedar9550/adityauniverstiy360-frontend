import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import aus2 from '../assets/aus2.webp';
import log2 from '../assets/log2.png';
import logo from '../assets/360.png';
import {
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  Divider,
  Tooltip
} from "@mui/material";
import {
  AccountCircle,
  Logout as LogoutIcon,
  LockReset as LockResetIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Logo360 from "./Logo360";

//const Logo = "/360.png";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate("/admin/login");
  };

  const handleChangePassword = () => {
    handleClose();
    navigate("/admin/change-password");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "#0D233B",
        borderBottom: "4px solid #be9337",
        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{
          position: "relative",
          height: { xs: 70, sm: 85, md: 100 },
          display: "flex",
          justifyContent: "space-between",
          px: { xs: 2, sm: 4 }
        }}
      >
        {/* Left Section - Feedback Logo (always on the left now) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: { xs: 0.5, sm: 1 },
            width: "33%"
          }}
        >
          <Box
            sx={{
              height: { xs: 60, sm: 70, md: 80 },
              width: { xs: 60, sm: 70, md: 80 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                transform: {
                  xs: "scale(0.3)",
                  sm: "scale(0.35)",
                  md: "scale(0.4)"
                },
                transformOrigin: "center",
              }}
            >
              <Logo360 logoUrl={logo} />
            </Box>
          </Box>

          <Typography
            sx={{
              display: { xs: user ? "none" : "block", sm: "block" },
              fontWeight: 600,
              letterSpacing: 0.5,
              color: "#ffffff",
              fontSize: { xs: "18px", sm: "24px", md: "30px" },
              textAlign: "left",
            }}
          >
            Feedback
          </Typography>
        </Box>

        {/* Center Section - Aditya Logo (Only visible when logged in) */}
        <Box
          sx={{
            display: user ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            width: "33%"
          }}
        >
          <Box
            component="img"
            src={aus2}
            alt="College Logo"
            sx={{
              display: { xs: "none", sm: "block" },
              height: { sm: 55, md: 70 },
            }}
          />

          <Box
            component="img"
            src={log2}
            alt="College Logo"
            sx={{
              display: { xs: "block", sm: "none" },
              height: 50,
            }}
          />
        </Box>

        {/* Right Section - Profile Icon (logged in) OR Feedback Logo (not logged in) */}
        <Box sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          width: "33%"
        }}>
          {user ? (
            <>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleClick}
                  size="small"
                  sx={{
                    ml: 2,
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    }
                  }}
                  aria-controls={open ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                >
                  <Avatar
                    sx={{
                      width: { xs: 32, sm: 40 },
                      height: { xs: 32, sm: 40 },
                      bgcolor: "#be9337",
                      color: "white"
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : <AccountCircle />}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    borderRadius: "12px",
                    minWidth: "180px",
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#032649" }}>
                    {user.name || "Admin"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    {user.email || user.mobile}
                  </Typography>
                </Box>
                <Divider />
                {user.role === "REPORT_ADMIN" && (
                  <MenuItem onClick={() => { handleClose(); navigate("/admin/dashboard"); }} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <AccountCircle fontSize="small" />
                    </ListItemIcon>
                    Dashboard
                  </MenuItem>
                )}
                {user.role === "CONFIG_ADMIN" && (
                  <MenuItem onClick={() => { handleClose(); navigate("/admin/config"); }} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <AccountCircle fontSize="small" />
                    </ListItemIcon>
                    Configuration
                  </MenuItem>
                )}
                <MenuItem onClick={handleChangePassword} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <LockResetIcon fontSize="small" />
                  </ListItemIcon>
                  Change Password
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: "#d32f2f" }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: "#d32f2f" }} />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            /* Show Aditya Logo on the right when NOT logged in */
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Box
                component="img"
                src={aus2}
                alt="College Logo"
                sx={{
                  display: { xs: "none", sm: "block" },
                  height: { sm: 55, md: 70 },
                }}
              />

              <Box
                component="img"
                src={log2}
                alt="College Logo"
                sx={{
                  display: { xs: "block", sm: "none" },
                  height: 50,
                }}
              />
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
