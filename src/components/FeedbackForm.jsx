import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  LinearProgress,
  FormGroup,
  Checkbox,
  Divider,
  Paper,
} from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useLoading } from "../context/LoadingContext";

const ratingLabels = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

const sectionColors = [
  "#0b5299", // Deep Blue
  "#f05819", // Vibrant Orange
  "#10b981", // Emerald Green
  "#8b5cf6", // Royal Purple
  "#be9337", // Modern Gold
  "#ef4444", // Soft Red
  "#14b8a6", // Teal
  "#ec4899", // Pink
];

const toProperCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function FeedbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    roles: allRoles,
    school,
    department,
    designation,
    roundId,
    schoolCode,
    departmentCode,
    employeeRole,
  } = location.state;

  // Split roles into mandatory and optional
  const mandatoryRoles = useMemo(
    () => allRoles.filter((r) => r.mandatory),
    [allRoles],
  );
  const optionalRoles = useMemo(
    () => allRoles.filter((r) => !r.mandatory),
    [allRoles],
  );

  // Track which optional roles the user has decided to add to their current session
  const [selectedOptionalKeys, setSelectedOptionalKeys] = useState([]);

  // Local state for checkboxes in the optional roles prompt
  const [tempSelectedKeys, setTempSelectedKeys] = useState([]);

  // The roles actually being filled in the form
  const roles = useMemo(() => {
    const selectedOptionals = optionalRoles.filter((r) =>
      selectedOptionalKeys.includes(r.key),
    );
    return [...mandatoryRoles, ...selectedOptionals];
  }, [mandatoryRoles, optionalRoles, selectedOptionalKeys]);

  const [activeRole, setActiveRole] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "warning",
  });
  const [submitError, setSubmitError] = useState("");
  const [userChoiceForOptional, setUserChoiceForOptional] = useState(
    employeeRole === "Assoc Dean/Dean" ? "yes" : null,
  );

  // Track whether the user has passed the initial role-selection screen
  // (only relevant when there are zero mandatory roles)
  const [roleSelectionDone, setRoleSelectionDone] = useState(
    mandatoryRoles.length > 0, // skip screen if mandatory roles already exist
  );

  const role = roles[activeRole] || roles[0];
  const port = import.meta.env.VITE_BACKEND_URL;

  /* sort questions */
  const sortedQuestions = useMemo(() => {
    if (!role || !role.questions) return [];
    return [...role.questions].sort((a, b) => a.order - b.order);
  }, [role]);

  //console.log("qq", role.questions);
  //console.log("rr", role);

  /* sections */
  const sections = [...new Set(sortedQuestions.map((q) => q.section.section))];
  const currentSectionColor =
    sectionColors[activeSection % sectionColors.length];

  const isLastRole = activeRole === roles.length - 1;
  const isLastSection = activeSection === sections.length - 1;
  const hasRemainingOptionals = optionalRoles.some(
    (r) => !selectedOptionalKeys.includes(r.key),
  );

  const sectionQuestions = sortedQuestions.filter(
    (q) => q.section.section === sections[activeSection],
  );

  /* rating */

  const handleRating = (roleKey, qid, value) => {
    setResponses((prev) => {
      const roleData = prev[roleKey] || { ratingAnswers: [], textAnswers: [] };

      const ratingAnswers = roleData.ratingAnswers.filter(
        (r) => r.questionId !== qid,
      );

      ratingAnswers.push({ questionId: qid, rating: Number(value) });

      return {
        ...prev,
        [roleKey]: {
          ...roleData,
          ratingAnswers,
        },
      };
    });
  };

  /* text */

  const handleText = (roleKey, qid, value) => {
    setResponses((prev) => {
      const roleData = prev[roleKey] || { ratingAnswers: [], textAnswers: [] };

      const textAnswers = roleData.textAnswers.filter(
        (t) => t.questionId !== qid,
      );

      textAnswers.push({ questionId: qid, answer: value });

      return {
        ...prev,
        [roleKey]: {
          ...roleData,
          textAnswers,
        },
      };
    });
  };

  /* validation */

  const validateSection = () => {
    const roleData = responses[role.key] || {
      ratingAnswers: [],
      textAnswers: [],
    };

    const answeredRatingIds = roleData.ratingAnswers.map((r) => r.questionId);
    const answeredTextIds = roleData.textAnswers.map((t) => t.questionId);

    for (let q of sectionQuestions) {
      if (q.type === "rating" && !answeredRatingIds.includes(q._id)) {
        // alert("Please answer all  questions");
        setToast({
          open: true,
          message: "Please answer all questions",
          severity: "warning",
        });
        return false;
      }

      //   if (q.type === "text" && !answeredTextIds.includes(q._id)) {
      //     alert("Please fill all responses");
      //     return false;
      //   }
    }

    return true;
  };

  /* next */

  const nextSection = () => {
    if (!validateSection()) return;

    if (activeSection < sections.length - 1) {
      setActiveSection((prev) => prev + 1);
    } else {
      if (activeRole < roles.length - 1) {
        setActiveRole((prev) => prev + 1);
        setActiveSection(0);
      }
    }
    window.scrollTo(0, 0);
  };

  /* previous */

  const previousSection = () => {
    if (activeSection > 0) {
      setActiveSection((prev) => prev - 1);
    } else {
      if (activeRole > 0) {
        const prevRole = activeRole - 1;

        const prevSections = [
          ...new Set(
            roles[prevRole].questions
              .sort((a, b) => a.order - b.order)
              .map((q) => q.section.section),
          ),
        ];

        setActiveRole(prevRole);
        setActiveSection(prevSections.length - 1);
      }
    }
    window.scrollTo(0, 0);
  };

  /* browser signature generation */
  const getBrowserSignature = () => {
    let signature = localStorage.getItem("feedback360_browser_signature");
    if (!signature) {
      signature = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
      localStorage.setItem("feedback360_browser_signature", signature);
    }
    return signature;
  };

  /* submit */

  const submit = async () => {
    if (submitting) return;

    // Validation for submit feedback
    const validateAllResponses = () => {
      for (const r of roles) {
        const roleResponses = responses[r.key] || {
          ratingAnswers: [],
          textAnswers: [],
        };

        const answeredRatingIds = roleResponses.ratingAnswers.map((ans) =>
          ans.questionId.toString(),
        );

        const roleQuestions = r.questions.filter((q) => q.type === "rating");

        for (const q of roleQuestions) {
          if (!answeredRatingIds.includes(q._id.toString())) {
            // alert(
            //   "Please answer all rating questions before submitting feedback.",
            // );
            setToast({
              open: true,
              message: "Please answer all questions before submiting feedback",
              severity: "warning",
            });
            return false;
          }
        }
      }
      return true;
    };

    if (!validateAllResponses()) return;

    setSubmitting(true);
    setSubmitError("");

    const browserSignature = getBrowserSignature();

    const payload = {
      school,
      department,
      designation,
      roundId,
      browserSignature,
      giverRole: employeeRole,
      responses: roles.map((r) => ({
        role: r.roleId,
        targetPersonName: r.assignedName, // Include the assigned name in submission
        empId: r.empId,                 // Include the employee id in submission
        ratingAnswers: responses[r.key]?.ratingAnswers || [],
        textAnswers: responses[r.key]?.textAnswers || [],
      })),
    };

    //console.log("FINAL PAYLOAD â†’", payload);

    try {
      await axios.post(`${port}/feedback360/responses/submit`, payload);
      // alert("Feedback submitted successfully!");
      setToast({
        open: true,
        message: "Feedback submitted successfully!",
        severity: "success",
      });
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setSubmitError(error.response.data.message);
      } else {
        setSubmitError("Failed to submit feedback. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── ROLE SELECTION SCREEN (University / all-optional case) ──────────────
  if (!roleSelectionDone) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          width: "100%",
          minHeight: "100vh",
          background: "#f7f9fc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          sx={{
            mx: "auto",
            p: { xs: 3, md: 5 },
            borderRadius: "16px",
            maxWidth: 960,
            width: "100%",
            background: "#ffffff",
            border: "2px dashed #0b5299",
            boxShadow: "0 20px 60px rgba(2,6,23,0.06)",
            textAlign: "center",
          }}
        >
          <Typography variant="h5" sx={{ color: "#0b5299", fontWeight: 700, mb: 1 }}>
            Select Feedback Roles
          </Typography>
          <Box
            sx={{
              width: "100%",
              height: 3,
              background: "#be9337",
              mx: "auto",
              my: 1.5,
              borderRadius: 2,
              mb: 3,
            }}
          />
          <Typography sx={{ color: "#475569", fontSize: "15px", mb: 4 }}>
            Please select the leadership role(s) you would like to provide
            feedback for:
          </Typography>

          {/* Horizontal flex-wrap grid of checkboxes */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 3,
              mb: 4,
            }}
          >
            {optionalRoles.map((r) => (
              <FormControlLabel
                key={r.roleId}
                control={
                  <Checkbox
                    checked={tempSelectedKeys.includes(r.key)}
                    onChange={() => {
                      setTempSelectedKeys((prev) =>
                        prev.includes(r.key)
                          ? prev.filter((k) => k !== r.key)
                          : [...prev, r.key],
                      );
                    }}
                    sx={{
                      color: "#94a3b8",
                      "&.Mui-checked": { color: "#0b5299" },
                      pt: 0,
                    }}
                  />
                }
                label={
                  <Box sx={{ textAlign: "left" }}>
                    <Typography
                      sx={{
                        color: "#1e293b",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {toProperCase(r.assignedName) || r.name}
                    </Typography>
                    <Typography sx={{ color: "#0b5299", fontSize: "0.78rem", mt: 0.3 }}>
                      {r.key === "hod" ? `HOD ${departmentCode}` : r.name}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", minWidth: 180 }}
              />
            ))}
          </Box>

          <Button
            variant="contained"
            disabled={tempSelectedKeys.length === 0}
            onClick={() => {
              setSelectedOptionalKeys(tempSelectedKeys);
              setTempSelectedKeys([]);
              setRoleSelectionDone(true);
              setActiveRole(0);
              setActiveSection(0);
              window.scrollTo(0, 0);
            }}
            sx={{
              background: "#0b5299",
              color: "white",
              px: 6,
              py: 1.5,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "0 10px 20px rgba(11,82,153,0.2)",
              "&:hover": { background: "#094a88" },
              "&.Mui-disabled": { background: "#cbd5e1", color: "#94a3b8" },
            }}
          >
            Start Feedback
          </Button>
        </Paper>
      </Box>
    );
  }


  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },

        width: "100%",
        minHeight: "100vh",
        background: "#f7f9fc",
      }}
    >
      <Paper
        sx={{
          mx: "auto",
          p: { xs: 3, md: 5 },
          borderRadius: "16px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 60px rgba(2,6,23,0.06)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#0b5299", fontWeight: 700 }}>
            Feedback Form
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 3,
              background: "#be9337",
              mx: "auto",
              my: 1,
              borderRadius: 2,
            }}
          />

          <Typography sx={{ color: "#64748b", fontSize: "14px" }}>
            Please answer all questions honestly
          </Typography>
        </Box>

        {/* role tabs */}
        {roles.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Tabs
              value={activeRole}
              onChange={(e, v) => {
                setActiveRole(v);
                setActiveSection(0);
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              {roles.map((r) => (
                <Tab
                  key={r.roleId}
                  disableRipple
                  label={
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        sx={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          textTransform: "none",
                          lineHeight: 1.2,
                        }}
                      >
                        {toProperCase(r.assignedName) || r.name}
                      </Typography>
                      {r.assignedName && (
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            opacity: 0.85,
                            mt: 0.5,
                            textTransform: "none",
                            fontWeight: 500,
                          }}
                        >
                          {r.key === "hod" ? `HOD ${departmentCode}` : r.name}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{
                    textTransform: "none",
                    minHeight: "56px",
                    px: 3,
                    mr: 1.5,

                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",

                    background: "#ffffff",
                    "& .MuiTypography-root": {
                      color: "#0f172a",
                    },

                    "&:hover": {
                      background: "#f1f5f9",
                    },

                    "&.Mui-selected": {
                      background: "#0b5299",
                      borderTop: "3px solid #be9337",

                      "& .MuiTypography-root": {
                        color: "#ffffff",
                      },
                    },
                  }}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {roles.length > 0 && (
          <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1 }, mb: 4, height: 8 }}>
            {sections.map((_, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: "100%",
                  borderRadius: "4px",
                  background: index <= activeSection
                    ? sectionColors[index % sectionColors.length]
                    : "#e2e8f0",
                  transition: "all 0.5s ease",
                  boxShadow: index <= activeSection ? `0 2px 4px ${sectionColors[index % sectionColors.length]}44` : "none"
                }}
              />
            ))}
          </Box>
        )}

        {/* Welcome Message for Optional-only sessions */}
        {roles.length === 0 && employeeRole !== "Assoc Dean/Dean" && (
          <Box sx={{ textAlign: "center", py: 4, mb: 2 }}>
            <CheckCircleRoundedIcon
              sx={{ fontSize: "64px", color: "#10b981", mb: 2 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
              Mandatory Feedback Completed
            </Typography>
            <Typography sx={{ color: "#64748b", mb: 3 }}>
              You have already submitted feedback for all mandatory leadership roles in this round.
            </Typography>
            {!hasRemainingOptionals && (
              <Typography sx={{ color: "#0b5299", fontWeight: 600 }}>
                You have also completed all optional feedback. Thank you!
              </Typography>
            )}
          </Box>
        )}

        {/* section title */}
        {roles.length > 0 && (
          <>
            <Typography
              variant="h5"
              sx={{
                mt: 4,
                mb: 2,
                color: currentSectionColor,
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              {activeSection + 1}. {sections[activeSection]}
            </Typography>
            <Typography sx={{ color: "#64748b", mb: 2 }}>
              Section {activeSection + 1} of {sections.length}
            </Typography>
          </>
        )}

        {/* questions */}
        {roles.length > 0 && sectionQuestions.map((q) => {
          const roleData = responses[role.key] || {
            ratingAnswers: [],
            textAnswers: [],
          };

          const ratingValue =
            roleData.ratingAnswers.find((r) => r.questionId === q._id)
              ?.rating || "";

          const textValue =
            roleData.textAnswers.find((t) => t.questionId === q._id)?.answer ||
            "";

          const globalIndex = sortedQuestions.findIndex(
            (sq) => sq._id === q._id,
          );

          return (
            <Box
              key={q._id}
              sx={{
                display: "flex",
                mb: 3,

                borderRadius: "14px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: `5px solid ${currentSectionColor}`,
                boxShadow: "0 6px 18px rgba(2,6,23,0.05)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: "70px",
                  minHeight: "100%",

                  background: "#f1f5f9",
                  borderRight: "1px solid #e2e8f0",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  fontWeight: 600,
                  fontSize: "16px",
                  color: currentSectionColor,
                }}
              >
                {globalIndex + 1}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 3,
                }}
              >
                {/* QUESTION */}
                <Typography
                  sx={{
                    color: "#1e293b",
                    fontWeight: 700,
                    fontSize: "15px",
                    mb: 2,
                  }}
                >
                  {q.question}
                </Typography>

                {/* RATING */}
                {q.type === "rating" && (
                  <RadioGroup
                    row
                    value={String(ratingValue)}
                    onChange={(e) =>
                      handleRating(role.key, q._id, e.target.value)
                    }
                    sx={{
                      gap: { xs: 1, sm: 3 },
                      flexWrap: "wrap",
                    }}
                  >
                    {ratingLabels.map((label, index) => (
                      <FormControlLabel
                        key={index}
                        value={String(index + 1)}
                        control={<Radio />}
                        label={label}
                        sx={{
                          "& .MuiFormControlLabel-label": {
                            color: "#334155",
                            fontSize: "14px",
                          },
                        }}
                      />
                    ))}
                  </RadioGroup>
                )}

                {/* TEXT */}
                {q.type === "text" && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={textValue}
                    placeholder="Type your response here..."
                    onChange={(e) =>
                      handleText(role.key, q._id, e.target.value)
                    }
                  />
                )}
              </Box>
            </Box>
          );
        })}

        {/* --- OPTIONAL ROLES INTEGRATION UI --- */}
        {((roles.length === 0) || (isLastRole && isLastSection)) && hasRemainingOptionals && userChoiceForOptional !== "no" && (
          <Box
            sx={{
              mt: 4,
              p: 4,
              borderRadius: "14px",
              background: "#f8fafc",
              border: "2px dashed #0b5299",
              textAlign: "center",
              animation: "fadeIn 0.5s ease",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(10px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Typography sx={{ color: "#475569", mb: 3, fontSize: "1.1rem", fontWeight: 500 }}>
              {employeeRole === "Assoc Dean/Dean"
                ? "Select leadership roles you would like to provide feedback for:"
                : roles.length === 0
                ? "Would you like to provide feedback for any of the optional leadership roles listed below?"
                : "Would you like to provide feedback for additional roles such as Deans, Registrar, or Pro Vice-Chancellor?"}
            </Typography>

            {userChoiceForOptional === null && (
              <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => setUserChoiceForOptional("yes")}
                  sx={{
                    background: "#0b5299",
                    color: "white",
                    px: 4,
                    py: 1,
                    borderRadius: "8px",
                    fontWeight: 600,
                    "&:hover": { background: "#094a88" },
                  }}
                >
                  Yes
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setUserChoiceForOptional("no")}
                  sx={{
                    borderColor: "#0b5299",
                    color: "#0b5299",
                    px: 4,
                    py: 1,
                    borderRadius: "8px",
                    fontWeight: 600,
                    "&:hover": { background: "#f1f5f9", borderColor: "#094a88" },
                  }}
                >
                  No
                </Button>
              </Box>
            )}

            {userChoiceForOptional === "yes" && (
              <FormGroup
                sx={{
                  justifyContent: "center",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {optionalRoles
                    .filter((r) => !selectedOptionalKeys.includes(r.key))
                    .map((r) => (
                      <FormControlLabel
                        key={r.roleId}
                        control={
                          <Checkbox
                            checked={tempSelectedKeys.includes(r.key)}
                            onChange={() => {
                              setTempSelectedKeys((prev) =>
                                prev.includes(r.key)
                                  ? prev.filter((k) => k !== r.key)
                                  : [...prev, r.key],
                              );
                            }}
                            sx={{
                              color: "#94a3b8",
                              "&.Mui-checked": { color: "#0b5299" },
                            }}
                          />
                        }
                        label={
                          <Box sx={{ textAlign: "left" }}>
                            <Typography
                              sx={{
                                color: "#1e293b",
                                fontWeight: 600,
                                fontSize: "1rem",
                              }}
                            >
                              {r.assignedName || r.name}
                            </Typography>
                            {r.assignedName && (
                              <Typography
                                sx={{
                                  color: "#64748b",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {r.key === "hod"
                                  ? `HOD ${departmentCode}`
                                  : r.name}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    ))}
                </Box>
              </FormGroup>
            )}

            {tempSelectedKeys.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    const currentRoleCount = roles.length;
                    setSelectedOptionalKeys((prev) => [
                      ...prev,
                      ...tempSelectedKeys,
                    ]);
                    setTempSelectedKeys([]); // Reset temp keys
                    setUserChoiceForOptional(null); // Reset choice for next time
                    setActiveRole(currentRoleCount); // Navigate to the first newly added role
                    setActiveSection(0);
                    window.scrollTo(0, 0);
                  }}
                  sx={{
                    background: "#0b5299", // Blue to match main action
                    color: "white",
                    py: 1.5,
                    px: 6,
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: "0 10px 20px rgba(11,82,153,0.2)",
                    "&:hover": { background: "#094a88" },
                  }}
                >
                  Give Feedback for Selected Roles
                </Button>
                <Typography
                  sx={{ mt: 1, color: "#0b5299", fontSize: "0.85rem" }}
                >
                  Clicking this will take you to the questions for these roles
                </Typography>
              </Box>
            )}

            {userChoiceForOptional === "yes" && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="text"
                  onClick={() => setUserChoiceForOptional("no")}
                  sx={{
                    color: "#64748b",
                    textTransform: "none",
                    fontWeight: 500,
                    textDecoration: "underline",
                    "&:hover": { background: "transparent", color: "#0b5299" },
                  }}
                >
                  No, I'm done. Take me to submission.
                </Button>
              </Box>
            )}

            {/* Remove redundant instructions */}
          </Box>
        )}

        {/* buttons */}
        {roles.length > 0 && (
          <Box
            sx={{
              mt: 5,
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* PREVIOUS */}
            <Button
              variant="outlined"
              onClick={previousSection}
              disabled={activeSection === 0 && activeRole === 0}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                px: 3,
                py: 1,

                borderColor: "#cbd5e1",
                color: "#334155",

                "&:hover": {
                  borderColor: "#0b5299",
                  background: "#f1f5f9",
                },
              }}
            >
              Previous
            </Button>

            {/* SUBMIT */}
            {isLastRole && isLastSection ? (
              (!hasRemainingOptionals || userChoiceForOptional === "no") && (
                <Button
                  variant="contained"
                  onClick={submit}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    px: 4,
                    py: 1,

                    background: "#0b5299",

                    "&:hover": {
                      background: "#094a88",
                    },
                  }}
                >
                  Submit Feedback
                </Button>
              )
            ) : (
              <Button
                variant="contained"
                onClick={nextSection}
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 4,
                  py: 1,

                  background: "#0b5299",

                  "&:hover": {
                    background: "#094a88",
                  },
                }}
              >
                Next
              </Button>
            )}
          </Box>
        )}

        {roles.length === 0 && (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                px: 4,
                borderColor: "#cbd5e1",
                color: "#64748b",
              }}
            >
              Go Back to Home
            </Button>
          </Box>
        )}
      </Paper>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{
            borderRadius: "10px",
            fontWeight: 500,

            background:
              toast.severity === "success"
                ? "#0b5299"
                : toast.severity === "error"
                  ? "#dc2626"
                  : "#334155",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
