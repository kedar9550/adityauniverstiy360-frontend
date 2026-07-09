import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Card,
    CardActionArea,
    Avatar,
    useTheme,
    Button,
    CircularProgress
} from '@mui/material';
import Grid from "@mui/material/Grid";
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StarsIcon from '@mui/icons-material/Stars';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateFeedbackReportPDF } from '../utils/pdfGenerator';

const MotionCard = motion.create ? motion.create(Card) : motion(Card);
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/` || 'http://localhost:7000/';

function FeedbackDashboard() {
    const navigate = useNavigate();
    const theme = useTheme();

    // Data States
    const [schoolsData, setSchoolsData] = useState([]);
    const [departmentsData, setDepartmentsData] = useState([]);
    const [eligibleRolesData, setEligibleRolesData] = useState([]);
    const [roundsData, setRoundsData] = useState([]);

    // Filter States
    const location = useLocation();
    const stateData = location.state || {};

    const [schoolId, setSchoolId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [roundId, setRoundId] = useState(stateData.roundId || '');

    // Stats State
    const [dashboardStats, setDashboardStats] = useState({ totalFeedback: 0, overallAvgRating: 0, roleStats: {} });
    const [giverStats, setGiverStats] = useState([]);

    // Fetch Schools & Rounds on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        axios.get(`${API_BASE_URL}feedback360/schools`)
            .then(res => setSchoolsData(res.data))
            .catch(err => console.error("Error fetching schools", err));

        axios.get(`${API_BASE_URL}feedback360/rounds`)
            .then(res => {
                const rounds = res.data;
                setRoundsData(rounds);
                if (rounds.length > 0) {
                    if (stateData.roundId) {
                        setRoundId(stateData.roundId);
                    } else {
                        // Default to max round (most recent round)
                        setRoundId(rounds[0]._id);
                    }
                }
            })
            .catch(err => console.error("Error fetching rounds", err));
    }, []);

    useEffect(() => {
        if (schoolsData.length > 0 && schoolId !== 'all') {
            const exists = schoolsData.some(s => s._id === schoolId);
            if (!exists) {
                setSchoolId('all');
            }
        }
    }, [schoolsData]);

    // Fetch Departments when School changes
    useEffect(() => {
        if (schoolId && schoolId !== 'all') {
            axios.get(`${API_BASE_URL}feedback360/departments/${schoolId}`)
                .then(res => {
                    const data = res.data;
                    setDepartmentsData(data);
                    setDepartmentId('all'); // FIX
                })
                .catch(err => console.error("Error fetching departments", err));
        } else {
            setDepartmentsData([]);
            setDepartmentId('all'); // FIX
        }
    }, [schoolId]);

    useEffect(() => {
        if (departmentsData.length > 0 && departmentId !== 'all') {
            const exists = departmentsData.some(d => d._id === departmentId);
            if (!exists) {
                setDepartmentId('all');
            }
        }
    }, [departmentsData]);
    // Add stateData.department? It's fine to re-trigger on schoolId change only.

    // Fetch Eligible Roles
    useEffect(() => {
        const selectedSchool = schoolsData.find(s => s._id === schoolId);
        const selectedDept = departmentsData.find(d => d._id === departmentId);

        if (schoolId === 'all' || !schoolId) {
            // Fetch ALL roles from the new API when "All Schools" is selected
            axios.get(`${API_BASE_URL}feedback360/roles/all`)
                .then(res => {
                    const rolesList = res.data.map(role => role.key || role.id || role.name);
                    setEligibleRolesData(rolesList);
                })
                .catch(err => console.error("Error fetching all roles", err));
        } else {
            // Fetch eligible roles normally for a specific school
            axios.post(`${API_BASE_URL}feedback360/roles/eligible`, {
                school: selectedSchool ? selectedSchool.code : '',
                department: departmentId === 'all' ? '' : selectedDept?.code
            })
                .then(res => setEligibleRolesData(res.data))
                .catch(err => console.error("Error fetching eligible roles", err));
        }
    }, [schoolId, departmentId, schoolsData, departmentsData]);

    //console.log('eligible roles', eligibleRolesData)

    // Fetch Dashboard Stats based on active filters
    useEffect(() => {
        let params = {};
        if (schoolId && schoolId !== 'all') {
            const selectedSchool = schoolsData.find(s => s._id === schoolId);
            if (selectedSchool) params.school = selectedSchool._id;
        }
        if (departmentId && departmentId !== 'all') {
            const selectedDept = departmentsData.find(d => d._id === departmentId);
            if (selectedDept) params.department = selectedDept._id;
        }
        if (roundId && roundId !== 'all') {
            params.roundId = roundId;
        } else if (!roundId) {
            // Don't fetch stats until a round is selected (e.g. initial load)
            return;
        }

        axios.get(`${API_BASE_URL}feedback360/reports/dashboard-stats`, { params })
            .then(res => setDashboardStats(res.data))
            .catch(err => console.error("Error fetching dashboard stats", err));
    }, [schoolId, departmentId, roundId, schoolsData, departmentsData]);

    // Fetch Giver Role Stats
    useEffect(() => {
        if (roundId && roundId !== 'all') {
            axios.get(`${API_BASE_URL}feedback360/reports/giver-stats`, { params: { roundId } })
                .then(res => setGiverStats(res.data))
                .catch(err => console.error("Error fetching giver stats", err));
        }
    }, [roundId]);

    const allTargetRoles = {
        'hod': { id: 'hod', title: 'HOD', icon: <ManageAccountsIcon fontSize="large" />, color: '#4facfe' },
        'dean_soe': { id: 'dean_soe', title: 'Dean SoE', icon: <SchoolIcon fontSize="large" />, color: '#43e97b' },
        'associate_dean_fe': { id: 'associate_dean_fe', title: 'Associate Dean FE', icon: <SchoolIcon fontSize="large" />, color: '#43e97b' },
        'associate_dean_sos': { id: 'associate_dean_sos', title: 'Associate Dean SoS', icon: <SchoolIcon fontSize="large" />, color: '#43e97b' },
        'associate_dean_sob': { id: 'associate_dean_sob', title: 'Associate Dean SoB', icon: <SchoolIcon fontSize="large" />, color: '#43e97b' },
        'dean_sop': { id: 'dean_sop', title: 'Dean SoP', icon: <SchoolIcon fontSize="large" />, color: '#43e97b' },
        'registrar': { id: 'registrar', title: 'Registrar', icon: <AccountBalanceIcon fontSize="large" />, color: '#fa709a' },
        'dean_r&c': { id: 'dean_r&c', title: 'Dean Research & Consultancy', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'dean_careers': { id: 'dean_careers', title: 'Dean Career Development', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'dean_student_affairs': { id: 'dean_student_affairs', title: 'Dean Student Affairs', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'dean_admissions': { id: 'dean_admissions', title: 'Dean Admissions', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'dean_administration': { id: 'dean_administration', title: 'Dean Administration', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'dean_iqac': { id: 'dean_iqac', title: 'Dean IQAC', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'dean_ir': { id: 'dean_ir', title: 'Dean International Relations', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'CoE': { id: 'CoE', title: 'Controller of Examinations', icon: <StarsIcon fontSize="large" />, color: '#fa709a' },
        'pro_vc_academics': { id: 'pro_vc_academics', title: 'Pro Vice Chancellor Academics', icon: <AdminPanelSettingsIcon fontSize="large" />, color: '#f6d365' },
        'pro_vc_es': { id: 'pro_vc_es', title: 'Pro Vice Chancellor E&S', icon: <AdminPanelSettingsIcon fontSize="large" />, color: '#f6d365' },
        'pro_vc_sp': { id: 'pro_vc_sp', title: 'Pro Vice Chancellor S&P', icon: <AdminPanelSettingsIcon fontSize="large" />, color: '#f6d365' }
    };


    const toProperCase = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

    const roleOrder = [
        'pro_vc_academics',
        'pro_vc_es',
        'pro_vc_sp',
        'registrar',
        'CoE',
        'dean_r&c',
        'dean_careers',
        'dean_student_affairs',
        'dean_admissions',
        'dean_administration',
        'dean_iqac',
        'dean_ir',
        'dean_sop',
        'dean_soe',
        'associate_dean_fe',
        'associate_dean_sos',
        'associate_dean_sob',
        'hod'
    ];

    // Calculate target roles dynamically
    const targetRoles = [];

    // 1. Add university/school-wide roles from eligibleRolesData
    eligibleRolesData.forEach(roleId => {
        if (roleId !== 'hod') {
            const baseRole = allTargetRoles[roleId] || { id: roleId, title: roleId, icon: <ManageAccountsIcon fontSize="large" />, color: '#4facfe' };
            targetRoles.push({
                ...baseRole,
                roleKey: roleId,
                personName: dashboardStats.roleStats?.[roleId]?.targetPersonName || ""
            });
        }
    });

    // 2. Add HOD roles (potentially multiple) from dashboardStats.roleStats
    if (dashboardStats.roleStats) {
        Object.keys(dashboardStats.roleStats).forEach(statKey => {
            const stat = dashboardStats.roleStats[statKey];
            if (statKey.startsWith('hod_')) {
                const baseRole = allTargetRoles['hod'];
                targetRoles.push({
                    ...baseRole,
                    id: statKey, // Unique key for the list
                    roleKey: 'hod',
                    title: `HOD (${stat.departmentCode})`,
                    departmentId: stat.department,
                    departmentName: stat.departmentName,
                    departmentCode: stat.departmentCode,
                    personName: stat.targetPersonName || ""
                });
            } else if (statKey === 'hod') {
                // Fallback for HOD without specific department key (or if filters are already specific)
                const baseRole = allTargetRoles['hod'];
                const selectedDept = departmentsData.find(d => d._id === departmentId);
                targetRoles.push({
                    ...baseRole,
                    roleKey: 'hod',
                    title: selectedDept ? `HOD (${selectedDept.code})` : baseRole.title,
                    departmentId: departmentId !== 'all' ? departmentId : null,
                    personName: dashboardStats.roleStats?.['hod']?.targetPersonName || ""
                });
            }
        });
    }

    // Sort roles
    targetRoles.sort((a, b) => {
        const indexA = roleOrder.indexOf(a.roleKey);
        const indexB = roleOrder.indexOf(b.roleKey);

        // Primary sort: by roleOrder
        if (indexA !== indexB) {
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        }

        // Secondary sort for HOD: by departmentCode
        if (a.roleKey === 'hod' && b.roleKey === 'hod') {
            return (a.departmentCode || '').localeCompare(b.departmentCode || '');
        }

        return 0;
    });

    const rolesWithFeedback = targetRoles.filter(
        role => (dashboardStats.roleStats?.[role.id]?.totalFeedback || 0) > 0 || (dashboardStats.roleStats?.[role.roleKey]?.totalFeedback || 0) > 0
    );

    const [isNavigating, setIsNavigating] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    const handleDownloadAllReports = async () => {
        if (rolesWithFeedback.length === 0) return;
        setIsDownloadingAll(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const selectedSchool = schoolsData.find(s => s._id === schoolId);
            let isFirstPage = true;

            // Determine previousRoundId
            let previousRoundId = null;
            if (roundId && roundsData.length > 1) {
                const currentIndex = roundsData.findIndex(r => r._id === roundId);
                if (currentIndex !== -1 && currentIndex + 1 < roundsData.length) {
                    previousRoundId = roundsData[currentIndex + 1]._id;
                }
            }

            // Fetch and append data for each role sequentially
            for (let i = 0; i < rolesWithFeedback.length; i++) {
                const role = rolesWithFeedback[i];
                let activeDeptId = role.departmentId || departmentId;
                if (activeDeptId === 'all') activeDeptId = '';
                const activeDept = departmentsData.find(d => d._id === activeDeptId) ||
                    (role.departmentId ? { _id: role.departmentId, name: role.departmentName, code: role.departmentCode } : null);

                const params = { role: role.roleKey };
                if (selectedSchool) params.school = selectedSchool._id;
                if (activeDept) params.department = activeDept._id;
                if (roundId && roundId !== 'all') params.roundId = roundId;

                // Fetch overall report
                const response = await axios.get(`${API_BASE_URL}feedback360/reports`, { params });
                const overallReport = response.data;
                if (!overallReport || overallReport.responses === 0) continue;

                let overallCompare = null;
                if (previousRoundId) {
                    try {
                        const compParams = { round1: previousRoundId, round2: roundId, role: role.roleKey };
                        if (selectedSchool) compParams.school = selectedSchool._id;
                        if (activeDept) compParams.department = activeDept._id;
                        const compRes = await axios.get(`${API_BASE_URL}feedback360/reports/compare`, { params: compParams });
                        overallCompare = compRes.data;
                    } catch (e) {
                        console.error("Comparison fetch error", e);
                    }
                }

                const memberData = {
                    roleKey: role.roleKey,
                    roleTitle: role.title,
                    targetPersonName: overallReport.targetPersonName,
                    overall: { reportData: overallReport, comparisonData: overallCompare },
                    roleWise: {}
                };

                // Fetch role-wise data
                if (overallReport.giverRoleStats) {
                    const roles = Object.keys(overallReport.giverRoleStats);
                    await Promise.all(roles.map(async (r) => {
                        if (role.roleKey === 'hod' && r.toLowerCase() === 'faculty') return;
                        try {
                            const rParams = { ...params, giverRole: r };
                            const rRes = await axios.get(`${API_BASE_URL}feedback360/reports`, { params: rParams });
                            
                            let rCompare = null;
                            if (previousRoundId) {
                                const cParams = { round1: previousRoundId, round2: roundId, role: role.roleKey, giverRole: r };
                                if (selectedSchool) cParams.school = selectedSchool._id;
                                if (activeDept) cParams.department = activeDept._id;
                                const cRes = await axios.get(`${API_BASE_URL}feedback360/reports/compare`, { params: cParams });
                                rCompare = cRes.data;
                            }
                            
                            memberData.roleWise[r] = { reportData: rRes.data, comparisonData: rCompare };
                        } catch (e) {
                            console.error(`Error fetching role ${r}`, e);
                        }
                    }));
                }

                const currentRoundObj = roundsData.find(r => r._id === roundId);
                const prevRoundObj = roundsData.find(r => r._id === previousRoundId);

                generateFeedbackReportPDF(doc, {
                    memberData,
                    isFirstPage,
                    pageWidth,
                    selectedSchool,
                    activeDept,
                    currentRoundObj,
                    prevRoundObj
                });
                
                isFirstPage = false;
            }
            
            if (!isFirstPage) { // at least one page was added
                doc.save('All_Leadership_Reports.pdf');
            } else {
                alert("No valid reports found to download.");
            }
        } catch (error) {
            console.error("Error downloading all reports:", error);
            alert("Failed to download reports. Please try again.");
        } finally {
            setIsDownloadingAll(false);
        }
    };

    const handleRoleClick = async (role) => {
        setIsNavigating(true);
        try {
            // Build parameters
            const selectedSchool = schoolsData.find(s => s._id === schoolId);

            // Use the specific department from the role object if available (for partitioned HODs)
            // Otherwise use the global filter
            let activeDeptId = role.departmentId || departmentId;
            if (activeDeptId === 'all') activeDeptId = '';

            const activeDept = departmentsData.find(d => d._id === activeDeptId) ||
                (role.departmentId ? { _id: role.departmentId, name: role.departmentName, code: role.departmentCode } : null);

            const params = { role: role.roleKey };
            if (selectedSchool) params.school = selectedSchool._id;
            if (activeDept) params.department = activeDept._id;
            if (roundId && roundId !== 'all') params.roundId = roundId;

            // Fetch dynamic report data 
            const response = await axios.get(`${API_BASE_URL}feedback360/reports`, { params });
            const reportData = response.data;

            setIsNavigating(false);

            // Navigate to the reports page with the data in state
            navigate(`/feedback360reports/${role.roleKey}`, {
                state: {
                    reportData,
                    school: selectedSchool ? selectedSchool._id : '',
                    schoolName: selectedSchool ? selectedSchool.name : '',
                    department: activeDept ? activeDept._id : '',
                    departmentName: activeDept ? activeDept.name : '',
                    roundId: roundId !== 'all' ? roundId : '',
                    departmentCode: activeDept ? activeDept.code : ''
                }
            });
        } catch (error) {
            console.error("Error fetching report for role:", error);
            setIsNavigating(false);
            alert("Failed to fetch reports. Please try again.");
        }
    };

    return (
        <Box
            sx={{
                flex: 1,
                backgroundColor: '#f8fafc', // Soft light background
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: { xs: 2, md: 4 },
                position: 'relative',
                overflow: 'hidden',
                minHeight: '100vh'
            }}
        >
            {/* Subtle Texture/Shapes */}
            <Box
                sx={{
                    position: 'absolute',
                    width: 600,
                    height: 600,
                    background: 'radial-gradient(circle, rgba(1, 66, 132, 0.03) 0%, rgba(1, 66, 132, 0) 70%)',
                    top: -200,
                    left: -200,
                    borderRadius: '50%',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: 700,
                    height: 700,
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.03) 0%, rgba(245, 158, 11, 0) 70%)',
                    bottom: -300,
                    right: -200,
                    borderRadius: '50%',
                }}
            />

            <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200 }}>

                {/* Header Section - Minimized as per feedback */}
                <Box sx={{ mb: { xs: 2, md: 3 }, textAlign: 'center' }}>
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                        <Box sx={{ width: 40, height: 3, background: '#014284', mx: 'auto', mb: 1, borderRadius: 2 }} />
                    </motion.div>
                </Box>

                {/* Filters Panel */}
                <Paper
                    component={motion.div}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 4 },
                        mb: 6,
                        borderRadius: "24px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: "space-between",
                            alignItems: { xs: "stretch", sm: "center" },
                            gap: 2,
                            mb: 3
                        }}
                    >

                        <Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    fontSize: { xs: "1.1rem", sm: "1.25rem" }
                                }}
                            >
                                <AssessmentIcon sx={{ color: '#014284' }} /> Filter dashboard data
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#64748b',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    ml: 5.5,
                                    display: { xs: 'none', sm: 'block' }
                                }}
                            >
                                University Leadership 360-Degree Evaluation
                            </Typography>
                        </Box>

                        {/* KPI Card */}
                        <Paper
                            elevation={0}
                            component={motion.div}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            sx={{
                                px: 4,
                                py: 2,
                                borderRadius: "16px",
                                background: "linear-gradient(135deg, #014284 0%, #035cb9 100%)",
                                color: "#ffffff", // Explicit white
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                minWidth: { xs: "100%", sm: 220 },
                                boxShadow: "0 10px 15px -3px rgba(1, 66, 132, 0.3)"
                            }}
                        >
                            <AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#ffffff', opacity: 0.9 }} />

                            <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: 32, lineHeight: 1, color: '#ffffff' }}>
                                    {dashboardStats.totalFeedback}
                                </Typography>

                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#ffffff', opacity: 0.95, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Reports generated
                                </Typography>
                            </Box>

                        </Paper>

                    </Box>
                    <Grid container spacing={3} alignItems="start" justifyContent="start" >
                        {/* Round */}

                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small" sx={{
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "#fcfdff",
                                    borderRadius: "12px",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: "#ffffff",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#014284"
                                        }
                                    }
                                },
                                "& .MuiInputLabel-root": {
                                    color: "#64748b",
                                    fontWeight: 500,
                                }
                            }}>
                                <InputLabel>Academic Year</InputLabel>
                                <Select
                                    value={roundsData.length === 0 ? '' : (roundsData.some(r => r._id === roundId) ? roundId : '')}
                                    label="Academic Year"
                                    onChange={(e) => setRoundId(e.target.value)}
                                >
                                    {roundsData.map((r) => (
                                        <MenuItem key={r._id} value={r._id}>
                                            {r.academicYear ? `${r.academicYear} | ` : ''}
                                            {r.cycle ? `Cycle ${r.cycle}` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* Date Display */}
                            {roundsData.find(r => r._id === roundId) && (
                                <Box sx={{ mt: 1, px: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                                        PERIOD:
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#014284', fontWeight: 700, fontSize: '0.7rem' }}>
                                        {new Date(roundsData.find(r => r._id === roundId).startDate).toLocaleDateString('en-GB')} - {new Date(roundsData.find(r => r._id === roundId).endDate).toLocaleDateString('en-GB')}
                                    </Typography>
                                </Box>
                            )}
                        </Grid>
                        {/* School */}
                        <Grid size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small" sx={{
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "#fcfdff",
                                    borderRadius: "12px",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: "#ffffff",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#014284"
                                        }
                                    }
                                },
                                "& .MuiInputLabel-root": {
                                    color: "#64748b",
                                    fontWeight: 500,
                                }
                            }}>
                                <InputLabel>School</InputLabel>
                                <Select
                                    value={schoolsData.length === 0 ? '' : (schoolsData.some(s => s._id === schoolId) ? schoolId : 'all')}
                                    label="School"
                                    onChange={(e) => setSchoolId(e.target.value)}
                                >
                                    <MenuItem value="all"><em>All Schools</em></MenuItem>
                                    {schoolsData.map((s) => (
                                        <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* department */}
                        {departmentsData.length > 0 && (
                            <Grid size={{ xs: 12, md: 3 }}>
                                <FormControl fullWidth size="small" sx={{
                                    "& .MuiOutlinedInput-root": {
                                        backgroundColor: "#fcfdff",
                                        borderRadius: "12px",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            backgroundColor: "#ffffff",
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "#014284"
                                            }
                                        }
                                    },
                                    "& .MuiInputLabel-root": {
                                        color: "#64748b",
                                        fontWeight: 500,
                                    }
                                }}>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={departmentsData.length === 0 ? '' : (departmentsData.some(d => d._id === departmentId) ? departmentId : 'all')}
                                        label="Department"
                                        onChange={(e) => setDepartmentId(e.target.value)}
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 200,
                                                    maxWidth: 400
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value="all"><em>All Departments</em></MenuItem>
                                        {departmentsData.map((d) => (
                                            <MenuItem key={d._id} value={d._id}>{d.name} ({d.code})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                    </Grid>
                </Paper>



                <Box sx={{ mb: 2 }}>

                    <Box sx={{
                        mb: 3,
                        pb: 2,
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Typography
                            variant="h5"
                            component="div"
                            sx={{
                                fontWeight: 700,
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                            }}
                        >
                            <Box sx={{ width: 4, height: 24, background: '#f59e0b', borderRadius: 1 }} />
                            {dashboardStats.totalFeedback === 0 ? "No Feedback Data Available" : "View leadership reports"}
                        </Typography>

                        {dashboardStats.totalFeedback > 0 && rolesWithFeedback.length > 0 && (
                            <Button
                                variant="contained"
                                onClick={handleDownloadAllReports}
                                disabled={isDownloadingAll}
                                startIcon={isDownloadingAll ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                                sx={{
                                    backgroundColor: '#014284',
                                    color: 'white',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(1, 66, 132, 0.2)',
                                    '&:hover': {
                                        backgroundColor: '#035cb9',
                                    }
                                }}
                            >
                                {isDownloadingAll ? 'Generating PDF...' : 'Download All Reports'}
                            </Button>
                        )}
                    </Box>

                    {dashboardStats.totalFeedback === 0 ? (

                        <Paper
                            sx={{
                                p: 6,
                                textAlign: "center",
                                borderRadius: "16px",
                                background: "rgba(255,255,255,0.15)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                                color: "white"
                            }}
                        >

                            <AssessmentIcon sx={{ fontSize: 60, color: "#94a3b8", mb: 2 }} />

                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                No Feedback Available
                            </Typography>

                            <Typography color="text.secondary">
                                No feedback submissions found for this round.
                            </Typography>

                        </Paper>

                    ) : (

                        <Grid container spacing={3} alignItems="stretch">
                            {rolesWithFeedback.map((role, i) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={role.id}>
                                    <MotionCard
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        whileHover={{
                                            y: -8,
                                            boxShadow: "0 25px 50px -12px rgba(1, 66, 132, 0.15), 0 8px 10px -6px rgba(0,0,0,0.05)"
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                            delay: (i % 8) * 0.05
                                        }}
                                        elevation={0}
                                        sx={{
                                            borderRadius: "24px",
                                            height: 280,
                                            minHeight: 280,
                                            display: "flex",
                                            flexDirection: "column",
                                            background: "#ffffff",
                                            border: "1px solid rgba(226, 232, 240, 0.8)",
                                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
                                            overflow: "hidden",
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                borderColor: 'rgba(1, 66, 132, 0.4)',
                                                background: "linear-gradient(to bottom right, #ffffff, #f8faff)"
                                            }
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => handleRoleClick(role)}
                                            sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
                                        >
                                            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                                <Avatar
                                                    src={`https://info.aec.edu.in/aec/employeephotos/${dashboardStats.roleStats?.[role.id]?.empId || dashboardStats.roleStats?.[role.roleKey]?.empId}.jpg`}
                                                    alt={role.personName}
                                                    sx={{
                                                        width: { xs: 52, sm: 60 },
                                                        height: { xs: 52, sm: 60 },
                                                        border: '2px solid #e2e8f0',
                                                        bgcolor: '#f8fafc',
                                                        color: role.color,
                                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <PersonIcon sx={{ fontSize: 32, opacity: 0.5 }} />
                                                </Avatar>

                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: "10px",
                                                        background: `${role.color}15`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: role.color,
                                                    }}
                                                >
                                                    {React.cloneElement(role.icon, { sx: { fontSize: 22 } })}
                                                </Box>
                                            </Box>

                                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', mb: 2 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: "#0f172a",
                                                        mb: 0.5,
                                                        lineHeight: 1.2,
                                                        fontSize: { xs: "1rem", sm: "1.1rem" },
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                    }}
                                                >
                                                    {toProperCase(role.personName) || "---"}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: "#64748b",
                                                        fontSize: "0.8rem",
                                                        textTransform: 'none',
                                                        letterSpacing: '0.05em'
                                                    }}
                                                >
                                                    {role.title}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    mt: 'auto',
                                                    width: '100%',
                                                    pt: 2.5,
                                                    borderTop: '1px solid #f1f5f9',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                }}
                                            >
                                                {/* Feedback Count */}
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontSize: '0.65rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            color: '#94a3b8',
                                                            fontWeight: 600,
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        Total Feedback
                                                    </Typography>

                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                                                        {dashboardStats.roleStats?.[role.id]?.totalFeedback || 0}
                                                    </Typography>
                                                </Box>

                                                {/* Avg Rating */}
                                                <Box sx={{ flex: 1, textAlign: 'right' }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontSize: '0.65rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                            color: '#94a3b8',
                                                            fontWeight: 600,
                                                            mb: 0.5
                                                        }}
                                                    >
                                                        Avg Rating
                                                    </Typography>

                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontWeight: 800,
                                                            color: '#0f172a',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'flex-end',
                                                            gap: 0.5,
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        <StarsIcon fontSize="small" sx={{ color: '#f59e0b', fontSize: 18 }} />
                                                        {dashboardStats.roleStats?.[role.id]?.avgRating || 0}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardActionArea>
                                    </MotionCard>
                                </Grid>
                            ))}
                        </Grid>)}
                </Box>

            </Box>
        </Box>
    );
}

export default FeedbackDashboard;
