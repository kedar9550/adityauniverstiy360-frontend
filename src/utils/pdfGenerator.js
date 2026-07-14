import autoTable from 'jspdf-autotable';
import { logoBase64 } from './logoBase64.js';
import { productSansBase64, productSansBoldBase64 } from './productSansBase64.js';

function toProperCase(str) {
    if (!str) return '';
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

const brandColors = {
    orange: [208, 108, 56],
    blue: [11, 82, 153],
    gold: [191, 148, 56],
    navy: [13, 35, 59],
    white: [255, 255, 255],
    grayText: [71, 85, 105], // Darkened from [100, 116, 139] for better legibility
    lightGray: [241, 245, 249],
    darkText: [30, 41, 59]
};

const getBarColor = (rating) => {
    const num = parseFloat(rating);
    if (num >= 4) return [34, 197, 94]; // Green
    if (num >= 3) return [234, 179, 8]; // Yellow
    if (num >= 2) return [249, 115, 22]; // Orange
    return [239, 68, 68]; // Red
};

// --- Custom Drawing Helpers ---
const drawArc = (doc, x, y, radius, startAngle, endAngle, thickness, color) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(thickness);
    const steps = Math.max(10, Math.ceil((endAngle - startAngle) * 20));
    const angleStep = (endAngle - startAngle) / steps;
    for (let i = 1; i <= steps; i++) {
        const a1 = startAngle + (i - 1) * angleStep;
        const a2 = startAngle + i * angleStep;
        const px1 = x + radius * Math.cos(a1);
        const py1 = y + radius * Math.sin(a1);
        const px2 = x + radius * Math.cos(a2);
        const py2 = y + radius * Math.sin(a2);
        doc.line(px1, py1, px2, py2);
    }
};

const drawRoundedRect = (doc, x, y, w, h, r, fillColor, shadow = true) => {
    if (shadow) {
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(x + 1, y + 1, w, h, r, r, 'F');
    }
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, w, h, r, r, 'F');
};

const drawRadarChart = (doc, x, y, radius, labels, values, maxVal = 5) => {
    const sides = labels.length;
    if (sides === 0) return;
    const angleStep = (Math.PI * 2) / sides;

    // Draw grid
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    for (let step = 1; step <= 5; step++) {
        let r = (step / 5) * radius;
        for (let i = 0; i < sides; i++) {
            const a1 = i * angleStep - Math.PI / 2;
            const a2 = ((i + 1) % sides) * angleStep - Math.PI / 2;
            doc.line(x + r * Math.cos(a1), y + r * Math.sin(a1), x + r * Math.cos(a2), y + r * Math.sin(a2));
        }

        // Draw scale label on the vertical axis (angle = -90 deg)
        doc.setFontSize(6);
        doc.setTextColor(150, 150, 150);
        doc.setFont("GoogleSans", "normal");
        doc.text(step.toString(), x + 1.5, y - r + 2);
    }
    // Draw axes & labels
    for (let i = 0; i < sides; i++) {
        const a = i * angleStep - Math.PI / 2;
        doc.line(x, y, x + radius * Math.cos(a), y + radius * Math.sin(a));

        doc.setFontSize(7);
        doc.setTextColor(...brandColors.grayText);
        const lx = x + (radius + 6) * Math.cos(a);
        const ly = y + (radius + 6) * Math.sin(a);
        let align = 'center';
        if (Math.cos(a) > 0.1) align = 'left';
        else if (Math.cos(a) < -0.1) align = 'right';

        const textLines = doc.splitTextToSize(labels[i], 30);
        doc.text(textLines, lx, ly, { align });
    }

    // Draw Data Line
    doc.setDrawColor(...brandColors.blue);
    doc.setLineWidth(1.5);
    for (let i = 0; i < sides; i++) {
        const a1 = i * angleStep - Math.PI / 2;
        const a2 = ((i + 1) % sides) * angleStep - Math.PI / 2;
        const r1 = (values[i] / maxVal) * radius;
        const r2 = (values[(i + 1) % sides] / maxVal) * radius;
        doc.line(x + r1 * Math.cos(a1), y + r1 * Math.sin(a1), x + r2 * Math.cos(a2), y + r2 * Math.sin(a2));

        // Dot
        doc.setFillColor(...brandColors.orange);
        doc.circle(x + r1 * Math.cos(a1), y + r1 * Math.sin(a1), 1.5, 'F');

        // Data Label
        doc.setFontSize(7);
        doc.setTextColor(...brandColors.darkText);
        doc.setFont("GoogleSans", "bold");
        doc.text(values[i].toFixed(2), x + r1 * Math.cos(a1) + 2.5, y + r1 * Math.sin(a1) - 1.5);
    }
};

const formatImpStr = (val) => {
    if (val === undefined || val === null) return "---";
    if (val > 0) return `+${val.toFixed(2)}`;
    return val.toFixed(2);
};

const getImprovementForSection = (sectionName, reportDataObj, compareMapObj) => {
    const sectionQuestions = reportDataObj.questions ? reportDataObj.questions.filter(q => q.section === sectionName) : [];
    let totalImp = 0;
    let impCount = 0;
    sectionQuestions.forEach(q => {
        const compItem = compareMapObj[String(q.questionId)];
        if (compItem && Math.abs(compItem.improvement) > 0) {
            totalImp += compItem.improvement;
            impCount++;
        }
    });
    return impCount > 0 ? (totalImp / impCount) : undefined;
};

export const generateFeedbackReportPDF = (doc, config) => {
    const {
        memberData,
        pageWidth = 210,
        selectedSchool,
        activeDept,
        currentRoundObj,
        prevRoundObj
    } = config;

    const overallReport = memberData.overall?.reportData || {};
    const overallCompare = memberData.overall?.comparisonData;

    // Data Preparation
    let roundDisplayString = '';
    if (currentRoundObj) {
        const startDate = new Date(currentRoundObj.startDate).toLocaleDateString('en-GB');
        const endDate = new Date(currentRoundObj.endDate).toLocaleDateString('en-GB');
        roundDisplayString = `Academic Year: ${currentRoundObj.academicYear} | Cycle: ${currentRoundObj.cycle} | Period: ${startDate} - ${endDate}`;
    }
    const scopeDisplayString = 'Overall Report' + (selectedSchool ? ` (${selectedSchool.name} - ${activeDept ? activeDept.name : 'All Departments'})` : '');

    let overallImp = undefined;
    if (prevRoundObj && overallCompare && overallCompare.isSamePerson && overallCompare.overallImprovement !== undefined) {
        overallImp = overallCompare.overallImprovement;
    }

    const sectionsData = overallReport.sections ? overallReport.sections.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended')) : [];

    // Sort all sections for KPIs
    const sortedSections = [...sectionsData].sort((a, b) => b.avgRating - a.avgRating);
    const strengths = sortedSections; // Keep this for KPI "TOP SECTION SCORE"

    // Filter and sort for Executive Insights strengths (>= 4.0)
    const topStrengths = sectionsData
        .filter(s => s.avgRating >= 4.0)
        .sort((a, b) => b.avgRating - a.avgRating);

    // Filter and sort for Executive Insights improvements (< 3.0)
    const areasForImprovement = sectionsData
        .filter(s => s.avgRating < 3.0)
        .sort((a, b) => a.avgRating - b.avgRating);

    // ==========================================
    // PAGE 1: EXECUTIVE DASHBOARD
    // ==========================================
    // If not first page natively, doc.addPage()
    if (!config.isFirstPage) {
        doc.addPage();
    }

    // Register GoogleSans Font
    try {
        doc.addFileToVFS("GoogleSans.ttf", productSansBase64);
        doc.addFont("GoogleSans.ttf", "GoogleSans", "normal", "Identity-H");
        if (productSansBoldBase64) {
            doc.addFileToVFS("GoogleSans-Bold.ttf", productSansBoldBase64);
            doc.addFont("GoogleSans-Bold.ttf", "GoogleSans", "bold", "Identity-H");
        } else {
            // Fallback: register the normal font as bold so jsPDF doesn't fall back to Times New Roman
            doc.addFont("GoogleSans.ttf", "GoogleSans", "bold", "Identity-H");
        }
    } catch (e) {
        console.error("Font registration error", e);
    }

    // HEADER
    doc.setFillColor(255, 255, 255); // Changed to White
    doc.rect(0, 0, pageWidth, 75, 'F');

    let titleY = 35;
    try {
        const imgProps = doc.getImageProperties(logoBase64);
        const logoW = 130; // Much larger logo
        const logoH = (imgProps.height * logoW) / imgProps.width;
        const logoX = (pageWidth - logoW) / 2;
        doc.addImage(logoBase64, 'PNG', logoX, 6, logoW, logoH);
        titleY = 6 + logoH + 5; // 5 units tight margin below logo
    } catch (e) {
        console.error("Logo err", e);
        // Fallback if getImageProperties fails
        doc.addImage(logoBase64, 'PNG', (pageWidth - 75) / 2, 6, 75, 15);
        titleY = 6 + 15 + 5;
    }

    doc.setTextColor(...brandColors.navy); // Changed to Navy
    doc.setFont("GoogleSans", "bold");
    doc.setFontSize(13); // Decreased font size as requested
    doc.text("360 Degree Feedback Analysis Report", pageWidth / 2, titleY, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("GoogleSans", "normal");
    doc.text(roundDisplayString, pageWidth / 2, titleY + 6, { align: 'center' });
    doc.text(`Scope: ${scopeDisplayString}`, pageWidth / 2, titleY + 12, { align: 'center' });

    // Profile Info
    doc.setTextColor(...brandColors.darkText);
    doc.setFontSize(14);
    doc.setFont("GoogleSans", "bold");
    doc.text(toProperCase(memberData.targetPersonName || "Member Report"), 14, titleY + 24);
    doc.setFontSize(11);
    doc.setFont("GoogleSans", "normal");
    doc.setTextColor(...brandColors.grayText);
    doc.text(memberData.roleTitle || "Designation", 14, titleY + 30);

    let currentY = titleY + 39;

    // KPI CARDS
    const kpis = [
        { title: "OVERALL RATING", value: (overallReport.overallRating || 0).toFixed(2), icon: "O" }
    ];
    if (overallImp !== undefined) {
        kpis.push({ title: "PREV CYCLE TREND", value: formatImpStr(overallImp), icon: "T" });
    }
    kpis.push({ title: "TOTAL RESPONSES", value: (overallReport.responses || 0).toString(), icon: "R" });
    kpis.push({ title: "TOP SECTION SCORE", value: strengths[0] ? strengths[0].avgRating.toFixed(2) : "0.00", icon: "S" });

    const cardW = (pageWidth - 28 - ((kpis.length - 1) * 5)) / kpis.length;
    kpis.forEach((kpi, i) => {
        const cx = 14 + i * (cardW + 5);
        drawRoundedRect(doc, cx, currentY, cardW, 22, 2, [255, 255, 255]);
        doc.setFontSize(8);
        doc.setTextColor(...brandColors.grayText);
        doc.setFont("GoogleSans", "normal");
        doc.text(kpi.title, cx + 5, currentY + 7);
        doc.setFontSize(14);
        doc.setFont("GoogleSans", "bold");

        if (kpi.title === "PREV CYCLE TREND") doc.setTextColor(...(overallImp >= 0 ? [34, 197, 94] : [239, 68, 68]));
        else doc.setTextColor(...brandColors.blue);

        doc.text(kpi.value, cx + 5, currentY + 16);
    });

    currentY += 32;

    // MIDDLE SECTION: Gauge & Summary & Response Dist
    // Gauge
    drawRoundedRect(doc, 14, currentY, 65, 55, 2, [255, 255, 255]);
    doc.setFontSize(10);
    doc.setTextColor(...brandColors.darkText);
    doc.text("Current Rating", 46.5, currentY + 8, { align: 'center' });

    const gaugeScore = parseFloat(overallReport.overallRating || 0);
    const gaugeAngle = Math.PI + (gaugeScore / 5) * Math.PI;
    drawArc(doc, 46.5, currentY + 35, 18, Math.PI, Math.PI * 2, 6, [241, 245, 249]); // background
    drawArc(doc, 46.5, currentY + 35, 18, Math.PI, gaugeAngle, 6, getBarColor(gaugeScore)); // foreground

    doc.setFontSize(16);
    doc.setFont("GoogleSans", "bold");
    doc.setTextColor(...brandColors.darkText);
    doc.text(gaugeScore.toFixed(2), 46.5, currentY + 33, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont("GoogleSans", "normal");
    doc.setTextColor(...brandColors.grayText);
    doc.text("out of 5.0", 46.5, currentY + 38, { align: 'center' });

    // Response Distribution (Donut)
    drawRoundedRect(doc, 84, currentY, 112, 55, 2, [255, 255, 255]);
    doc.setFontSize(10);
    doc.setTextColor(...brandColors.darkText);
    doc.setFont("GoogleSans", "bold");
    doc.text("Response Distribution", 90, currentY + 8);

    if (overallReport.giverRoleStats) {
        const roles = Object.keys(overallReport.giverRoleStats);
        const total = overallReport.responses || 1;
        let startA = 0;
        const colors = [brandColors.blue, brandColors.orange, brandColors.gold, brandColors.navy, [34, 197, 94]];

        const cx = 115;
        const cy = currentY + 30;

        roles.forEach((r, idx) => {
            const count = typeof overallReport.giverRoleStats[r] === 'object' ? overallReport.giverRoleStats[r].count : overallReport.giverRoleStats[r];
            const sliceAngle = (count / total) * Math.PI * 2;
            const endA = startA + sliceAngle;
            if (sliceAngle > 0.05) {
                drawArc(doc, cx, cy, 15, startA, endA, 8, colors[idx % colors.length]);
            }
            startA = endA;

            // Legend
            doc.setFillColor(...colors[idx % colors.length]);
            doc.rect(140, currentY + 15 + (idx * 6), 3, 3, 'F');
            doc.setFontSize(8);
            doc.setFont("GoogleSans", "normal");
            doc.setTextColor(...brandColors.grayText);
            doc.text(`${toProperCase(r)} (${count})`, 145, currentY + 17.5 + (idx * 6));
        });
    }

    currentY += 65;

    // EXECUTIVE SUMMARY PANEL
    if (sectionsData.length > 1) {
        doc.setFontSize(9);
        const strLines = topStrengths.length > 0 ? topStrengths.length : 1;
        const impTextLines = doc.splitTextToSize("No section currently requires significant improvement based on the defined threshold.", (pageWidth - 28) / 2 - 10);
        const impLines = areasForImprovement.length > 0 ? areasForImprovement.length : impTextLines.length;

        const panelHeight = 24 + Math.max(strLines, impLines) * 5 + 5;

        drawRoundedRect(doc, 14, currentY, pageWidth - 28, panelHeight, 2, [255, 255, 255]);
        doc.setFontSize(11);
        doc.setFont("GoogleSans", "bold");
        doc.setTextColor(...brandColors.darkText);
        doc.text("Performance Insights", 20, currentY + 8);

        doc.setFontSize(9);
        doc.setTextColor(...brandColors.grayText);
        doc.text("Top Strengths (Highest Rated)", 20, currentY + 18);
        doc.setFont("GoogleSans", "normal");

        if (topStrengths.length > 0) {
            topStrengths.forEach((st, i) => {
                if (st) doc.text(`• ${st.section} (${st.avgRating.toFixed(2)})`, 20, currentY + 24 + i * 5);
            });
        } else {
            doc.text("No section met the defined strength threshold.", 20, currentY + 24);
        }

        doc.setFont("GoogleSans", "bold");
        doc.setTextColor(...brandColors.grayText);
        doc.text("Areas for Improvement (Lowest Rated)", pageWidth / 2, currentY + 18);
        doc.setFont("GoogleSans", "normal");

        if (areasForImprovement.length > 0) {
            areasForImprovement.forEach((imp, i) => {
                if (imp) doc.text(`• ${imp.section} (${imp.avgRating.toFixed(2)})`, pageWidth / 2, currentY + 24 + i * 5);
            });
        } else {
            doc.text(impTextLines, pageWidth / 2, currentY + 24);
        }
    }

    // ==========================================
    // PAGE 2+: SECTION PERFORMANCE & RADAR
    // ==========================================
    const rolesToRender = ['OVERALL'];
    if (overallReport.giverRoleStats) {
        Object.keys(overallReport.giverRoleStats).forEach(key => rolesToRender.push(key.toUpperCase()));
    }

    const getRoleDisplayName = (role) => {
        const r = role.toUpperCase();
        if (r === 'OVERALL') return 'OVERALL';
        if (r === 'FACULTY') return 'BY FACULTIES';
        if (r === 'HOD') return 'BY HODs';
        if (r === 'DEAN') return 'BY DEANs';
        if (r === 'PEER') return 'BY PEERs';
        if (r === 'STUDENT') return 'BY STUDENTs';
        if (r === 'MANAGEMENT') return 'BY MANAGEMENT';
        return `BY ${r}`;
    };

    let p2Y = 20;

    // ==========================================
    // SUBSEQUENT PAGES: QUESTION ANALYSIS (Helper)
    // ==========================================
    const renderQuestionAnalysis = (title, reportDataObj, compareDataObj, startYPos) => {
        if (!reportDataObj || !reportDataObj.questions || reportDataObj.questions.length === 0) return startYPos;
        const qFiltered = reportDataObj.questions.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended'));
        if (qFiltered.length === 0) return startYPos;

        let compareMapObj = {};
        if (compareDataObj && compareDataObj.isSamePerson) {
            compareDataObj.questions?.forEach(q => {
                compareMapObj[String(q.questionId)] = q;
            });
        }

        doc.setFontSize(12);
        doc.setFont("GoogleSans", "bold");
        doc.setTextColor(...brandColors.navy);
        doc.text(`QUESTION ANALYSIS - ${title}`, 14, startYPos);

        // Legend
        doc.setFontSize(7);
        doc.setFont("GoogleSans", "normal");
        let lX = 14;
        const legendData = [
            { label: "Poor (< 2)", color: [239, 68, 68], w: 22 },
            { label: "Fair (2 - 3)", color: [249, 115, 22], w: 23 },
            { label: "Good (3 - 4)", color: [234, 179, 8], w: 23 },
            { label: "Excellent (> 4)", color: [34, 197, 94], w: 26 }
        ];
        legendData.forEach(lg => {
            doc.setFillColor(...lg.color);
            doc.roundedRect(lX, startYPos + 3, 3, 3, 1, 1, 'F');
            doc.setTextColor(100, 116, 139);
            doc.text(lg.label, lX + 4, startYPos + 5.5);
            lX += lg.w;
        });

        const hasDiff = prevRoundObj && compareDataObj && compareDataObj.isSamePerson;
        
        let headRow = ['Question', 'Rating', 'Score'];
        if (hasDiff) headRow.push('Diff');

        let colStyles = { 
            0: { cellWidth: hasDiff ? 95 : 120 }, 
            1: { cellWidth: 35 }, 
            2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        };
        if (hasDiff) colStyles[3] = { cellWidth: 25, halign: 'center' };

        autoTable(doc, {
            startY: startYPos + 9,
            head: [headRow],
            body: qFiltered.map(q => {
                let row = [q.question, '', q.avgRating.toFixed(2)];
                if (hasDiff) {
                    const compItem = compareMapObj[String(q.questionId)];
                    const imp = compItem ? compItem.improvement : undefined;
                    row.push(formatImpStr(imp));
                }
                return row;
            }),
            theme: 'grid',
            styles: { font: 'GoogleSans', fontSize: 10, textColor: [30, 41, 59], cellPadding: 3 },
            headStyles: { fillColor: brandColors.blue, textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: colStyles,
            didDrawCell: (data) => {
                if (data.section === 'body') {
                    if (!data.row || !data.row.raw) return;
                    const ratingVal = parseFloat(data.row.raw[2]);
                    if (isNaN(ratingVal)) return;

                    if (data.column.index === 1) {
                        const barW = 30;
                        const fillW = (ratingVal / 5) * barW;
                        const bx = data.cell.x + 2.5;
                        const by = data.cell.y + (data.cell.height / 2) - 1.5;
                        doc.setFillColor(241, 245, 249);
                        doc.rect(bx, by, barW, 3, 'F');
                        doc.setFillColor(...getBarColor(ratingVal));
                        doc.rect(bx, by, fillW, 3, 'F');
                    }
                }
            }
        });
        return doc.lastAutoTable.finalY + 10;
    };

    rolesToRender.forEach((r, idx) => {
        if (memberData.roleKey === 'hod' && r === 'FACULTY') return; // HOD rule

        let rData;
        let cData;
        if (r === 'OVERALL') {
            rData = overallReport;
            cData = overallCompare;
        } else {
            const keyMatch = Object.keys(memberData.roleWise).find(k => k.toUpperCase() === r);
            if (keyMatch) {
                rData = memberData.roleWise[keyMatch]?.reportData;
                cData = memberData.roleWise[keyMatch]?.comparisonData;
            }
        }

        if (rData && rData.sections && rData.sections.length > 0) {
            const sData = rData.sections.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended'));
            if (sData.length === 0) return;

            let compareMapObj = {};
            if (cData && cData.isSamePerson) {
                cData.questions?.forEach(q => {
                    compareMapObj[String(q.questionId)] = q;
                });
            }

            doc.addPage();
            p2Y = 20;

            doc.setFontSize(14);
            doc.setFont("GoogleSans", "bold");
            doc.setTextColor(...brandColors.navy);
            doc.text(`SECTION PERFORMANCE DASHBOARD (${getRoleDisplayName(r)})`, 14, p2Y);
            p2Y += 15;

            // RADAR CHART
            if (sData.length > 2) {
                doc.setFontSize(11);
                doc.setTextColor(...brandColors.darkText);
                doc.text("Performance Map (Radar)", 14, p2Y);
                drawRadarChart(doc, pageWidth / 2, p2Y + 45, 35, sData.map(s => s.section), sData.map(s => s.avgRating), 5);
                p2Y += 95;
            }

            // SECTION BARS
            doc.setFontSize(11);
            doc.setFont("GoogleSans", "bold");
            doc.setTextColor(...brandColors.darkText);
            doc.text("Detailed Section Scores", 14, p2Y);

            // Legend
            doc.setFontSize(7);
            doc.setFont("GoogleSans", "normal");
            let lX = 65;
            const legendData = [
                { label: "Poor (< 2)", color: [239, 68, 68], w: 22 },
                { label: "Fair (2 - 3)", color: [249, 115, 22], w: 23 },
                { label: "Good (3 - 4)", color: [234, 179, 8], w: 23 },
                { label: "Excellent (> 4)", color: [34, 197, 94], w: 26 }
            ];
            legendData.forEach(lg => {
                doc.setFillColor(...lg.color);
                doc.roundedRect(lX, p2Y - 3, 3, 3, 1, 1, 'F');
                doc.setTextColor(100, 116, 139);
                doc.text(lg.label, lX + 4, p2Y - 0.5);
                lX += lg.w;
            });

            p2Y += 6;

            // Scale Info
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            const sX = 80;
            doc.text("1", sX, p2Y); doc.text("2", sX + 20, p2Y); doc.text("3", sX + 40, p2Y); doc.text("4", sX + 60, p2Y); doc.text("5", sX + 80, p2Y);
            p2Y += 2;

            sData.forEach(sec => {
                if (p2Y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); p2Y = 20; }

                const imp = getImprovementForSection(sec.section, rData, compareMapObj);
                const impStr = formatImpStr(imp);

                doc.setFontSize(9);
                doc.setFont("GoogleSans", "bold");
                doc.setTextColor(...brandColors.darkText);
                const nameLines = doc.splitTextToSize(sec.section, 60);
                doc.text(nameLines, 14, p2Y + 3);

                // Bar
                doc.setFillColor(241, 245, 249);
                doc.roundedRect(sX, p2Y, 80, 5, 2, 2, 'F');
                const fillW = Math.max(0, Math.min((sec.avgRating / 5) * 80, 80));
                doc.setFillColor(...getBarColor(sec.avgRating));
                doc.roundedRect(sX, p2Y, fillW, 5, 2, 2, 'F');

                doc.setFontSize(9);
                doc.setTextColor(...brandColors.darkText);
                doc.text(sec.avgRating.toFixed(2), sX + 85, p2Y + 4);

                if (impStr !== "---") {
                    const impVal = parseFloat(impStr);
                    if (impVal > 0) doc.setTextColor(34, 197, 94); // Green
                    else if (impVal < 0) doc.setTextColor(239, 68, 68); // Red
                    else doc.setTextColor(...brandColors.grayText);
                    doc.setFontSize(8);
                    doc.text(`(${impStr})`, sX + 93, p2Y + 4);
                }

                p2Y += Math.max(8, nameLines.length * 4 + 4);
            });
        }

        if (rData && rData.questions && rData.questions.length > 0) {
            let qY = p2Y + 15;
            if (qY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); qY = 20; }
            p2Y = renderQuestionAnalysis(getRoleDisplayName(r), rData, cData, qY);
        }
    });

    // SUGGESTIONS
    const allSuggestions = new Set();
    const extractSuggestions = (rData) => {
        if (rData && rData.suggestions) {
            rData.suggestions.forEach(sug => {
                if (sug.answers) {
                    sug.answers.forEach(ans => {
                        const trimmed = ans.trim();
                        if (trimmed && trimmed.toLowerCase() !== "no comments" && trimmed !== "undefined") {
                            allSuggestions.add(trimmed);
                        }
                    });
                }
            });
        }
    };
    extractSuggestions(overallReport);
    Object.values(memberData.roleWise || {}).forEach(roleObj => extractSuggestions(roleObj.reportData));

    let qY = p2Y + 15;
    if (allSuggestions.size > 0) {
        if (qY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); qY = 20; }
        doc.setFontSize(12);
        doc.setFont("GoogleSans", "bold");
        doc.setTextColor(...brandColors.orange);
        doc.text("SUGGESTIONS & FEEDBACK", 14, qY);
        qY += 8;

        doc.setFont("GoogleSans", "normal");
        doc.setTextColor(...brandColors.grayText);
        doc.setFontSize(9);
        Array.from(allSuggestions).forEach((sug, index) => {
            const lines = doc.splitTextToSize(`${index + 1}. ${sug}`, pageWidth - 28);
            if (qY + (lines.length * 5) > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); qY = 20; }
            doc.text(lines, 14, qY);
            qY += (lines.length * 5) + 3;
        });
    }
};
