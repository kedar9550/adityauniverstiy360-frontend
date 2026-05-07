import { Box, Typography, Container } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        color: "#111",
        backgroundColor: "#fff",
        py: 2,
        textAlign: "center",
        borderTop: "3px solid #be9337"
      }}
    >
      {/* <Typography variant="body2" sx={{color:"#032649", fontWeight: 600}}>
    © {new Date().getFullYear()} 360-Degree Feedback System
  </Typography> */}

      <Typography variant="body2" sx={{ color: "#032649", fontWeight: 600 }}>
        360-Degree Feedback System
      </Typography>

      <Typography variant="caption" sx={{ color: "#64748b" }}>
        Developed by <span style={{ color: "#be9337" }}>IT Applications</span> Team for Internal Academic Feedback.
      </Typography>
    </Box>
  )
}
