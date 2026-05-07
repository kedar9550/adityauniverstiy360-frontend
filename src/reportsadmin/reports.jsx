import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import './reports.css';
import HomeIcon from '@mui/icons-material/Home';
import DownloadIcon from '@mui/icons-material/Download';
import StarIcon from '@mui/icons-material/Star';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/` || 'http://localhost:7000/';

const getDistributionData = (apiDistribution, totalResponses) => {
    if (!apiDistribution || apiDistribution.length === 0 || !totalResponses) {
        return [
            { label: "Strongly\nDisagree", value: 0, displayValue: "0%", color: "#f5853f", textColor: "#f5853f" },
            { label: "Disagree", value: 0, displayValue: "0%", color: "#fbd3a2", textColor: "#666" },
            { label: "Neutral", value: 0, displayValue: "0%", color: "#dde0e5", textColor: "#666" },
            { label: "Agree", value: 0, displayValue: "0%", color: "#e4f1e5", textColor: "#666" },
            { label: "Strongly\nAgree", value: 0, displayValue: "0%", color: "#8ed4a7", textColor: "#44a985" },
        ];
    }

    const mapping = {
        1: { label: "Strongly\nDisagree", color: "#dc2626", textColor: "#b91c1c" },
        2: { label: "Disagree", color: "#f87171", textColor: "#dc2626" },
        3: { label: "Neutral", color: "#fbbf24", textColor: "#b45309" },
        4: { label: "Agree", color: "#10b981", textColor: "#047857" },
        5: { label: "Strongly\nAgree", color: "#059669", textColor: "#064e3b" },
    };

    return [1, 2, 3, 4, 5].map((rating) => {
        const distData = apiDistribution.find((d) => d.rating === rating);
        const count = distData ? distData.count : 0;
        const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;

        return {
            label: mapping[rating].label,
            value: percentage,
            displayValue: `${percentage.toFixed(1)}%`,
            color: mapping[rating].color,
            textColor: mapping[rating].textColor,
        };
    });
};



const toProperCase = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

const getPremiumColor = (rating) => {
    const num = parseFloat(rating);
    if (num >= 4.5) return '#16A34A'; // Agree  
    if (num >= 3.5) return '#4ADE80'; // Agree
    if (num >= 2.5) return '#FACC15'; // Neutral
    if (num >= 1.5) return '#F87171'; // Disagree
    return '#DC2626';                 // Strongly Disagree
};

const formatXAxis = (value) => {
    const labels = {
        1: "Strongly Disagree",
        2: "Disagree",
        3: "Neutral",
        4: "Agree",
        5: "Strongly Agree"
    };
    return labels[value] || "";
};

const roleNames = {
    hod: 'HOD',
    associate_dean_soe: 'Associate Dean SoE',
    associate_dean_fe: 'Associate Dean FE',
    associate_dean_sos: 'Associate Dean SoS',
    associate_dean_sob: 'Associate Dean SoB',
    dean_sop: 'Dean SoP',
    registrar: 'Registrar',
    pro_vc_academics: 'Pro Vice Chancellor Academics',
    pro_vc_es: 'Pro Vice Chancellor E&S',
    pro_vc_sp: 'Pro Vice Chancellor S&P',
    'dean_r&c': 'Dean Research & Consultancy',
    dean_careers: 'Dean Career Development',
    dean_student_affairs: 'Dean Student Affairs',
    dean_admissions: 'Dean Admissions',
    dean_administration: 'Dean Administration',
    dean_iqac: 'Dean IQAC',
    dean_ir: 'Dean International Relations',
    CoE: 'Controller of Examinations'
};

function Reports() {
    const { id: role } = useParams(); // Fetching the role id from the URL, e.g., /feedback360reports/hod
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    // Try taking them from state first, then fallback to URL/defaults
    const stateData = location.state || {};
    const school = stateData.school || searchParams.get('school');
    const schoolName = stateData.schoolName || '';
    const department = stateData.department || searchParams.get('department');
    const departmentName = stateData.departmentName || '';
    const roundId = stateData.roundId || searchParams.get('roundId');
    const departmentCode = stateData.departmentCode || searchParams.get('departmentCode');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [role]);

    let displayRole = roleNames[role] || role;
    if (role === 'hod') {
        displayRole = departmentCode ? `HOD (${departmentCode})` : `HOD`;
    }

    const [data, setData] = useState(stateData.reportData || null);
    //console.log(data)
    const [loading, setLoading] = useState(!stateData.reportData);
    const [error, setError] = useState(null);
    const [showAllQuestions, setShowAllQuestions] = useState(false);
    const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);

    // New states for Improvement Comparison
    const [comparisonData, setComparisonData] = useState(null);
    const [roundsList, setRoundsList] = useState([]);
    const [previousRoundId, setPreviousRoundId] = useState(null);

    // Derive Context Elements
    const currentRoundObj = roundsList.find(r => r._id === roundId);
    const prevRoundObj = roundsList.find(r => r._id === previousRoundId);
    let roundDisplayString = '';
    if (currentRoundObj) {
        const parts = [];
        if (currentRoundObj.academicYear) parts.push(`Academic Year: ${currentRoundObj.academicYear}`);
        if (currentRoundObj.cycle) parts.push(`Cycle: ${currentRoundObj.cycle}`);

        const startDate = new Date(currentRoundObj.startDate).toLocaleDateString('en-GB');
        const endDate = new Date(currentRoundObj.endDate).toLocaleDateString('en-GB');
        parts.push(`Period: ${startDate} - ${endDate}`);

        roundDisplayString = parts.length > 0 ? parts.join(' | ') : '';
    }
    const prevRoundName = prevRoundObj ? `${prevRoundObj.academicYear} | Cycle ${prevRoundObj.cycle}` : 'Previous Session';
    const scopeDisplayString = schoolName ? `Filtered Report: ${schoolName} - ${departmentName || 'All Departments'}` : 'Overall Report';

    const comparisonMap = React.useMemo(() => {
        const map = {};
        comparisonData?.questions?.forEach(q => {
            map[String(q.questionId)] = q;
        });
        return map;
    }, [comparisonData]);

    const filteredQuestions = data?.questions
        ? data.questions.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended'))
        : [];

    const handleExportCSV = () => {
        if (!data) return;

        const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        let csvContent = "";

        csvContent += "Overview\n";
        csvContent += `Report Scope,${escapeCsv(scopeDisplayString)}\n`;
        if (roundDisplayString) {
            csvContent += `Round Details,${escapeCsv(roundDisplayString)}\n`;
        }
        if (data.targetPersonName) {
            csvContent += `Member Name,${escapeCsv(data.targetPersonName)}\n`;
        }
        csvContent += `Designation,${escapeCsv(displayRole)}\n`;
        csvContent += `Overall Rating,${escapeCsv(data.overallRating)}\n`;
        if (comparisonData && prevRoundObj && comparisonData.isSamePerson) {
            const sign = comparisonData.overallImprovement > 0 ? '+' : '';
            csvContent += `Improvement vs ${escapeCsv(prevRoundName)},${escapeCsv(sign + comparisonData.overallImprovement.toFixed(2))}\n`;
        }
        csvContent += `Total Responses,${escapeCsv(data.responses)}\n\n`;

        if (data.sections && data.sections.length > 0) {
            const filteredSections = data.sections.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended'));
            csvContent += "Section Performance\n";
            csvContent += "Section,Average Rating\n";
            filteredSections.forEach(sec => {
                csvContent += `${escapeCsv(sec.section)},${escapeCsv(sec.avgRating)}\n`;
            });
            csvContent += "\n";
        }

        if (filteredQuestions.length > 0) {
            csvContent += "Question Analysis\n";
            csvContent += "Section,Question,Average Rating,Improvement\n";
            filteredQuestions.forEach(q => {

                const compItem = comparisonMap[String(q.questionId)];

                let improvement = "";
                if (compItem && comparisonData.isSamePerson) {
                    const val = compItem.improvement;
                    improvement = (val > 0 ? "+" : "") + val.toFixed(2);
                }

                csvContent += `${escapeCsv(q.section || 'General')},${escapeCsv(q.question)},${escapeCsv(q.avgRating.toFixed(2))},${escapeCsv(improvement)}\n`;

            });
            csvContent += "\n";
        }

        if (data.suggestions && data.suggestions.length > 0) {
            csvContent += "Faculty Suggestions\n";
            csvContent += "Question,Comments\n";
            data.suggestions.forEach(sug => {
                const comments = sug.answers && sug.answers.length > 0 ? sug.answers.join(" | ") : "No comments";
                csvContent += `${escapeCsv(sug.question)},${escapeCsv(comments)}\n`;
            });
            csvContent += "\n";
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const sanitizedRole = displayRole.replace(/\s+/g, '_');
        link.setAttribute("download", `Feedback_Report_${sanitizedRole}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        if (!data) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(16);
        doc.text('Feedback Report', pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(12);
        // Info Block
        let yPos = 25;
        if (roundDisplayString) {
            doc.text(`${roundDisplayString}`, 14, yPos);
            yPos += 7;
        }
        doc.text(`Scope: ${scopeDisplayString}`, 14, yPos);
        yPos += 7;
        if (data.targetPersonName) {
            doc.text(`Member Name: ${data.targetPersonName}`, 14, yPos);
            yPos += 7;
        }
        doc.text(`Designation: ${displayRole}`, 14, yPos);
        yPos += 7;
        doc.text(`Overall Rating: ${data.overallRating}`, 14, yPos);
        yPos += 7;

        if (comparisonData && prevRoundObj && comparisonData.isSamePerson) {
            const sign = comparisonData.overallImprovement > 0 ? '+' : '';
            doc.text(`Improvement vs ${prevRoundName}: ${sign}${comparisonData.overallImprovement.toFixed(2)}`, 14, yPos);
            yPos += 7;
        }

        doc.text(`Total Responses: ${data.responses}`, 14, yPos);

        let startY = yPos + 6;

        // Section Performance
        if (data.sections && data.sections.length > 0) {
            const filteredSectionsList = data.sections.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended'));
            if (filteredSectionsList.length > 0) {
                doc.setFontSize(14);
                doc.text('Section Performance', 14, startY);
                autoTable(doc, {
                    startY: startY + 5,
                    head: [['Section', 'Average Rating']],
                    body: filteredSectionsList.map(sec => [sec.section, sec.avgRating.toFixed(2)]),
                    theme: 'grid',
                });
                startY = doc.lastAutoTable.finalY + 15;
            }
        }

        // Question Analysis
        if (filteredQuestions.length > 0) {
            doc.setFontSize(14);
            doc.text('Question Analysis', 14, startY);
            autoTable(doc, {
                startY: startY + 5,
                head: [['Section', 'Question', 'Average Rating', 'Improvement']],
                body: filteredQuestions.map(q => {

                    const compItem = comparisonMap[String(q.questionId)];

                    let improvement = "";
                    if (compItem && comparisonData.isSamePerson) {
                        const val = compItem.improvement;
                        improvement =
                            val > 0
                                ? `+${val.toFixed(2)}`
                                : val < 0
                                    ? `${val.toFixed(2)}`
                                    : "0.00";
                    }

                    return [
                        q.section || 'General',
                        q.question,
                        q.avgRating.toFixed(2),
                        improvement
                    ];
                }),
                theme: 'grid',
            });
            startY = doc.lastAutoTable.finalY + 15;
        }

        // Faculty Suggestions
        if (data.suggestions && data.suggestions.length > 0) {
            doc.setFontSize(14);
            doc.text('Faculty Suggestions', 14, startY);
            autoTable(doc, {
                startY: startY + 5,
                head: [['Question', 'Comments']],
                body: data.suggestions.map(sug => {
                    const comments = sug.answers && sug.answers.length > 0 ? sug.answers.join(" | ") : "No comments";
                    return [sug.question, comments];
                }),
                theme: 'grid',
            });
        }

        const sanitizedRole = displayRole.replace(/\s+/g, '_');
        doc.save(`Feedback_Report_${sanitizedRole}.pdf`);
    };

    useEffect(() => {
        // If navigated directly without state, fetch from API
        if (!data && !error) {
            window.scrollTo(0, 0);
            setLoading(true);
            const params = { role };
            if (school) params.school = school;
            if (department) params.department = department;
            if (roundId) params.roundId = roundId;

            axios.get(`${API_BASE_URL}feedback360/reports`, { params })
                .then(res => {
                    setData(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching report data", err);
                    setError("Failed to load report data. Please try again or navigate from Dashboard.");
                    setLoading(false);
                });
        }
    }, [data, error, role, school, department, roundId]);

    // Fetch all rounds to determine the "previous" round for comparison
    useEffect(() => {
        axios.get(`${API_BASE_URL}feedback360/rounds`)
            .then(res => {
                const sortedRounds = res.data; // Assumes backend sorts by year DESC, round DESC
                setRoundsList(sortedRounds);

                if (roundId && sortedRounds.length > 1) {
                    const currentIndex = sortedRounds.findIndex(r => r._id === roundId);
                    // If a preceding round exists (older round), it will be at index + 1
                    if (currentIndex !== -1 && currentIndex + 1 < sortedRounds.length) {
                        const currentRound = sortedRounds[currentIndex];
                        const prevRound = sortedRounds[currentIndex + 1];

                        setPreviousRoundId(prevRound._id);
                    }
                }
            })
            .catch(err => console.error("Error fetching rounds for comparison", err));
    }, [roundId]);

    // Fetch comparison data if a previous round is identified
    useEffect(() => {
        if (previousRoundId && roundId && role) {
            const params = {
                round1: previousRoundId,
                round2: roundId,
                role: role
            };
            if (school) params.school = school;
            if (department) params.department = department;

            axios.get(`${API_BASE_URL}feedback360/reports/compare`, { params })
                .then(res => setComparisonData(res.data))
                .catch(err => console.error("Error fetching comparison data", err));
        }
    }, [previousRoundId, roundId, role, school, department]);

    const filteredSections = data?.sections
        ? data.sections.filter(
            item =>
                !item.section?.toLowerCase().includes("open ended") &&
                !item.section?.toLowerCase().includes("open-ended")
        )
        : [];

    const chartHeight = Math.max(filteredSections.length * 60 + 50, 200);

    if (loading) {
        return (
            <div className="reports-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#014284' }}>
                <h2>Loading Report Data...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
                <h2>{error}</h2>
            </div>
        );
    }

    if (!data) return null;

    const renderImprovement = (value, isLarge = false) => {
        if (!value && value !== 0) return null;
        const isPositive = value > 0;
        const isNegative = value < 0;
        const color = isPositive ? '#16A34A' : isNegative ? '#DC2626' : '#6B7280';
        const icon = isPositive ? '▲' : isNegative ? '▼' : '-';

        return (
            <span style={{ color, fontSize: isLarge ? 'inherit' : '0.85em', marginLeft: isLarge ? '0' : '6px', fontWeight: 'bold' }}>
                {icon} {(value > 0 ? '+' : '') + value.toFixed(2)}
            </span>
        );
    };

    return (
        <div className="reports-container">
            {/* Breadcrumb */}
            <div className="reports-breadcrumb">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        width: 'fit-content',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    onClick={() => navigate('/admin/dashboard', { state: { school, department, roundId } })}
                >
                    <HomeIcon fontSize="small" sx={{ color: '#014284', mr: 1 }} />
                    <span className="breadcrumb-path" style={{ color: '#014284', fontWeight: 600 }}>Back to Dashboard</span>
                </div>
                <ChevronRightIcon fontSize="small" sx={{ color: '#999', mx: 0.5 }} />
                <span className="breadcrumb-current">Feedback Report</span>
            </div>

            {/* Header */}
            <div className="reports-header">
                <div className="reports-title-stack">
                    <h1 className="reports-title">Feedback Report</h1>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                        {roundDisplayString && (
                            <span className="subtitle-text" style={{ background: '#f8fafc', padding: '4px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>
                                {roundDisplayString}
                            </span>
                        )}
                        <span className="subtitle-text" style={{ fontWeight: 600 }}>
                            {scopeDisplayString}
                        </span>
                    </div>
                </div>

                <div className="reports-actions">
                    <button className="btn-export btn-pdf" onClick={handleExportPDF}>
                        <InsertDriveFileIcon fontSize="small" /> Export PDF Report
                    </button>
                    <button className="btn-export btn-csv" onClick={handleExportCSV}>
                        <DownloadIcon fontSize="small" /> Export CSV Data
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card card-rating">
                    <div className="card-label">Overall Rating</div>
                    <div className="card-value rating-value">
                        {data.overallRating}
                        <StarIcon className="star-icon" fontSize="large" sx={{ color: '#ffca28' }} />
                    </div>
                </div>

                {comparisonData && prevRoundObj && comparisonData.isSamePerson && (
                    <div className="summary-card card-improvement">
                        <div className="card-label">Improvement vs {prevRoundName}</div>
                        <div className="card-value">
                            {renderImprovement(comparisonData.overallImprovement, true)}
                        </div>
                    </div>
                )}

                <div className="summary-card card-responses">
                    <div className="card-label">Total Responses</div>
                    <div className="card-value">{data.responses}</div>
                </div>
                <div className="summary-card card-role" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Avatar
                        src={`https://info.aec.edu.in/aec/employeephotos/${data.empId}.jpg`}
                        alt={data.targetPersonName}
                        sx={{
                            width: 64,
                            height: 64,
                            border: '2px solid #e2e8f0',
                            bgcolor: '#f8fafc',
                            color: '#014284',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 32, opacity: 0.5 }} />
                    </Avatar>
                    <div style={{ flex: 1 }}>
                        <div className="card-label">Leadership Member</div>
                        <div className="card-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800, lineHeight: 1.2 }}>
                                {toProperCase(data.targetPersonName) || "---"}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                {displayRole}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Performance - Full Width */}
            <div className="content-section full-width-section" style={{ marginBottom: '24px' }}>
                <div className="section-header-row">
                    <h2 className="section-title">Section Performance</h2>
                    <div className="performance-legend">
                        <div className="legend-scale-img"></div>
                        <div className="legend-labels">
                            <span><b>1</b> Strongly Disagree</span>
                            <span><b>2</b> Disagree</span>
                            <span><b>3</b> Neutral</span>
                            <span><b>4</b> Agree</span>
                            <span><b>5</b> Strongly Agree</span>
                        </div>
                    </div>
                </div>

                {data.responses === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No performance data yet.
                    </div>
                ) : (
                    <div className="section-chart-container" style={{ width: "100%" }}>
                        <ResponsiveContainer width="100%" height={chartHeight}>
                            <BarChart
                                data={filteredSections}
                                layout="vertical"
                                margin={{ top: 5, right: 60, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
                                <XAxis
                                    type="number"
                                    domain={[0, 5]}
                                    ticks={[1, 2, 3, 4, 5]}
                                    stroke="#94a3b8"
                                    tickFormatter={formatXAxis}
                                    tick={{ fontSize: 12, fill: '#64748b', dy: 5 }}
                                />
                                <YAxis
                                    dataKey="section"
                                    type="category"
                                    width={window.innerWidth < 600 ? 100 : 250}
                                    tick={{ fill: '#334155', fontSize: window.innerWidth < 600 ? 10 : 13, fontWeight: 500 }}
                                    axisLine={{ stroke: '#cbd5e0' }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value) => [parseFloat(value).toFixed(2), "Rating"]}
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="avgRating" radius={[0, 6, 6, 0]} barSize={28}>
                                    {filteredSections.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getPremiumColor(entry.avgRating)} />
                                    ))}
                                    <LabelList dataKey="avgRating" position="right" formatter={(val) => parseFloat(val).toFixed(2)} style={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Main Content Grid (2 Columns) */}
            <div className="reports-grid">
                {/* Left Column */}
                <div className="grid-left">
                    {/* Question Analysis */}
                    <div className="content-section">
                        <h2 className="section-title">Question Analysis</h2>
                        <div className="question-table-container">
                            <table className="question-table">
                                <thead>
                                    <tr>
                                        <th>Question</th>
                                        <th className="th-right">Average Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuestions.length > 0 ? (
                                        (showAllQuestions ? filteredQuestions : filteredQuestions.slice(0, 5)).map((item, index) => {
                                            const compItem = comparisonMap[String(item.questionId)];
                                            return (
                                                <tr
                                                    key={index}
                                                    onClick={() => setSelectedQuestionIdx(index)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedQuestionIdx === index ? '#f0f4f8' : 'transparent',
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <td className="q-text">{item.question}</td>
                                                    <td className="q-rating">
                                                        <StarIcon className="star-small" sx={{ color: '#ffca28', fontSize: '18px', mr: 0.5 }} />
                                                        {item.avgRating.toFixed(2)}
                                                        {compItem && Math.abs(compItem.improvement) > 0 && comparisonData.isSamePerson && renderImprovement(compItem.improvement)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>No questions data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {filteredQuestions.length > 5 && (
                                <div className="table-footer">
                                    <span className="showing-text">Showing {showAllQuestions ? filteredQuestions.length : 5} of {filteredQuestions.length} questions</span>
                                    <button
                                        className="view-all-btn"
                                        onClick={() => setShowAllQuestions(!showAllQuestions)}
                                    >
                                        {showAllQuestions ? 'View less' : 'View all'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="grid-right">
                    {/* Rating Distribution */}
                    <div className="content-section">
                        <h2 className="section-title">Rating Distribution</h2>
                        <div className="distribution-card">
                            <div className="dist-subtitle">
                                {filteredQuestions.length > selectedQuestionIdx
                                    ? filteredQuestions[selectedQuestionIdx].question
                                    : (filteredQuestions.length > 0 ? filteredQuestions[0].question : "Overview")}
                            </div>
                            <div className="chart-container">
                                <div className="y-axis">
                                    <span>100%</span>
                                    <span>75%</span>
                                    <span>50%</span>
                                    <span>0%</span>
                                </div>
                                <div className="chart-area">
                                    <div className="h-grid-lines">
                                        <div className="h-grid-line top-line"></div>
                                        <div className="h-grid-line"></div>
                                        <div className="h-grid-line"></div>
                                        <div className="h-grid-line bottom-line"></div>
                                    </div>
                                    <div className="chart-bars">
                                        {data.responses > 0 && filteredQuestions.length > selectedQuestionIdx ? (
                                            getDistributionData(filteredQuestions[selectedQuestionIdx].distribution, filteredQuestions[selectedQuestionIdx].responses).map((distData, idx) => (
                                                <div className="bar-group" key={idx}>
                                                    <div className="bar-wrapper">
                                                        <div className="bar" style={{ height: `${distData.value}%`, backgroundColor: distData.color }}></div>
                                                    </div>
                                                    <div className="bar-value">{distData.displayValue}</div>
                                                    <div className="bar-label" style={{ color: distData.textColor }}>
                                                        {distData.label.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                                No distribution data available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="gradient-ribbon">
                                <div className="gradient-bar"></div>
                                <div className="gradient-labels">
                                    <span>1.0%</span>
                                    <div className="right-labels">
                                        <span>30%</span>
                                        <span>1.0%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Faculty Suggestions */}
                    <div className="content-section" style={{ marginTop: '24px' }}>
                        <h2 className="section-title">Faculty Suggestions</h2>
                        <div className="suggestions-list">
                            {data.suggestions && data.suggestions.length > 0 ? (
                                data.suggestions.map((suggestion, index) => (
                                    <div className="suggestion-card" key={index}>
                                        <div className="suggestion-title">{suggestion.question}</div>
                                        <ul className="suggestion-ul" style={{ minHeight: '20px' }}>
                                            {suggestion.answers && suggestion.answers.length > 0 ? (
                                                suggestion.answers.map((answer, i) => <li key={i}>{answer}</li>)
                                            ) : (
                                                <li>No comments given.</li>
                                            )}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <div className="suggestion-card">
                                    <div className="suggestion-title">No suggestions available for this {displayRole}.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reports;
