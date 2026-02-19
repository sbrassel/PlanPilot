// ============================================
// PlanPilot — Export Service (PDF · DOCX · JSON)
// ============================================

import type { PlanData, Phase, Differentiation, ShortVersion, DetailPlan } from './types';

// ── Helpers ──────────────────────────────────

function levelLabel(level: string | null): string {
    const labels: Record<string, string> = {
        kg: 'Kindergarten', primar: 'Primar', sek1: 'Sek I',
        '10sj': '10. Schuljahr', gymnasium: 'Gymnasium',
        berufsfachschule: 'Berufsfachschule',
    };
    return level ? labels[level] || level : '—';
}

function modeLabel(mode: string): string {
    return mode === 'single' ? 'Einzelstunde' : mode === 'sequence' ? 'Sequenz' : 'Reihe';
}

function timestamp(): string {
    return new Date().toLocaleDateString('de-CH', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

function diffText(d: Differentiation): string {
    return `A (Basis): ${d.niveauA}\nB (Standard): ${d.niveauB}\nC (Challenge): ${d.niveauC}`;
}

// ── PDF Export ───────────────────────────────

export async function exportPDF(plan: PlanData): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    // jspdf-autotable extends jsPDF prototype
    const autoTable = autoTableModule.default || autoTableModule;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // ── Header ──
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PlanPilot', margin, y + 8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(timestamp(), pageWidth - margin, y + 8, { align: 'right' });
    y += 16;

    // Title
    const title = plan.shortVersion?.title || plan.title || `${plan.subject} — Planung`;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 10;

    // ── Metadata Table ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Feld', 'Wert']],
        body: [
            ['Modus', modeLabel(plan.mode)],
            ['Fach / Thema', plan.subject],
            ['Stufe', levelLabel(plan.level)],
            ['Dauer', `${plan.durationMinutes} Minuten`],
            ['Klassengrösse', `${plan.classProfile.classSize} SuS`],
            ['Heterogenität', plan.classProfile.heterogeneity],
            ['Sprachstand', plan.classProfile.languageLevel.toUpperCase()],
            ...(plan.mode === 'sequence' ? [['Lektionen', `${plan.lessonCount}`]] : []),
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [99, 102, 241] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;

    // ── Lernziele ──
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Lernziele', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    for (const goal of plan.goals) {
        if (goal.trim()) {
            const bulletText = `• ${goal}`;
            const lines = doc.splitTextToSize(bulletText, contentWidth - 6);
            doc.text(lines, margin + 3, y);
            y += lines.length * 4 + 2;
        }
    }
    y += 4;

    // ── Curriculum Mappings ──
    if (plan.curriculumMappings.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Lehrplan-Kompetenzen', margin, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Code', 'Kompetenz', 'Bereich', 'Konfidenz']],
            body: plan.curriculumMappings.map(m => [
                m.competencyCode,
                m.competencyText.slice(0, 80) + (m.competencyText.length > 80 ? '…' : ''),
                m.area,
                `${Math.round(m.confidenceScore * 100)}%`,
            ]),
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [34, 197, 94] },
            columnStyles: { 1: { cellWidth: contentWidth * 0.45 } },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Kurzversion Phases ──
    if (plan.shortVersion) {
        addPageIfNeeded(doc, y, 40);
        y = checkY(doc, y);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Kurzversion — Phasenübersicht', margin, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Phase', 'Dauer', 'Beschreibung']],
            body: plan.shortVersion.phasesSummary.map(p => [
                p.name, `${p.durationMinutes} Min`, p.description,
            ]),
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [99, 102, 241] },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // ── Detailplanung ──
    if (plan.detailPlan) {
        addPageIfNeeded(doc, y, 30);
        y = checkY(doc, y);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailplanung — Unterrichtsverlauf', margin, y);
        y += 6;

        const body = plan.detailPlan.phases.map(p => [
            `${p.durationMinutes}'`,
            { content: `${p.name}\n\n${p.didacticComment || ''}`, styles: { fontSize: 7 } },
            p.teacherActions || '—',
            p.childActions || '—',
            p.socialForm || '—',
            (p.materials || []).join(', ') || '—',
        ]);

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [
                [
                    { content: 'Zeit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'Teilschritte und didaktischer Kommentar', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'Verlauf', colSpan: 2, styles: { halign: 'center' } },
                    { content: 'Organisatorisches', colSpan: 2, styles: { halign: 'center' } },
                ],
                [
                    { content: 'Inhalte, Tätigkeit der Lehrperson', styles: { halign: 'center', fontSize: 7 } },
                    { content: 'Inhalte, Tätigkeit der Kinder', styles: { halign: 'center', fontSize: 7 } },
                    { content: 'Sozialform', styles: { halign: 'center', fontSize: 7 } },
                    { content: 'Material / Medien', styles: { halign: 'center', fontSize: 7 } },
                ]
            ],
            body,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [75, 85, 99], textColor: 255, fontSize: 8, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 12 },
                1: { cellWidth: 45 },
                2: { cellWidth: 40 },
                3: { cellWidth: 40 },
                4: { cellWidth: 20 },
                5: { cellWidth: 23 },
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 10;

        // Differentiation Details
        addPageIfNeeded(doc, y, 40);
        y = checkY(doc, y);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Differenzierung & Support (Detail)', margin, y);
        y += 6;

        const diffBody = plan.detailPlan.phases.map(p => [
            p.name,
            p.differentiation.niveauA,
            p.differentiation.niveauB,
            p.differentiation.niveauC,
        ]);

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Phase', 'A (Basis)', 'B (Standard)', 'C (Challenge)']],
            body: diffBody,
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [99, 102, 241] },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;

        // Plan B
        if (plan.detailPlan.planBIncluded) {
            addPageIfNeeded(doc, y, 40);
            y = checkY(doc, y);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Plan B — Alternativen', margin, y);
            y += 4;

            const planBItems = plan.detailPlan.phases
                .filter(p => p.planBAlternative)
                .map(p => [p.name, p.planBAlternative || '—']);

            if (planBItems.length > 0) {
                autoTable(doc, {
                    startY: y,
                    margin: { left: margin, right: margin },
                    head: [['Phase', 'Alternative Vorgehensweise']],
                    body: planBItems,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [107, 114, 128] },
                });
                y = (doc as any).lastAutoTable.finalY + 8;
            } else {
                y += 6;
            }
        }
    }

    // ── Sequence ──
    if (plan.mode === 'sequence' && plan.sequenceSkeleton) {
        doc.addPage();
        y = margin;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Sequenzübersicht', margin, y);
        y += 8;

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Nr.', 'Titel', 'Fokus', 'Dauer']],
            body: plan.sequenceSkeleton.lessons.map(l => [
                `${l.lessonNumber}`, l.title, l.focus, `${l.durationMinutes} Min`,
            ]),
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [99, 102, 241] },
        });
    }

    // ── Sequence Details (All Lessons) ──
    if (plan.mode === 'sequence' && plan.sequenceSkeleton) {
        for (const lesson of plan.sequenceSkeleton.lessons) {
            if (lesson.detailPlan) {
                doc.addPage();
                y = margin;

                // Lesson Header
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(`Lektion ${lesson.lessonNumber}: ${lesson.title}`, margin, y);
                y += 8;

                doc.setFontSize(11);
                doc.setFont('helvetica', 'italic');
                doc.text(`Fokus: ${lesson.focus} · ${lesson.durationMinutes} Min`, margin, y);
                y += 10;

                // Goals
                if (lesson.goals && lesson.goals.length > 0) {
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Lernziele', margin, y);
                    y += 6;
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    for (const goal of lesson.goals) {
                        const bulletText = `• ${goal}`;
                        const lines = doc.splitTextToSize(bulletText, contentWidth - 6);
                        doc.text(lines, margin + 3, y);
                        y += lines.length * 4 + 2;
                    }
                    y += 4;
                }

                // Detail Table
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Unterrichtsverlauf', margin, y);
                y += 6;

                const body = lesson.detailPlan.phases.map(p => [
                    `${p.durationMinutes}'`,
                    { content: `${p.name}\n\n${p.didacticComment || ''}`, styles: { fontSize: 7 } },
                    p.teacherActions || '—',
                    p.childActions || '—',
                    p.socialForm || '—',
                    (p.materials || []).join(', ') || '—',
                ]);

                autoTable(doc, {
                    startY: y,
                    margin: { left: margin, right: margin },
                    head: [
                        [
                            { content: 'Zeit', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                            { content: 'Teilschritte und didaktischer Kommentar', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                            { content: 'Verlauf', colSpan: 2, styles: { halign: 'center' } },
                            { content: 'Organisatorisches', colSpan: 2, styles: { halign: 'center' } },
                        ],
                        [
                            { content: 'Inhalte, Tätigkeit der Lehrperson', styles: { halign: 'center', fontSize: 7 } },
                            { content: 'Inhalte, Tätigkeit der Kinder', styles: { halign: 'center', fontSize: 7 } },
                            { content: 'Sozialform', styles: { halign: 'center', fontSize: 7 } },
                            { content: 'Material / Medien', styles: { halign: 'center', fontSize: 7 } },
                        ]
                    ],
                    body,
                    theme: 'grid',
                    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                    headStyles: { fillColor: [75, 85, 99], textColor: 255, fontSize: 8, fontStyle: 'bold' },
                    columnStyles: {
                        0: { cellWidth: 12 },
                        1: { cellWidth: 45 },
                        2: { cellWidth: 40 },
                        3: { cellWidth: 40 },
                        4: { cellWidth: 20 },
                        5: { cellWidth: 23 },
                    },
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                y = (doc as any).lastAutoTable.finalY + 10;

                // Differentiation Details
                addPageIfNeeded(doc, y, 40);
                y = checkY(doc, y);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Differenzierung & Support', margin, y);
                y += 6;

                const diffBody = lesson.detailPlan.phases.map(p => [
                    p.name,
                    p.differentiation.niveauA,
                    p.differentiation.niveauB,
                    p.differentiation.niveauC,
                ]);

                autoTable(doc, {
                    startY: y,
                    margin: { left: margin, right: margin },
                    head: [['Phase', 'A (Basis)', 'B (Standard)', 'C (Challenge)']],
                    body: diffBody,
                    theme: 'striped',
                    styles: { fontSize: 7, cellPadding: 2 },
                    headStyles: { fillColor: [99, 102, 241] },
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                y = (doc as any).lastAutoTable.finalY + 8;

                // Plan B
                if (lesson.detailPlan.planBIncluded) {
                    addPageIfNeeded(doc, y, 40);
                    y = checkY(doc, y);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Plan B — Alternativen', margin, y);
                    y += 4;

                    const planBItems = lesson.detailPlan.phases
                        .filter(p => p.planBAlternative)
                        .map(p => [p.name, p.planBAlternative || '—']);

                    if (planBItems.length > 0) {
                        autoTable(doc, {
                            startY: y,
                            margin: { left: margin, right: margin },
                            head: [['Phase', 'Alternative Vorgehensweise']],
                            body: planBItems,
                            theme: 'grid',
                            styles: { fontSize: 8, cellPadding: 2 },
                            headStyles: { fillColor: [107, 114, 128] },
                        });
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        y = (doc as any).lastAutoTable.finalY + 8;
                    } else {
                        y += 6;
                    }
                }
            }
        }

    }

    // ── Differentiation Summary ──
    if (plan.shortVersion?.differentiationSummary) {
        addPageIfNeeded(doc, y, 40);
        y = checkY(doc, y);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Zusammenfassende Differenzierung', margin, y);
        y += 2;

        const ds = plan.shortVersion.differentiationSummary;
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [['Niveau', 'Beschreibung']],
            body: [
                ['A (Basis)', ds.niveauA],
                ['B (Standard)', ds.niveauB],
                ['C (Challenge)', ds.niveauC],
            ],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [99, 102, 241] },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 30 }
            }
        });
        y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Save
    doc.save(`PlanPilot_${plan.subject.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

function addPageIfNeeded(doc: any, y: number, needed: number) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - 15) {
        doc.addPage();
        return true;
    }
    return false;
}

function checkY(doc: any, y: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    return y + 40 > pageHeight ? 15 : y;
}

// ── DOCX Export ──────────────────────────────

export async function exportDOCX(plan: PlanData): Promise<void> {
    const docx = await import('docx');
    const { saveAs } = await import('file-saver');

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, WidthType, BorderStyle } = docx;

    const title = plan.shortVersion?.title || plan.title || `${plan.subject} — Planung`;

    const noBorder = {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };

    // Build sections
    const children: (typeof Paragraph.prototype | typeof Table.prototype)[] = [];

    // Title
    children.push(new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
    }));

    // Metadata
    children.push(new Paragraph({
        children: [
            new TextRun({ text: `Modus: ${modeLabel(plan.mode)} · Fach: ${plan.subject} · Stufe: ${levelLabel(plan.level)}`, size: 20 }),
        ],
        spacing: { after: 100 },
    }));
    children.push(new Paragraph({
        children: [
            new TextRun({ text: `Dauer: ${plan.durationMinutes} Min · Klasse: ${plan.classProfile.classSize} SuS · Sprache: ${plan.classProfile.languageLevel.toUpperCase()}`, size: 20 }),
        ],
        spacing: { after: 200 },
    }));

    // Goals
    children.push(new Paragraph({ text: 'Lernziele', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    for (const goal of plan.goals) {
        if (goal.trim()) {
            children.push(new Paragraph({
                children: [new TextRun({ text: `• ${goal}`, size: 20 })],
                spacing: { after: 60 },
            }));
        }
    }

    // Curriculum
    if (plan.curriculumMappings.length > 0) {
        children.push(new Paragraph({ text: 'Lehrplan-Kompetenzen', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
        const rows = [
            new TableRow({
                children: ['Code', 'Kompetenz', 'Bereich'].map(text =>
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })] })],
                        width: { size: 33, type: WidthType.PERCENTAGE },
                    })
                ),
            }),
            ...plan.curriculumMappings.map(m =>
                new TableRow({
                    children: [m.competencyCode, m.competencyText, m.area].map(text =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
                            width: { size: 33, type: WidthType.PERCENTAGE },
                        })
                    ),
                })
            ),
        ];
        children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    }

    // Phase Summary
    if (plan.shortVersion) {
        children.push(new Paragraph({ text: 'Kurzversion — Phasen', heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
        for (const p of plan.shortVersion.phasesSummary) {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: `${p.name} (${p.durationMinutes} Min)`, bold: true, size: 20 }),
                    new TextRun({ text: ` — ${p.description}`, size: 20 }),
                ],
                spacing: { after: 60 },
            }));
        }
    }

    // Detail Phases (Verlaufstabelle)
    if (plan.detailPlan) {
        children.push(new Paragraph({
            children: [new TextRun({ text: 'Detailplanung — Unterrichtsverlauf', bold: true, size: 28 })],
            spacing: { before: 400, after: 200 },
        }));

        const tableRows = [
            // Header 1
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Zeit', bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: docx.VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Teilschritte / Kommentar', bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: docx.VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Inhalte, Tätigkeit LP', bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: docx.VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Inhalte, Tätigkeit Kinder', bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: docx.VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sozialform', bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: docx.VerticalAlign.CENTER }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Material', bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: docx.VerticalAlign.CENTER }),
                ],
            }),
            // Data Rows
            ...plan.detailPlan.phases.map(p => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${p.durationMinutes}'`, size: 18 })] })] }),
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: p.name, bold: true, size: 18 })] }),
                            new Paragraph({ children: [new TextRun({ text: p.didacticComment || '', size: 16 })] })
                        ]
                    }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.teacherActions || '—', size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.childActions || '—', size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.socialForm || '—', size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (p.materials || []).join(', '), size: 18 })] })] }),
                ],
            })),
        ];

        children.push(new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        }));

        // Differentiation table
        children.push(new Paragraph({
            children: [new TextRun({ text: 'Differenzierung', bold: true, size: 24 })],
            spacing: { before: 300, after: 100 }
        }));

        const diffRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Phase', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'A (Basis)', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'B (Standard)', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'C (Challenge)', bold: true })] })] }),
                ],
            }),
            ...plan.detailPlan.phases.map(p => new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.name, bold: true, size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.differentiation.niveauA, size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.differentiation.niveauB, size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.differentiation.niveauC, size: 18 })] })] }),
                ],
            })),
        ];
        children.push(new Table({ rows: diffRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    }

    // Footer
    children.push(new Paragraph({
        children: [new TextRun({ text: `Erstellt mit PlanPilot · ${timestamp()}`, size: 16, color: '999999' })],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 400 },
    }));

    const doc = new Document({
        sections: [{
            properties: { page: { size: { orientation: docx.PageOrientation.LANDSCAPE } } },
            children
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `PlanPilot_${plan.subject.replace(/\s+/g, '_')}_${Date.now()}.docx`);
}

// ── JSON Export ──────────────────────────────

export function exportJSON(plan: PlanData): void {
    const json = JSON.stringify(plan, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PlanPilot_${plan.subject.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
