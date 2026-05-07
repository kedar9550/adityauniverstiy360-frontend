import React, { useEffect, useState } from "react";
import { 
  Box, 
  Paper, 
  Grid, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Chip, 
  ButtonGroup,
  Divider,
  Fade,
  Alert
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import axios from "axios";

const backendUrl = `${import.meta.env.VITE_BACKEND_URL}/` || "http://localhost:7000/";

const AdminConfig = () => {
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState("rounds");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    academicYear: "",
    cycle: "",
    key: "",
    mandatory: false,
    round: "",
    startDate: "",
    endDate: "",
    active: true,
    role: "",
    school: "",
    department: "",
    designation: "",
    empId: "",
  });

  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dataList, setDataList] = useState([]);

  const apiMap = {
    roles: "feedback360/roles/all",
    rounds: "feedback360/rounds",
    assignments: "feedback360/assignments/all",
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      let nextData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "role" && value) {
        const selectedRole = roles.find((r) => r._id === value);
        if (selectedRole) {
          nextData.designation = selectedRole.name;
        }
      }
      return nextData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isEditing) {
        if (section === "roles") await axios.post(`${backendUrl}feedback360/roles`, formData);
        if (section === "rounds") {
          const payload = {
            academicYear: formData.academicYear,
            cycle: formData.cycle,
            startDate: formData.startDate,
            endDate: formData.endDate,
            active: formData.active
          };
          await axios.post(`${backendUrl}feedback360/rounds`, payload);
        }
        if (section === "assignments") await axios.post(`${backendUrl}feedback360/assignments`, formData);
        setSuccessMsg("Successfully added!");
      } else {
        if (section === "roles") await axios.put(`${backendUrl}feedback360/roles/${editId}`, formData);
        if (section === "rounds") await axios.put(`${backendUrl}feedback360/rounds/${editId}`, formData);
        if (section === "assignments") await axios.post(`${backendUrl}feedback360/assignments`, { ...formData, id: editId });
        setSuccessMsg("Successfully updated!");
      }

      resetForm();
      setLoading(!loading);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "An error occurred. Please try again.");
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      academicYear: "",
      cycle: "",
      key: "",
      mandatory: false,
      round: "",
      startDate: "",
      endDate: "",
      active: true,
      role: "",
      school: "",
      department: "",
      designation: "",
      empId: "",
    });
    setIsEditing(false);
    setEditId(null);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleEdit = (item) => {
    if (section === "roles") {
      setFormData({
        name: item.name,
        key: item.key,
        mandatory: item.mandatory || false,
      });
    } else if (section === "rounds") {
      setFormData({
        academicYear: item.academicYear || "",
        cycle: item.cycle || "",
        round: item.round,
        startDate: item.startDate?.split("T")[0],
        endDate: item.endDate?.split("T")[0],
        active: item.active,
      });
    } else if (section === "assignments") {
      setFormData({
        name: item.name,
        role: item.role?._id || item.role,
        school: item.school?._id || item.school || "",
        department: item.department?._id || item.department || "",
        designation: item.designation || "",
        empId: item.empId || "",
        active: item.active,
      });
    }
    setEditId(item._id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      if (section === "roles") await axios.delete(`${backendUrl}feedback360/roles/${id}`);
      else await axios.delete(`${backendUrl}feedback360/rounds/${id}`);
      setLoading(!loading);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    resetForm();
  }, [section]);

  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          axios.get(`${backendUrl}feedback360/schools`),
          axios.get(`${backendUrl}feedback360/roles/all`)
        ]);
        setSchools(sRes.data);
        setRoles(rRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAuxData();
  }, []);

  useEffect(() => {
    if (formData.school) {
      axios.get(`${backendUrl}feedback360/departments/${formData.school}`)
        .then(res => setDepartments(res.data))
        .catch(err => console.error(err));
    } else {
      setDepartments([]);
    }
  }, [formData.school]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}${apiMap[section]}`);
        setDataList(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [section, loading]);

  const glassStyle = {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
    p: 3,
    mb: 4
  };

  const academicYears = [0, 1, 2].map((offset) => {
    const year = new Date().getFullYear() - 1 + offset;
    return `${year}-${(year + 1).toString().slice(-2)}`;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "90vh" }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: "#032649" }}>
        Admin Configuration
      </Typography>

      <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
        <ButtonGroup variant="contained" sx={{ borderRadius: "12px", overflow: "hidden" }}>
          <Button 
            onClick={() => setSection("rounds")}
            sx={{ 
              bgcolor: section === "rounds" ? "#be9337" : "#032649",
              "&:hover": { bgcolor: section === "rounds" ? "#a6822f" : "#021b33" }
            }}
          >
            Rounds
          </Button>
          <Button 
            onClick={() => setSection("roles")}
            sx={{ 
              bgcolor: section === "roles" ? "#be9337" : "#032649",
              "&:hover": { bgcolor: section === "roles" ? "#a6822f" : "#021b33" }
            }}
          >
            Roles
          </Button>
          <Button 
            onClick={() => setSection("assignments")}
            sx={{ 
              bgcolor: section === "assignments" ? "#be9337" : "#032649",
              "&:hover": { bgcolor: section === "assignments" ? "#a6822f" : "#021b33" }
            }}
          >
            Assignments
          </Button>
        </ButtonGroup>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: "10px" }}>{successMsg}</Alert>}
      {errorMsg && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>{errorMsg}</Alert>}

      <Paper sx={glassStyle}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <AddIcon color="primary" /> {isEditing ? "Edit" : "Add"} {section.slice(0, -1)}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {section === "rounds" && (
              <>
                <Grid item xs={12} md={isEditing ? 2.5 : 3}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Academic Year</InputLabel>
                    <Select
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      label="Academic Year"
                      required
                      displayEmpty
                      notched
                    >
                      <MenuItem value="" disabled>Select Academic Year</MenuItem>
                      {academicYears.map((year) => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={isEditing ? 1.5 : 2}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Cycle</InputLabel>
                    <Select
                      name="cycle"
                      value={formData.cycle}
                      onChange={handleInputChange}
                      label="Cycle"
                      required
                      displayEmpty
                      notched
                    >
                      <MenuItem value="" disabled>Select Cycle</MenuItem>
                      {[1, 2, 3, 4].map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {isEditing && (
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Round No"
                      name="round"
                      value={formData.round}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      size="small"
                      helperText="Auto-generated"
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={isEditing ? 2.5 : 3}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    name="startDate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.startDate}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={isEditing ? 2.5 : 3}>
                  <TextField
                    fullWidth
                    label="End Date"
                    name="endDate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.endDate}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    required
                  />
                </Grid>
              </>
            )}

            {section === "roles" && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  required
                />
              </Grid>
            )}

            {section === "roles" && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Key"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  required
                />
              </Grid>
            )}

            {section === "assignments" && (() => {
              const selectedRole = roles.find(r => r._id === formData.role);
              const roleKey = selectedRole?.key?.toLowerCase() || "";
              const showSchool = roleKey === "hod" || roleKey.includes("dean");
              const showDepartment = roleKey === "hod";

              return (
                <>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel shrink>Select Role</InputLabel>
                      <Select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        label="Select Role"
                        required
                        displayEmpty
                        notched
                      >
                        <MenuItem value="" disabled>Select Role</MenuItem>
                        {roles.map(r => (<MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {showSchool && (
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel shrink>Select School</InputLabel>
                        <Select
                          name="school"
                          value={formData.school}
                          onChange={handleInputChange}
                          label="Select School"
                          displayEmpty
                          notched
                        >
                          <MenuItem value="">Global / Select School</MenuItem>
                          {schools.map(s => (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {showDepartment && (
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel shrink>Select Department</InputLabel>
                        <Select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          label="Select Department"
                          displayEmpty
                          notched
                        >
                          <MenuItem value="">All Departments / Select Dept</MenuItem>
                          {departments.map(d => (<MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      name="empId"
                      value={formData.empId}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      required
                      placeholder="e.g. 6048"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </>
              );
            })()}

            {section === "roles" && (
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Select Mandatory</InputLabel>
                  <Select
                    name="mandatory"
                    value={formData.mandatory}
                    onChange={handleInputChange}
                    label="Select Mandatory"
                    displayEmpty
                    notched
                  >
                    <MenuItem value="" disabled>Select Mandatory</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {section === "rounds" && (
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="active"
                    value={formData.active}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "center" }}>
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ bgcolor: "#032649", px: 4, height: "45px", borderRadius: "8px" }}
            >
              {isEditing ? "Update" : "Add"} {section.slice(0, -1)}
            </Button>
            {isEditing && (
              <Button 
                onClick={resetForm} 
                variant="outlined" 
                sx={{ px: 4, height: "45px", borderRadius: "8px" }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      <Paper sx={glassStyle}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          {section.charAt(0).toUpperCase() + section.slice(1)} List
        </Typography>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(3, 38, 73, 0.05)" }}>
                <TableCell sx={{ fontWeight: 700 }}>S.No</TableCell>
                {section === "assignments" && <TableCell sx={{ fontWeight: 700 }}>Emp ID</TableCell>}
                {section !== "rounds" && <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>}
                {section === "roles" && <TableCell sx={{ fontWeight: 700 }}>Key</TableCell>}
                {section === "rounds" && (
                  <>
                    <TableCell sx={{ fontWeight: 700 }}>Academic Year</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cycle</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Round No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                  </>
                )}
                {section === "assignments" && (
                  <>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                  </>
                )}
                <TableCell sx={{ fontWeight: 700 }}>{section === "roles" ? "Mandatory" : "Status"}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dataList.map((item, index) => (
                <TableRow key={item._id} sx={{ "&:hover": { bgcolor: "rgba(0,0,0,0.02)" } }}>
                  <TableCell>{index + 1}</TableCell>
                  {section === "assignments" && <TableCell sx={{ fontWeight: 500 }}>{item.empId || "---"}</TableCell>}
                  {section !== "rounds" && (
                    <TableCell sx={{ fontWeight: 500 }}>
                      {item.name}
                    </TableCell>
                  )}
                  {section === "roles" && <TableCell>{item.key}</TableCell>}
                  {section === "rounds" && (
                    <>
                      <TableCell>{item.academicYear}</TableCell>
                      <TableCell>Cycle {item.cycle}</TableCell>
                      <TableCell>Round {item.round}</TableCell>
                      <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(item.endDate).toLocaleDateString()}</TableCell>
                    </>
                  )}
                  {section === "assignments" && (
                    <>
                      <TableCell>{item.role?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          {item.school?.name || "Global"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {item.department?.name || "All Departments"}
                        </Typography>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    {section === "roles" ? (
                      <Chip 
                        label={item.mandatory ? "Yes" : "No"} 
                        color={item.mandatory ? "primary" : "default"} 
                        size="small" 
                        sx={{ borderRadius: "6px" }}
                      />
                    ) : (
                      <Chip 
                        label={item.active ? "Active" : "Inactive"} 
                        color={item.active ? "success" : "default"} 
                        size="small" 
                        sx={{ borderRadius: "6px" }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleEdit(item)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item._id)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AdminConfig;
