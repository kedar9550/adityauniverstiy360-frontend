import { Box, Typography, Button, Paper, Divider, Grid } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// export default function Home() {
//   const navigate = useNavigate();

//   const handleStart = () => {
//     navigate("/home");
//     window.scrollTo(0, 0);
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg,#014284,#3588e0)",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         padding: { xs: 2, md: 6 },
//         position: "relative",
//         overflow: "hidden",
//       }}
//     >
//       {/* Glow background blob */}
//       <Box
//         sx={{
//           position: "absolute",
//           width: 300,
//           height: 300,
//           background: "#ed5917",
//           filter: "blur(100px)",
//           opacity: 0.35,
//           top: 100,
//           left: 200,
//         }}
//       />

//       {/* Second glow blob */}
//       <Box
//         sx={{
//           position: "absolute",
//           width: 350,
//           height: 350,
//           background: "#ec5919",
//           filter: "blur(120px)",
//           opacity: 0.25,
//           bottom: 100,
//           right: 200,
//         }}
//       />

//       {/* Content wrapper */}
//       <Box sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1100 }}>
//         <Paper
//           elevation={0}
//           sx={{
//             padding: { xs: 3, md: 6 },
//             width: "100%",
//             borderRadius: "18px",
//             backdropFilter: "blur(14px)",
//             background: "rgba(255,255,255,0.1)",
//             color: "white",
//           }}
//         >
//           <Typography
//             variant="h4"
//             sx={{ mb: 1, fontWeight: 700, textAlign: "center" }}
//           >
//             360-Degree Feedback Questionnaire
//           </Typography>

//           <Typography
//             variant="subtitle1"
//             sx={{
//               mb: 4,
//               color: "#dbeafe",
//               fontStyle: "italic",
//               textAlign: "center",
//             }}
//           >
//             (For Department, School and University Leadership)
//           </Typography>

//           <Typography sx={{ mb: 4, lineHeight: 1.8, fontSize: "16px" }}>
//             This survey aims to gather faculty perceptions of leadership at
//             the Department, School and University levels. Your responses will be anonymous and  kept
//             strictly confidential. The results will be shared only in aggregated
//             form with the Leadership Team to better understand ground realities and  support
//             improvemens in  governance, transparency and academic effectiveness.
//           </Typography>

//           <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.2)" }} />

//           <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
//             Before starting the feedback, you will be required to provide the following details:
//           </Typography>

//           <ul style={{ paddingLeft: "25px", lineHeight: "2", marginBottom: "20px" }}>
//             <li>
//               <Typography>Designation</Typography>
//             </li>
//             <li>
//               <Typography>School </Typography>
//             </li>
//             <li>
//               <Typography>
//                 Department (For School of Engineering only)
//               </Typography>
//             </li>

//           </ul>

//           <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.2)" }} />

//           <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
//             You will be able to provide feedback for the following leadership
//             roles:
//           </Typography>

//           <Typography variant="body2" sx={{ fontStyle: "italic", mb: 2 }}>
//             In the next section, you may select the role(s) you wish to provide feedback on.
//           </Typography>

//           <ul style={{ paddingLeft: "25px", lineHeight: "2", marginBottom: "20px" }}>
//             <li>Head of Department (HoD)</li>
//             <li>Associate Dean (SoE, SoE-FE, SoS, SoB) / Dean (SoP)</li>
//             <li>Registrar</li>
//             <li>Pro Vice Chancellor (Academics, E&S, S&P)</li>
//           </ul>

//           <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.2)" }} />

//           <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>
//             Common Rating Scale
//           </Typography>

//           <ul style={{ paddingLeft: "25px", lineHeight: "2", marginBottom: "20px" }}>
//             <li>1-Strongly Disagree</li>
//             <li>2-Disagree</li>
//             <li>3-Neutral</li>
//             <li>4-Agree</li>
//             <li>5-Strongly Agree</li>
//           </ul>

//           <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.2)" }} />

//           {/* <Typography sx={{ mb: 2, fontWeight: 600, fontSize: "18px" }}>
//             Before you begin:
//           </Typography>

//           <Typography sx={{ mb: 1 }}>
//             • Please provide honest and constructive feedback.
//           </Typography>

//           <Typography sx={{ mb: 1 }}>
//             • Your responses will remain confidential.
//           </Typography>

//           <Typography sx={{ mb: 1 }}>
//             • The survey will take approximately 5–10 minutes.
//           </Typography>

//           <Typography sx={{ mb: 4 }}>
//             • Once submitted, responses cannot be edited.
//           </Typography> */}

//           <Box sx={{ textAlign: "center" }}>
//             <Button
//               variant="contained"
//               size="large"
//               onClick={handleStart}
//               sx={{
//                 padding: "12px 42px",
//                 fontSize: "16px",
//                 borderRadius: "10px",
//                 textTransform: "none",
//                 background: "#ec5919",
//               }}
//             >
//               Start Feedback
//             </Button>
//           </Box>
//         </Paper>
//       </Box>
//     </Box>
//   );
// }

export default function Home() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/home");
    window.scrollTo(0, 0);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: "#f7f9fc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: { xs: 2, md: 6 },
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

      {/* Content wrapper */}
      <Box
        sx={{

          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 3, md: 6 },
            width: "100%",
            maxWidth: 1000,
            mx: "auto",
            borderRadius: "16px",
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 60px rgba(2,6,23,0.08)",
            "& p": {
              lineHeight: 1.7,
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 1,
              fontWeight: 700,
              textAlign: "center",
              color: "#0b5299",
            }}
          >
            360-Degree Feedback Questionnaire
          </Typography>
          <Box
            sx={{
              width: "100%",
              height: 4,
              background: "#be9337",
              margin: "10px auto 30px",
              borderRadius: 2,
            }}
          />

          <Typography
            variant="subtitle1"
            sx={{
              mb: 4,
              color: "#64748b",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            (For Department, School and University Leadership)
          </Typography>

          <Typography
            sx={{
              mb: 4,
              lineHeight: 1.8,
              fontSize: "16px",
              color: "#334155",
              textAlign: "justify",
              textJustify: "inter-word",
              maxWidth: "880px",
              margin: "0 auto 32px",
            }}
          >
            This survey aims to gather faculty perceptions of leadership at the
            Department, School and University levels. Your responses will be
            anonymous and kept strictly confidential. The results will be shared
            only in aggregated form with the Leadership Team to better
            understand ground realities and support improvemens in governance,
            transparency and academic effectiveness.
          </Typography>


          <Divider sx={{ my: 4, borderColor: "#e2e8f0" }} />

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mt: 4,
              mb: 2,
              color: "#0f172a",
              borderLeft: "4px solid #be9337",
              pl: 1.5,
            }}
          >
            Before starting the feedback, you will be required to provide the
            following details:
          </Typography>

          <Box sx={{ mb: 3 }}>
            {[
              "Designation",
              "School",
              "Department (For School of Engineering only)",
            ].map((item, i) => (
              <Typography
                key={i}
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#334155",
                  mb: 1.2,
                  fontSize: "15px",
                  paddingLeft: "30px",
                  fontWeight: "bold"
                }}
              >
                {/* <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#0b5299",
                  }}
                /> */}
                <ArrowRightAltIcon sx={{ color: "#0b5299" }} />
                {item}
              </Typography>
            ))}
          </Box>

          <Divider sx={{ my: 4, borderColor: "#e2e8f0" }} />

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mt: 4,
              mb: 2,
              color: "#0f172a",
              borderLeft: "4px solid #be9337",
              pl: 1.5,
            }}
          >
            You will be able to provide feedback for the following leadership
            roles:
          </Typography>

          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", mb: 2, color: "#64748b" }}
          >
            In the next section, you may select the role(s) you wish to provide
            feedback on.
          </Typography>

          {/* <ul style={{ paddingLeft: "25px", lineHeight: "2", marginBottom: "20px" }}>
            <li>Head of Department (HoD)</li>
            <li>Associate Dean (SoE, SoE-FE, SoS, SoB) / Dean (SoP)</li>
            <li>Registrar</li>
            <li>Pro Vice Chancellor (Academics, E&S, S&P)</li>
          </ul> */}
          <Box sx={{ mb: 3 }}>
            {[
              "Head of the Department(HoD)",
              "Associate Dean (SoE, FE, SoS, SoB) / Dean (SoP)",
              "Registrar",
              "Pro Vice Chancellor (Academics, E&S, S&P)",
            ].map((item, i) => (
              <Typography
                key={i}
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#334155",
                  mb: 1.2,
                  fontSize: "15px",
                  paddingLeft: "30px",
                  fontWeight: "bold"
                }}
              >
                <ArrowRightAltIcon sx={{ color: "#0b5299" }} />
                {item}
              </Typography>
            ))}
          </Box>

          <Divider sx={{ my: 4, borderColor: "#e2e8f0" }} />

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mt: 4,
              mb: 2,
              color: "#0f172a",
              borderLeft: "4px solid #be9337",
              pl: 1.5,
            }}
          >
            Common Rating Scale
          </Typography>

          {/* <ul style={{ paddingLeft: "25px", lineHeight: "2", marginBottom: "20px" }}>
            <li>1-Strongly Disagree</li>
            <li>2-Disagree</li>
            <li>3-Neutral</li>
            <li>4-Agree</li>
            <li>5-Strongly Agree</li>
          </ul> */}
          <Box sx={{ mb: 3 }}>
            {[
              "1-Strongly Disagree",
              "2-Disagree",
              "3-Neutral",
              "4-Agree",
              "5-Strongly Agree",
            ].map((item, i) => (
              <Typography
                key={i}
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#334155",
                  mb: 1.2,
                  fontSize: "15px",
                  paddingLeft: "30px",
                  fontWeight: "bold"
                }}
              >
                <ArrowRightAltIcon sx={{ color: "#0b5299" }} />
                {item}
              </Typography>
            ))}
          </Box>

          <Divider sx={{ my: 4, borderColor: "#e2e8f0" }} />

          <Box sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleStart}
              sx={{
                padding: "12px 42px",
                fontSize: "16px",
                borderRadius: "10px",
                textTransform: "none",
                background: "#0b5299",
                boxShadow: "0 6px 20px rgba(11,82,153,0.25)",

                "&:hover": {
                  background: "#094a88",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Start Feedback
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
