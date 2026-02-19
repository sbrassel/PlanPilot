'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import { generateLessonPlan } from '@/lib/ai';
import { generateDetailPlan, refineDetailPlan } from '@/lib/mock-ai';
import { DetailPlan } from '@/lib/types';
import { runQualityChecks } from '@/lib/quality-checks';

export default function StepDetail() {
    const { plan, setDetailPlan, isGenerating, setGenerating } = usePlanStore();
    const [error, setError] = useState<string | null>(null);
    const [showRefine, setShowRefine] = useState(false);
    const [refineText, setRefineText] = useState('');

    const isBlocked = !plan.gateBApproved;

    const handleRefine = async () => {
        if (!plan.detailPlan || !refineText.trim()) return;
        setGenerating(true);
        try {
            const refined = await refineDetailPlan(plan.detailPlan, refineText);
            setDetailPlan(refined);
            setShowRefine(false);
            setRefineText('');
        } catch (e) {
            console.error(e);
            setError('Fehler bei der Anpassung.');
        } finally {
            setGenerating(false);
        }
    };



    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);

        try {
            const dp = await generateLessonPlan(plan, 'detail') as DetailPlan;
            setDetailPlan(dp);
        } catch (e) {
            console.error('AI Error, using fallback:', e);
            const fallbackPlan = await generateDetailPlan(plan);
            setDetailPlan(fallbackPlan);
            setError('KI-Quota überschritten. Ein strukturierter Plan wurde trotzdem erstellt (Fallback-Logik).');
        } finally {
            setGenerating(false);
        }
    };

    if (isBlocked) {
        return (
            <div className="step-content-area">
                <h2>Detailplanung</h2>
                <div className="alert alert-error">
                    🔒 Detailplanung erst nach Freigabe der Kurzversion (Gate B) verfügbar.
                </div>
            </div>
        );
    }

    const qualityWarnings = plan.detailPlan ? runQualityChecks(plan) : [];

    return (
        <div className="step-content-area">
            <h2>Detailplanung</h2>
            <p className="text-secondary mb-6">
                Vollständige Unterrichtsplanung mit Phasen, Differenzierung und Plan B.
            </p>

            {error && <div className="alert alert-error mb-4">{error}</div>}

            {!plan.detailPlan && !isGenerating && (
                <div className="card card-elevated" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📝</div>
                    <h3 className="mb-2">Detailplanung generieren</h3>
                    <p className="text-secondary mb-6">
                        Basierend auf deiner freigegebenen Kurzversion erstellt die KI eine vollständige Planung.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={handleGenerate} type="button">
                        ✨ Detailplanung erstellen
                    </button>
                </div>
            )}

            {isGenerating && (
                <div className="card card-elevated" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                    <div className="spinner mb-4" role="status">
                        <span className="sr-only">Wird generiert…</span>
                    </div>
                    <h3>Detailplanung wird erstellt…</h3>
                    <div className="skeleton-block mt-6" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                </div>
            )}

            {plan.detailPlan && !isGenerating && (
                <div>
                    {/* Refinement UI */}
                    <div className="mb-6 flex flex-col gap-4">
                        {!showRefine ? (
                            <button
                                className="btn btn-secondary self-start"
                                onClick={() => setShowRefine(true)}
                            >
                                ✨ Mit KI anpassen
                            </button>
                        ) : (
                            <div className="card p-4 border-2 border-primary-light">
                                <h4 className="mb-2">Was möchtest du ändern?</h4>
                                <textarea
                                    className="form-input mb-2"
                                    placeholder="z.B. 'Mach den Einstieg kürzer', 'Mehr Gruppenarbeit', 'Füge ein Quiz hinzu'..."
                                    rows={2}
                                    value={refineText}
                                    onChange={e => setRefineText(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setShowRefine(false)}
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleRefine}
                                        disabled={!refineText.trim()}
                                    >
                                        Ausführen
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quality Warnings */}
                    {qualityWarnings.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-2">Qualitäts-Checks</h3>
                            {qualityWarnings.map((w, i) => (
                                <div key={i} className={`alert alert-${w.severity} mb-2`}>
                                    <div>
                                        <strong>{w.message}</strong>
                                        {w.suggestion && <p className="text-sm mt-1">{w.suggestion}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Didactic Diagnosis (Block L) */}
                    {plan.detailPlan.didacticDiagnosis && (
                        <div className="card mb-6 border-l-4 border-accent">
                            <h3 className="mb-4">🎓 Didaktische Diagnose</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="form-label">Schwellenkonzept (Threshold Concept)</span>
                                    <p className="font-medium text-lg text-primary">{plan.detailPlan.didacticDiagnosis.thresholdConcept}</p>
                                </div>
                                <div>
                                    <span className="form-label">Relevanz für Lebenswelt</span>
                                    <p>{plan.detailPlan.didacticDiagnosis.relevance}</p>
                                </div>
                                <div className="col-span-2 mt-2">
                                    <span className="form-label">Typische Fehlvorstellungen</span>
                                    <ul className="list-disc pl-5">
                                        {plan.detailPlan.didacticDiagnosis.misconceptions.map((m, i) => (
                                            <li key={i} className="text-error">{m}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phases */}
                    {plan.detailPlan.phases.map((phase, i) => (
                        <div key={phase.id} className="detail-phase-card mb-4">
                            <div className="detail-phase-header">
                                <div className="detail-phase-title">
                                    <span className="detail-phase-number">{i + 1}</span>
                                    <h3>{phase.name}</h3>
                                </div>
                                <span className="badge badge-draft text-mono">{phase.durationMinutes} Min</span>
                            </div>

                            <p className="mb-4">{phase.description}</p>

                            <div className="detail-grid">
                                <div className="detail-cell">
                                    <span className="form-label">Lehrperson</span>
                                    <p className="text-sm">{phase.teacherActions}</p>
                                </div>
                                <div className="detail-cell">
                                    <span className="form-label">SuS-Aktivität</span>
                                    <p className="text-sm">{phase.childActions}</p>
                                </div>
                                <div className="detail-cell">
                                    <span className="form-label">Sozialform</span>
                                    <p className="text-sm">{phase.socialForm}</p>
                                </div>
                                <div className="detail-cell">
                                    <span className="form-label">Material</span>
                                    <p className="text-sm">{phase.materials?.join(', ')}</p>
                                </div>
                            </div>

                            {/* Differentiation */}
                            <div className="diff-levels mt-4">
                                <div className="diff-level diff-level-a">
                                    <span className="diff-level-label">A — Basis</span>
                                    <p className="text-sm">{phase.differentiation.niveauA}</p>
                                </div>
                                <div className="diff-level diff-level-b">
                                    <span className="diff-level-label">B — Standard</span>
                                    <p className="text-sm">{phase.differentiation.niveauB}</p>
                                </div>
                                <div className="diff-level diff-level-c">
                                    <span className="diff-level-label">C — Challenge</span>
                                    <p className="text-sm">{phase.differentiation.niveauC}</p>
                                </div>
                            </div>

                            {/* Plan B */}
                            {phase.planBAlternative && (
                                <div className="plan-b mt-4">
                                    <span className="form-label">🔄 Plan B</span>
                                    <p className="text-sm">{phase.planBAlternative}</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Assessment Rubric (Block L) */}
                    {plan.detailPlan.assessmentRubric && (
                        <div className="mt-8">
                            <h3 className="mb-4">📊 Bewertungsraster (Lernprodukt)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-left">
                                            <th className="p-2 border">Kriterium</th>
                                            <th className="p-2 border">Niveau A (Basis)</th>
                                            <th className="p-2 border">Niveau B (Standard)</th>
                                            <th className="p-2 border">Niveau C (Challenge)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.detailPlan.assessmentRubric.map((r, i) => (
                                            <tr key={i} className="border-b">
                                                <td className="p-2 border font-medium">{r.criteria}</td>
                                                <td className="p-2 border">{r.levelA}</td>
                                                <td className="p-2 border">{r.levelB}</td>
                                                <td className="p-2 border">{r.levelC}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Reflection Notes */}
                    {plan.detailPlan.reflectionNotes && (
                        <div className="card mt-4">
                            <h3 className="mb-2">📝 Reflexionsnotiz</h3>
                            <p className="text-secondary">{plan.detailPlan.reflectionNotes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
