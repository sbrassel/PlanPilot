'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import { generateLessonPlan } from '@/lib/ai';
import { generateDetailPlan, refineDetailPlan } from '@/lib/mock-ai';
import { DetailPlan } from '@/lib/types';
import { runQualityChecks } from '@/lib/quality-checks';

function formatScriptText(text?: string) {
    if (!text) return '';
    // Replace guillemets with styled spans or just keep line breaks
    // For now, simple line break preservation is key
    return text.split('\n').map((line, i) => (
        <span key={i} className="block mb-1">
            {line.includes('«') ? (
                <span className="text-primary-dark font-medium">{line}</span>
            ) : (
                line
            )}
        </span>
    ));
}

export default function StepDetail() {
    const { plan, setDetailPlan, isGenerating, setGenerating, setAbortController, cancelGeneration } = usePlanStore();
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
        const controller = new AbortController();
        setAbortController(controller);
        setGenerating(true);
        setError(null);

        try {
            const dp = await generateLessonPlan(plan, 'detail', controller.signal) as DetailPlan;
            setDetailPlan(dp);
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') {
                return;
            }
            console.error('AI Error, using fallback:', e);
            const fallbackPlan = await generateDetailPlan(plan);
            setDetailPlan(fallbackPlan);
            setError('KI nicht verfügbar. Ein strukturierter Plan wurde mit der lokalen Vorlage erstellt — du kannst ihn unten anpassen.');
        } finally {
            setGenerating(false);
            setAbortController(null);
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
            <h2>Detailplanung (Pfannenfertig)</h2>
            <p className="text-secondary mb-6">
                Vollständiges Drehbuch für deinen Unterricht.
            </p>

            {error && <div className="alert alert-error mb-4">{error}</div>}

            {!plan.detailPlan && !isGenerating && (
                <div className="card card-elevated" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                    <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📝</div>
                    <h3 className="mb-2">Detailplanung generieren</h3>
                    <p className="text-secondary mb-6">
                        Basierend auf deiner freigegebenen Kurzversion erstellt die KI ein präzises Drehbuch.
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={handleGenerate} type="button">
                        ✨ Drehbuch erstellen
                    </button>
                </div>
            )}

            {isGenerating && (
                <div className="card card-elevated" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                    <div className="spinner mb-4" role="status">
                        <span className="sr-only">Wird generiert…</span>
                    </div>
                    <h3>Drehbuch wird geschrieben…</h3>
                    <div className="skeleton-block mt-6" />
                    <div className="skeleton-block" />
                    <div className="skeleton-block" />
                    <button
                        className="btn btn-ghost mt-4"
                        onClick={cancelGeneration}
                        type="button"
                    >
                        ✕ Abbrechen
                    </button>
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

                    {/* Didactic Diagnosis */}
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
                        <div key={phase.id} className="detail-phase-card mb-4 p-6 border rounded-lg shadow-sm bg-white">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">{i + 1}</span>
                                    <h3 className="m-0 text-xl font-semibold">{phase.name}</h3>
                                </div>
                                <span className="bg-gray-100 px-3 py-1 rounded text-mono font-bold text-lg">{phase.durationMinutes} Min</span>
                            </div>

                            <p className="mb-6 italic text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                                "{phase.description}"
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <span className="form-label text-blue-800 block mb-2">👩‍🏫 Lehrperson (Script)</span>
                                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                                        {formatScriptText(phase.teacherActions)}
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <span className="form-label text-green-800 block mb-2">🧑‍🎓 Schüler:innen</span>
                                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                                        {formatScriptText(phase.childActions)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 border-t pt-4 text-gray-600">
                                <div>
                                    <span className="font-bold block text-gray-500 text-xs uppercase tracking-wider">Sozialform</span>
                                    {phase.socialForm}
                                </div>
                                <div className="col-span-2">
                                    <span className="font-bold block text-gray-500 text-xs uppercase tracking-wider">Material</span>
                                    {phase.materials?.join(', ')}
                                </div>
                                <div>
                                    <span className="font-bold block text-gray-500 text-xs uppercase tracking-wider">Methodik</span>
                                    {phase.didacticComment || 'k.A.'}
                                </div>
                            </div>

                            {/* Differentiation */}
                            <div className="mt-6 bg-gray-50 p-4 rounded border border-gray-200">
                                <h4 className="text-sm font-bold uppercase text-gray-500 mb-3 tracking-wider">Differenzierung</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-sm border-l-2 border-yellow-400 pl-3">
                                        <span className="block font-bold text-gray-700">Basis (A)</span>
                                        {phase.differentiation.niveauA}
                                    </div>
                                    <div className="text-sm border-l-2 border-blue-400 pl-3">
                                        <span className="block font-bold text-gray-700">Standard (B)</span>
                                        {phase.differentiation.niveauB}
                                    </div>
                                    <div className="text-sm border-l-2 border-purple-400 pl-3">
                                        <span className="block font-bold text-gray-700">Challenge (C)</span>
                                        {phase.differentiation.niveauC}
                                    </div>
                                </div>
                            </div>

                            {/* Plan B */}
                            {phase.planBAlternative && (
                                <div className="mt-4 text-sm text-gray-500 flex gap-2 items-center bg-gray-100 p-2 rounded">
                                    <span className="font-bold">🔄 Plan B:</span>
                                    {phase.planBAlternative}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Assessment Rubric */}
                    {plan.detailPlan.assessmentRubric && (
                        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="mb-4 text-xl font-bold">📊 Bewertungsraster</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-left">
                                            <th className="p-3 border font-bold">Kriterium</th>
                                            <th className="p-3 border font-bold text-yellow-700 bg-yellow-50">Niveau A</th>
                                            <th className="p-3 border font-bold text-blue-700 bg-blue-50">Niveau B</th>
                                            <th className="p-3 border font-bold text-purple-700 bg-purple-50">Niveau C</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.detailPlan.assessmentRubric.map((r, i) => (
                                            <tr key={i} className="border-b hover:bg-gray-50">
                                                <td className="p-3 border font-medium">{r.criteria}</td>
                                                <td className="p-3 border bg-yellow-50/30">{r.levelA}</td>
                                                <td className="p-3 border bg-blue-50/30">{r.levelB}</td>
                                                <td className="p-3 border bg-purple-50/30">{r.levelC}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Reflection */}
                    {plan.detailPlan.reflectionNotes && (
                        <div className="card mt-8 bg-indigo-50 border-indigo-100">
                            <h3 className="mb-2 text-indigo-900">📝 Reflexionsfragen</h3>
                            <p className="text-indigo-800 whitespace-pre-wrap">{plan.detailPlan.reflectionNotes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
