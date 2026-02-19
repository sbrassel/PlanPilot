'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import { exportPDF, exportDOCX, exportJSON } from '@/lib/export-service';

export default function StepExport() {
    const { plan, updatePlan } = usePlanStore();
    const [exporting, setExporting] = useState<string | null>(null);

    const hasDetailPlan = plan.detailPlan !== null;
    const hasSequenceDetails = plan.mode === 'sequence' && plan.sequenceSkeleton?.lessons.some(l => l.detailPlan);

    const canExport = hasDetailPlan || hasSequenceDetails;

    const handleExport = async (format: 'pdf' | 'docx' | 'json') => {
        setExporting(format);
        try {
            switch (format) {
                case 'pdf':
                    await exportPDF(plan);
                    break;
                case 'docx':
                    await exportDOCX(plan);
                    break;
                case 'json':
                    exportJSON(plan);
                    break;
            }
        } catch (err) {
            console.error(`Export ${format} failed:`, err);
            alert(`Export fehlgeschlagen. Bitte versuche es erneut.`);
        }
        setExporting(null);
    };

    return (
        <div className="step-content-area">
            <h2>Export &amp; Reflexion</h2>
            <p className="text-secondary mb-6">
                Lade deinen fertigen Plan herunter und bereite eine Reflexionsnotiz vor.
            </p>

            {!canExport ? (
                <div className="alert alert-warning">
                    Bitte erstelle zuerst eine Detailplanung (Schritt 8).
                </div>
            ) : (
                <div>
                    {/* Export Options */}
                    <div className="card mb-6">
                        <h3 className="mb-4">Export</h3>
                        <div className="export-grid export-grid-3">
                            <button
                                className="export-card"
                                onClick={() => handleExport('pdf')}
                                disabled={exporting !== null}
                                type="button"
                            >
                                {exporting === 'pdf' ? (
                                    <span className="generating-spinner" style={{ borderTopColor: 'var(--color-primary)' }} />
                                ) : (
                                    <span className="export-icon">📄</span>
                                )}
                                <span className="export-label">PDF</span>
                                <span className="export-desc">Druckfertige Version mit Tabellen</span>
                            </button>
                            <button
                                className="export-card"
                                onClick={() => handleExport('docx')}
                                disabled={exporting !== null}
                                type="button"
                            >
                                {exporting === 'docx' ? (
                                    <span className="generating-spinner" style={{ borderTopColor: 'var(--color-primary)' }} />
                                ) : (
                                    <span className="export-icon">📝</span>
                                )}
                                <span className="export-label">DOCX</span>
                                <span className="export-desc">Bearbeitbare Word-Datei</span>
                            </button>
                            <button
                                className="export-card"
                                onClick={() => handleExport('json')}
                                disabled={exporting !== null}
                                type="button"
                            >
                                {exporting === 'json' ? (
                                    <span className="generating-spinner" style={{ borderTopColor: 'var(--color-primary)' }} />
                                ) : (
                                    <span className="export-icon">💾</span>
                                )}
                                <span className="export-label">JSON</span>
                                <span className="export-desc">Backup / Import</span>
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="card mb-6">
                        <h3 className="mb-4">Plan-Zusammenfassung</h3>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="form-label">Titel</span>
                                <p>{plan.shortVersion?.title || plan.title}</p>
                            </div>
                            <div className="summary-item">
                                <span className="form-label">Modus</span>
                                <p>{plan.mode === 'single' ? 'Einzelstunde' : 'Sequenz'}</p>
                            </div>
                            <div className="summary-item">
                                <span className="form-label">Phasen</span>
                                <p>{plan.detailPlan?.phases.length || '—'}</p>
                            </div>
                            <div className="summary-item">
                                <span className="form-label">Differenzierung</span>
                                <p>A/B/C ✅</p>
                            </div>
                            <div className="summary-item">
                                <span className="form-label">LP21-Kompetenzen</span>
                                <p>{plan.curriculumMappings.length > 0
                                    ? `${plan.curriculumMappings.length} zugeordnet`
                                    : '—'
                                }</p>
                            </div>
                            <div className="summary-item">
                                <span className="form-label">Plan B</span>
                                <p>{plan.detailPlan?.planBIncluded ? '✅ Enthalten' : '❌ Fehlt'}</p>
                            </div>
                            {plan.mode === 'sequence' && plan.sequenceSkeleton && (
                                <>
                                    <div className="summary-item">
                                        <span className="form-label">Lektionen</span>
                                        <p>{plan.sequenceSkeleton.lessons.length}</p>
                                    </div>
                                    <div className="summary-item">
                                        <span className="form-label">Detailliert</span>
                                        <p>{plan.sequenceSkeleton.lessons.filter(l => l.detailPlan).length}/{plan.sequenceSkeleton.lessons.length}</p>
                                    </div>
                                </>
                            )}
                            <div className="summary-item">
                                <span className="form-label">Status</span>
                                <span className="badge badge-approved">Fertig</span>
                            </div>
                        </div>
                    </div>

                    {/* Reflection */}
                    <div className="card">
                        <h3 className="mb-4">📝 Reflexionsnotiz</h3>
                        <p className="text-secondary mb-4">
                            Halte deine Gedanken und Beobachtungen nach der Durchführung fest.
                        </p>
                        <textarea
                            className="form-textarea"
                            placeholder="Was hat gut funktioniert? Wo gab es Schwierigkeiten? Was würde ich anders machen?"
                            rows={5}
                            value={plan.detailPlan?.reflectionNotes || ''}
                            onChange={e => {
                                if (plan.detailPlan) {
                                    updatePlan({
                                        detailPlan: { ...plan.detailPlan, reflectionNotes: e.target.value }
                                    });
                                }
                            }}
                        />
                    </div>

                    <div className="alert alert-success mt-6">
                        🎉 Dein Plan ist fertig! Du kannst ihn jederzeit über &quot;Meine Pläne&quot; wieder aufrufen.
                    </div>
                </div>
            )}
        </div>
    );
}
