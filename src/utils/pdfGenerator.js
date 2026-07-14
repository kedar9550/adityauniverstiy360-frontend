import autoTable from 'jspdf-autotable';

function toProperCase(str) {
    if (!str) return '';
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

export const generateFeedbackReportPDF = (doc, config) => {
    const {
        memberData,
        isFirstPage = true,
        pageWidth = 210,
        selectedSchool,
        activeDept,
        currentRoundObj,
        prevRoundObj
    } = config;

    if (!isFirstPage) {
        doc.addPage();
    }

    doc.setFontSize(16);
    doc.text('360 Degree Feedback Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    let yPos = 25;

    let roundDisplayString = '';
    if (currentRoundObj) {
        const startDate = new Date(currentRoundObj.startDate).toLocaleDateString('en-GB');
        const endDate = new Date(currentRoundObj.endDate).toLocaleDateString('en-GB');
        roundDisplayString = `Academic Year: ${currentRoundObj.academicYear} | Cycle: ${currentRoundObj.cycle} | Period: ${startDate} - ${endDate}`;
    }

    const scopeDisplayString = 'Overall Report' + (selectedSchool ? ` (${selectedSchool.name} - ${activeDept ? activeDept.name : 'All Departments'})` : '');

    if (roundDisplayString) {
        doc.text(`${roundDisplayString}`, 14, yPos);
        yPos += 7;
    }
    doc.text(`Scope: ${scopeDisplayString}`, 14, yPos);
    yPos += 7;

    if (memberData.targetPersonName) {
        doc.text(`Member Name: ${toProperCase(memberData.targetPersonName)}`, 14, yPos);
        yPos += 7;
    }
    doc.text(`Designation: ${memberData.roleTitle}`, 14, yPos);
    yPos += 7;

    const overallReport = memberData.overall?.reportData || {};
    const overallCompare = memberData.overall?.comparisonData;

    doc.text(`Overall Rating: ${overallReport.overallRating || '0.00'}`, 14, yPos);
    yPos += 7;

    if (overallCompare && overallCompare.isSamePerson) {
        const sign = overallCompare.overallImprovement > 0 ? '+' : '';
        const prevStr = prevRoundObj ? `${prevRoundObj.academicYear} | Cycle ${prevRoundObj.cycle}` : 'previous cycle';
        doc.text(`Improvement vs ${prevStr} : ${sign}${overallCompare.overallImprovement.toFixed(2)}`, 14, yPos);
        yPos += 7;
    }

    doc.text(`Total Responses: ${overallReport.responses || 0}`, 14, yPos);
    yPos += 7;

    // Responses by Role
    if (overallReport.giverRoleStats) {
        doc.setFontSize(12);
        doc.text('Responses by Role:', 14, yPos);
        yPos += 4;

        const formatImp = (imp) => {
            if (imp === undefined || imp === null) return "---";
            const val = parseFloat(imp);
            if (val > 0) return `+${val.toFixed(2)}`;
            return val.toFixed(2);
        };

        let overallImp = "---";
        if (overallCompare && overallCompare.isSamePerson && overallCompare.overallImprovement !== undefined) {
            overallImp = formatImp(overallCompare.overallImprovement);
        }

        const bodyData = [];
        bodyData.push(['Overall', overallReport.responses || 0, overallReport.overallRating || '0.00', overallImp]);

        Object.entries(overallReport.giverRoleStats).forEach(([key, val]) => {
            const count = typeof val === 'object' ? (val.count ?? 0) : val;
            const avgRating = typeof val === 'object' ? (val.avgRating ?? 0).toFixed(2) : '0.00';
            let roleImp = "---";
            const roleComp = memberData.roleWise[key]?.comparisonData;
            if (roleComp && roleComp.isSamePerson && roleComp.overallImprovement !== undefined) {
                roleImp = formatImp(roleComp.overallImprovement);
            }
            bodyData.push([key, count, avgRating, roleImp]);
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Role', 'Count', 'Avg Rating', 'Comparison']],
            body: bodyData,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [1, 66, 132] },
        });
        yPos = doc.lastAutoTable.finalY + 8;
    }

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

    const formatImpStr = (val) => {
        if (val === undefined || val === null) return "---";
        if (val > 0) return `+${val.toFixed(2)}`;
        return val.toFixed(2);
    };

    const getBarColor = (rating) => {
        const num = parseFloat(rating);
        if (num >= 4.5) return [22, 163, 74];   // #16A34A (Strongly Agree)
        if (num >= 3.5) return [74, 222, 128];  // #4ADE80 (Agree)
        if (num >= 2.5) return [250, 204, 21];  // #FACC15 (Neutral)
        if (num >= 1.5) return [248, 113, 113]; // #F87171 (Disagree)
        return [220, 38, 38];                   // #DC2626 (Strongly Disagree)
    };

    const renderSectionsTable = (title, reportDataObj, compareDataObj, startYPos) => {
        if (!reportDataObj || !reportDataObj.sections || reportDataObj.sections.length === 0) return startYPos;
        const filtered = reportDataObj.sections.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended'));
        if (filtered.length === 0) return startYPos;

        let compareMapObj = {};
        if (compareDataObj && compareDataObj.isSamePerson) {
            compareDataObj.questions?.forEach(q => {
                compareMapObj[String(q.questionId)] = q;
            });
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, startYPos);
        doc.setFont("helvetica", "normal");

        let currentY = startYPos + 10;
        const marginX = 14;
        const maxSectionNameWidth = 65;
        const barStartX = marginX + maxSectionNameWidth + 5;
        const maxBarWidth = 95;
        const barHeight = 6;

        // Draw scale top
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        const scaleY = currentY - 2;
        doc.text("1", barStartX, scaleY);
        doc.text("2", barStartX + (maxBarWidth * 0.25), scaleY);
        doc.text("3", barStartX + (maxBarWidth * 0.5), scaleY);
        doc.text("4", barStartX + (maxBarWidth * 0.75), scaleY);
        doc.text("5", barStartX + maxBarWidth, scaleY);

        doc.setDrawColor(220, 220, 220);
        doc.line(barStartX, scaleY + 1, barStartX + maxBarWidth, scaleY + 1);

        filtered.forEach(sec => {
            // Check page break
            if (currentY > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                currentY = 20;
            }

            const imp = getImprovementForSection(sec.section, reportDataObj, compareMapObj);
            const impStr = formatImpStr(imp);

            // Section Name
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            const sectionLines = doc.splitTextToSize(sec.section, maxSectionNameWidth);
            const textY = currentY + (barHeight / 2) + 1 + ((sectionLines.length - 1) * 2);
            doc.text(sectionLines, barStartX - 5, textY, { align: 'right' });

            // Background bar (gray)
            doc.setFillColor(241, 245, 249);
            doc.rect(barStartX, currentY, maxBarWidth, barHeight, 'F');

            // Foreground bar (dynamic color)
            const ratingWidth = Math.max(0, Math.min((sec.avgRating / 5) * maxBarWidth, maxBarWidth));
            const barColor = getBarColor(sec.avgRating);
            doc.setFillColor(...barColor);
            doc.rect(barStartX, currentY, ratingWidth, barHeight, 'F');

            // Text for rating
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(sec.avgRating.toFixed(2), barStartX + maxBarWidth + 4, currentY + 4);

            // Comparison string
            if (impStr !== "---") {
                const impVal = parseFloat(impStr);
                if (impVal > 0) {
                    doc.setTextColor(22, 163, 74);
                } else if (impVal < 0) {
                    doc.setTextColor(220, 38, 38);
                } else {
                    doc.setTextColor(100, 116, 139);
                }
                doc.text(impStr, barStartX + maxBarWidth + 14, currentY + 4);
            }

            doc.setFont("helvetica", "normal");

            // Update Y
            currentY += Math.max(barHeight + 6, sectionLines.length * 5 + 4);
        });

        return currentY + 8;
    };

    const renderQuestionsTable = (title, reportDataObj, compareDataObj, startYPos) => {
        if (!reportDataObj || !reportDataObj.questions || reportDataObj.questions.length === 0) return startYPos;
        const filtered = reportDataObj.questions.filter(item => !item.section?.toLowerCase().includes('open ended') && !item.section?.toLowerCase().includes('open-ended'));
        if (filtered.length === 0) return startYPos;

        let compareMapObj = {};
        if (compareDataObj && compareDataObj.isSamePerson) {
            compareDataObj.questions?.forEach(q => {
                compareMapObj[String(q.questionId)] = q;
            });
        }

        doc.setFontSize(12);
        doc.text(title, 14, startYPos);
        autoTable(doc, {
            startY: startYPos + 4,
            head: [['Question', 'Avg Rating', 'Comparison']],
            body: filtered.map(q => {
                const compItem = compareMapObj[String(q.questionId)];
                const imp = compItem ? compItem.improvement : undefined;
                return [q.question, q.avgRating.toFixed(2), formatImpStr(imp)];
            }),
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] },
        });
        return doc.lastAutoTable.finalY + 10;
    };

    let startY = yPos + 2;

    const rolesToRender = ['OVERALL'];
    if (overallReport.giverRoleStats) {
        Object.keys(overallReport.giverRoleStats).forEach(key => rolesToRender.push(key.toUpperCase()));
    }

    // SECTION PERFORMANCE block
    doc.setFontSize(14);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);

    //doc.text("==================================================", 14, startY);
    startY += 6;
    doc.text("SECTION PERFORMANCE", 14, startY);
    startY += 6;
    //doc.text("==================================================", 14, startY);
    startY += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    let sectionIdx = 0;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const r of rolesToRender) {
        if (memberData.roleKey === 'hod' && r === 'FACULTY') continue; // HOD rule

        let rData, cData;
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
            // Check if page break needed
            if (startY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                startY = 20;
            }
            const letter = alphabet[sectionIdx % alphabet.length];
            const title = `${letter}) ${r}`;
            startY = renderSectionsTable(title, rData, cData, startY);
            sectionIdx++;
        }
    }

    // QUESTION ANALYSIS block
    if (startY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        startY = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    //doc.text("==================================================", 14, startY);
    startY += 6;
    doc.text("QUESTION ANALYSIS", 14, startY);
    startY += 6;
    //doc.text("==================================================", 14, startY);
    startY += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    sectionIdx = 0;
    for (const r of rolesToRender) {
        if (memberData.roleKey === 'hod' && r === 'FACULTY') continue; // HOD rule

        let rData, cData;
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

        if (rData && rData.questions && rData.questions.length > 0) {
            if (startY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                startY = 20;
            }
            const letter = alphabet[sectionIdx % alphabet.length];
            const title = `${letter}) ${r}`;
            startY = renderQuestionsTable(title, rData, cData, startY);
            sectionIdx++;
        }
    }

    // SUGGESTIONS block
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
    Object.values(memberData.roleWise || {}).forEach(roleObj => {
        extractSuggestions(roleObj.reportData);
    });

    if (allSuggestions.size > 0) {
        if (startY > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            startY = 20;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(217, 119, 6);
        //doc.text("==================================================", 14, startY);
        startY += 6;
        doc.text("SUGGESTIONS", 14, startY);
        startY += 6;
        //doc.text("==================================================", 14, startY);
        startY += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        const suggestionsArray = Array.from(allSuggestions);
        suggestionsArray.forEach(sug => {
            const textLines = doc.splitTextToSize(`- ${sug}`, pageWidth - 28);
            if (startY + (textLines.length * 6) > doc.internal.pageSize.getHeight() - 15) {
                doc.addPage();
                startY = 20;
            }
            doc.text(textLines, 14, startY);
            startY += (textLines.length * 6) + 2;
        });
    }

};
