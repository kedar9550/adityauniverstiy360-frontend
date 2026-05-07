import {Box} from "@mui/material";
import FeedbackPage from "../components/FeedbackForm";

function Feed() {
  return (
    <>
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
    <FeedbackPage/>
    </>
  );
}

export default Feed;
