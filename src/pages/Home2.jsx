import Hero from "../components/Hero";
import {Box} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import lightTheme from "../theme";

function App() {
  return (
    <>
      <Box
      sx={{
        flex: 1,
        width: "100%", 
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: { xs: 2, md: 4 },
      }}
    >
      {/* Glow background blob */}
      <Box
        sx={{
          display: { xs: "none", md: "block" }, 
          position: "absolute",
          width: 300,
          height: 300,
          background: "#be9337",
          filter: "blur(100px)",
          opacity: 0.35,
          top: 100,
          left: 200,
        }}
      />

      {/* Second glow blob */}
      <Box
        sx={{
          display: { xs: "none", md: "block" }, 
          position: "absolute",
          width: 350,
          height: 350,
          background: "#be9337",
          filter: "blur(120px)",
          opacity: 0.25,
          bottom: 100,
          right: 200,
        }}
      />

      <ThemeProvider theme={lightTheme}>
  <Hero />
</ThemeProvider>
      
      </Box>
      
      
    </>
  );
}

export default App;
