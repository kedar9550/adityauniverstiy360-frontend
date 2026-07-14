import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
  Alert,
  Paper,
  Grid,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { motion } from "framer-motion";

export default function Hero2() {
  if (sessionStorage.getItem("feedback_locked") === "true") {
    return <div style={{ width: "100vw", height: "100vh", background: "white", position: "fixed", top: 0, left: 0, zIndex: 9999 }}></div>;
  }

  const [schoolsList, setSchoolsList] = useState([]);
  const [school, setSchool] = useState("");
  const [designation, setDesignation] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [departmentsList, setDepartmentsList] = useState([]);
  const [department, setDepartment] = useState("");

  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roundId, setRoundId] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [doj, setDoj] = useState("");
  const [activeRound, setActiveRound] = useState(null);
  const [dojVerified, setDojVerified] = useState(false);
  const [dojNotEligible, setDojNotEligible] = useState(false);

  const [showRoles, setShowRoles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLocked, setFormLocked] = useState(false);
  const [completedMessage, setCompletedMessage] = useState("");
  const [errors, setErrors] = useState({
    doj: false,
    school: false,
    designation: false,
    department: false,
    employeeRole: false,
  });

  const port = import.meta.env.VITE_BACKEND_URL;

  const navigate = useNavigate();

  const selectedSchool = schoolsList.find((s) => s._id === school);
  const deptFreeCodes = ["SOE", "SOC"];

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



  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await axios.get(`${port}/feedback360/schools`);
        setSchoolsList(res.data);
      } catch (err) {
        //console.log(err);
      }
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    const fetchActiveRound = async () => {
      try {
        const res = await axios.get(`${port}/feedback360/rounds/active`);
        setActiveRound(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchActiveRound();
  }, []);

  /* ---------------- fetch departments ---------------- */

  useEffect(() => {
    if (!school) return;

    const fetchDepartments = async () => {
      try {
        const res = await axios.get(
          `${port}/feedback360/departments/${school}`,
        );
        setDepartmentsList(res.data);
      } catch (err) {
        //console.log(err);
      }
    };

    fetchDepartments();
  }, [school]);



  //  Validation
  const validateForm = () => {
    let newErrors = {
      doj: false,
      school: false,
      designation: false,
      department: false,
      employeeRole: false,
    };

    let valid = true;

    if (!dojVerified) {
      valid = false;
    }

    if (!employeeRole) {
      newErrors.employeeRole = true;
      valid = false;
    }

    if (employeeRole === "Faculty" && !designation) {
      newErrors.designation = true;
      valid = false;
    }

    if (!school) {
      newErrors.school = true;
      valid = false;
    }

    const selectedSchool = schoolsList.find((s) => s._id === school);

    if (
      deptFreeCodes.includes(selectedSchool?.code) &&
      !["Assoc Dean", "Dean", "Assoc Dean/Dean", "Assoc Dean - SOE", "Dean - SOE"].includes(employeeRole) &&
      !department
    ) {
      newErrors.department = true;
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  /* ---------------- form submit ---------------- */
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setCompletedMessage("");



    try {
      setLoading(true);
      setFormLocked(true);

      const selectedSchool = schoolsList.find((s) => s._id === school);
      const selectedDept = departmentsList.find(
        (dept) => dept._id === department,
      );

      const browserSignature = getBrowserSignature();

      const res = await axios.post(`${port}/feedback360/forms`, {
        school: selectedSchool?.code,
        department: selectedDept?.code,
        browserSignature: browserSignature,
        employeeRole: employeeRole,
        doj: doj
      });


      if (res.data.alreadyCompleted) {
        setCompletedMessage(res.data.message);
        setShowRoles(false);
        setFormLocked(false);
        return;
      }

      const rolesData = res.data.roles;
      const roundData = res.data.round;

      setRoles(rolesData);
      setRoundId(roundData.id);
      setSchoolCode(res.data.schoolCode || "");
      setDepartmentCode(res.data.departmentCode || "");

      const mandatoryRoles = rolesData
        .filter((r) => r.mandatory)
        .map((r) => r.key);

      setSelectedRoles(mandatoryRoles);

      // --- AUTO NAVIGATION ---
      if (rolesData.length > 0) {
        setDesignation("");
        setSchool("");
        setDepartment("");
        localStorage.removeItem("feedback360_designation");
        localStorage.removeItem("feedback360_school");
        localStorage.removeItem("feedback360_department");
        navigate("/feedback", {
          state: {
            roles: rolesData, // Pass ALL pending roles (mandatory + optional)
            school,
            department,
            designation: employeeRole === "Faculty" ? designation : "",
            employeeRole,
            doj,
            roundId: roundData.id,
            schoolCode: res.data.schoolCode || "",
            departmentCode: res.data.departmentCode || "",
          },
        });
        window.scrollTo(0, 0);
        return;
      }

      setShowRoles(true);
    } catch (err) {
      //console.log(err);
      if (err.response && err.response.data && err.response.data.message) {
        setCompletedMessage(err.response.data.message);
      } else {
        setCompletedMessage("An error occurred while fetching feedback form.");
      }
      setFormLocked(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoj = () => {
    if (!doj) {
      setErrors((prev) => ({ ...prev, doj: true }));
      return;
    }
    if (activeRound?.dojCutoff && new Date(doj) > new Date(activeRound.dojCutoff)) {
      setDojNotEligible(true);
    } else {
      setDojVerified(true);
      setDojNotEligible(false);
    }
  };

  useEffect(() => {
    if (dojNotEligible) {
      const timer = setTimeout(() => {
        sessionStorage.setItem("feedback_locked", "true");
        window.location.reload();
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [dojNotEligible]);

  const handleRoleChange = (roleKey) => {
    setSelectedRoles((prev) =>
      prev.includes(roleKey)
        ? prev.filter((r) => r !== roleKey)
        : [...prev, roleKey],
    );
  };

  const startFeedback = () => {
    const selectedRoleObjects = roles.filter((r) =>
      selectedRoles.includes(r.key),
    );

    //console.log("selectedRoleObjects", selectedRoleObjects);

    navigate("/feedback", {
      state: {
        roles: selectedRoleObjects,
        school,
        department,
        designation: employeeRole === "Faculty" ? designation : "",
        employeeRole,
        doj,
        roundId,
        schoolCode,
        departmentCode,
      },
    });
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: "18px",
          background: "#ffffff",
          boxShadow: "0 25px 80px rgba(2,6,23,0.08)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#0b5299",
              mb: 1,
            }}
          >
            Start Your Feedback
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 3,
              background: "#be9337",
              margin: "10px auto 20px",
              borderRadius: 2,
            }}
          />

          <Typography
            sx={{
              color: "#64748b",
              fontSize: "15px",
              maxWidth: 500,
              margin: "0 auto",
            }}
          >
            Provide your details to begin the feedback process
          </Typography>
        </Box>

        {dojNotEligible ? (
          <Box sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center" }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                width: { xs: "100%", sm: "80%", md: "60%" },
                textAlign: "center",
                borderRadius: "16px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                boxShadow: "0 10px 30px rgba(239, 68, 68, 0.1)",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#b91c1c", mb: 2 }}>
                Not Allowed
              </Typography>
              <Typography sx={{ color: "#7f1d1d", fontSize: "16px", lineHeight: 1.6 }}>
                You are not allowed to provide feedback in this round as your Date of Joining is after the cutoff date.
              </Typography>
            </Paper>
          </Box>
        ) : !dojVerified ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              mb: 4,
              justifyContent: "center",
              alignItems: "center",
              p: 3,
              borderRadius: "14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <TextField
              fullWidth
              label="Date of Joining"
              name="doj"
              type="date"
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split("T")[0] }}
              sx={{ width: { xs: "100%", sm: 250 } }}
              value={doj}
              onChange={(e) => {
                if (!formLocked) {
                  setDoj(e.target.value);
                  setErrors((prev) => ({ ...prev, doj: false }));
                }
              }}
              error={errors.doj}
              helperText={errors.doj && "Date of Joining is required"}
            />
            <Button
              variant="contained"
              onClick={handleVerifyDoj}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 500,
                background: "linear-gradient(135deg, #0b5299, #0d3f7a)",
                boxShadow: "0 10px 25px rgba(11,82,153,0.25)",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 14px 30px rgba(11,82,153,0.35)",
                },
              }}
            >
              Next
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              mb: 4,
              justifyContent: { xs: "center", md: "flex-start" },
              p: 3,
              borderRadius: "14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* DOJ */}
            <TextField
              fullWidth
              label="Date of Joining"
              name="doj"
              type="date"
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split("T")[0] }}
              sx={{ width: { xs: "100%", sm: 250 } }}
              value={doj}
              disabled
            />

            {/* School */}

          <TextField
            select
            label="School/ University"
            sx={{ width: { xs: "100%", sm: 250 } }}
            value={school}
            onChange={(e) => {
              if (!formLocked) {
                const selectedSchoolId = e.target.value;
                setSchool(selectedSchoolId);
                localStorage.setItem("feedback360_school", selectedSchoolId);

                // Reset Employee Role if it was HOD and the new school is not SOE
                const selectedSchool = schoolsList.find((s) => s._id === selectedSchoolId);
                if ((selectedSchool?.code !== "SOE" && selectedSchool?.code !== "SOC") && employeeRole === "HOD") {
                  setEmployeeRole("");
                }
              }
            }}
            error={errors.school}
            helperText={errors.school && "School is required"}
          >
            {schoolsList.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Employee Role */}

          <TextField
            select
            label="Employee Role"
            sx={{ width: { xs: "100%", sm: 250 } }}
            value={employeeRole}
            onChange={(e) => {
              if (!formLocked) {
                setEmployeeRole(e.target.value);
                setErrors((prev) => ({ ...prev, employeeRole: false }));
              }
            }}
            error={errors.employeeRole}
            helperText={errors.employeeRole && "Employee Role is required"}
          >
            {schoolsList.find((s) => s._id === school)?.code !== "UI" && (
              <MenuItem value="Faculty">Faculty</MenuItem>
            )}

            {(schoolsList.find((s) => s._id === school)?.code === "SOE" || schoolsList.find((s) => s._id === school)?.code === "SOC") && (
              <MenuItem value="HOD">HOD</MenuItem>
            )}

            {selectedSchool?.code === "SOE" && (
              <MenuItem value="Assoc Dean - SOE">Assoc Dean - SOE</MenuItem>
            )}
            {selectedSchool?.code === "SOE" && (
              <MenuItem value="Dean - SOE">Dean - SOE</MenuItem>
            )}
            {selectedSchool?.code !== "SOE" && selectedSchool?.code !== "UI" && (
              <MenuItem value="Assoc Dean/Dean">Assoc Dean/Dean</MenuItem>
            )}


            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="dean_r&c">Dean Research & Consultancy</MenuItem>
            )}
            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="dean_careers">Dean Career Development</MenuItem>
            )}
            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="dean_student_affairs">Dean Student Affairs</MenuItem>
            )}
            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="dean_admissions">Dean Admissions</MenuItem>
            )}
            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="dean_administration">Dean Administration</MenuItem>
            )}
            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="dean_iqac">Dean IQAC</MenuItem>
            )}
            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="CoE">Controller Of Examinations</MenuItem>
            )}
            {schoolsList.find((s) => s._id === school)?.code === "UI" && (
              <MenuItem value="dean_ir">Dean International Relations</MenuItem>
            )}


          </TextField>


          {/* Designation */}

          {employeeRole === "Faculty" && (
            <TextField
              select
              label="Designation"
              sx={{ width: { xs: "100%", sm: 250 } }}
              value={designation}
              onChange={(e) => {
                if (!formLocked) {
                  setDesignation(e.target.value);
                  localStorage.setItem("feedback360_designation", e.target.value);
                }
              }}
              error={errors.designation}
              helperText={errors.designation && "Designation is required"}
            >
              <MenuItem value="Assistant Professor">Assistant Professor</MenuItem>
              <MenuItem value="Associate Professor">Associate Professor</MenuItem>
              <MenuItem value="Professor">Professor</MenuItem>
            </TextField>
          )}

          {/* Department */}

          {deptFreeCodes.includes(selectedSchool?.code) && !["Assoc Dean", "Dean", "Assoc Dean/Dean", "Assoc Dean - SOE", "Dean - SOE"].includes(employeeRole) && (
            <TextField
              select
              label="Department"
              sx={{ width: { xs: "100%", sm: 250 } }}
              value={department}
              onChange={(e) => {
                if (!formLocked) {
                  setDepartment(e.target.value);
                  localStorage.setItem(
                    "feedback360_department",
                    e.target.value,
                  );
                }
              }}
              error={errors.department}
              helperText={errors.department && "Department is required"}
            >
              {departmentsList.map((dept) => (
                <MenuItem key={dept._id} value={dept._id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          )}



          {/* submit */}

          <Box sx={{ textAlign: "center", width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              disabled={loading}
              onClick={handleSubmit}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 500,
                background: "linear-gradient(135deg, #0b5299, #0d3f7a)",
                boxShadow: "0 10px 25px rgba(11,82,153,0.25)",

                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 14px 30px rgba(11,82,153,0.35)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Start"
              )}
            </Button>
          </Box>
        </Box>
        )}

        {completedMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  width: { xs: "100%", sm: "80%", md: "60%" },
                  textAlign: "center",
                  borderRadius: "16px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  boxShadow: "0 10px 30px rgba(14, 165, 233, 0.1)",
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{ fontSize: "64px", color: "#0b5299", mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#0369a1", mb: 2 }}>
                  Feedback Session Complete
                </Typography>
                <Typography sx={{ color: "#0c4a6e", fontSize: "16px", lineHeight: 1.6 }}>
                  {completedMessage}
                </Typography>
              </Paper>
            </Box>
          </motion.div>
        )}

        {/* roles */}

        {/* {showRoles && (
          <Box>
            <Box
              sx={{
                mt: 4,
                p: 3,
                borderRadius: 2,
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(5px)",
              }}
            >
              <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                {roles.some((r) => r.mandatory)
                  ? "Select roles to give feedback"
                  : "Mandatory feedback completed. Would you like to provide feedback for these optional roles as well?"}
              </Typography>

              <FormGroup row sx={{ gap: 4 }}>
                {roles.map((role) => (
                  <FormControlLabel
                    key={role.roleId}
                    control={
                      <Checkbox
                        checked={selectedRoles.includes(role.key)}
                        disabled={role.mandatory}
                        onChange={() => handleRoleChange(role.key)}
                        sx={{
                          color: "white",
                          "&.Mui-checked": {
                            color: "#ec5919",
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: "white" }}>
                        {role.assignedName ? (
                          <>
                            <span style={{ fontWeight: 600 }}>
                              {role.assignedName}
                            </span>
                            <span style={{ opacity: 0.8, fontSize: "0.9rem" }}>
                              {" - "}
                              {role.key === "hod"
                                ? `HOD ${departmentCode}`
                                : role.name}
                            </span>
                          </>
                        ) : (
                          role.name
                        )}
                      </Typography>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                onClick={startFeedback}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontSize: "16px",
                  background: "#ec5919",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                  marginTop: 4,
                }}
              >
                Start Feedback
              </Button>
            </Box>
          </Box>
        )} */}

        <br />
      </Paper>
    </>
  );
}
