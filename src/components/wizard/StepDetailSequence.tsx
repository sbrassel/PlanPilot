'use client';

import { useCallback } from 'react';
import { usePlanStore } from '@/lib/store';
import { generateLessonPlan } from '@/lib/ai';
import { runQualityChecks } from '@/lib/quality-checks';
import { DetailPlan } from '@/lib/types';
import { generateSequenceSkeleton } from '@/lib/mock-ai';

export default function StepDetailSequence() {
    const { plan, setLessonDetail, lessonGeneratingIndex, setLessonGeneratingIndex } = usePlanStore();
    const skeleton = plan.sequenceSkeleton;

    const handleGenerateLesson = useCallback(async (index: number) => {
        if (!skeleton) return;
        setLessonGeneratingIndex(index);
        try {
            // Create a temporary plan context for this specific lesson
            const lesson = skeleton.lessons[index];
            const lessonContext = {
                ...plan,
                title: lesson.title,
                topicDescription: `${plan.topicDescription || plan.subject} — Lektion ${index + 1}: ${lesson.focus}`,
                durationMinutes: lesson.durationMinutes,
                goals: lesson.goals
            };

            const detail = await generateLessonPlan(lessonContext, 'detail') as DetailPlan;
            setLessonDetail(index, detail);
        } catch (err) {
            console.error('Failed to generate lesson detail', err);
        }
        setLessonGeneratingIndex(null);
    }, [plan, skeleton, setLessonDetail, setLessonGeneratingIndex]);

    const handleGenerateAll = useCallback(async () => {
        if (!skeleton) return;
        for (let i = 0; i < skeleton.lessons.length; i++) {
            if (!skeleton.lessons[i].detailPlan) {
                setLessonGeneratingIndex(i);
                try {
                    const lesson = skeleton.lessons[i];
                    const lessonContext = {
                        ...plan,
                        title: lesson.title,
                        topicDescription: `${plan.topicDescription || plan.subject} — Lektion ${i + 1}: ${lesson.focus}`,
                        durationMinutes: lesson.durationMinutes,
                        goals: lesson.goals
                    };

                    const detail = await generateLessonPlan(lessonContext, 'detail') as DetailPlan;
                    setLessonDetail(i, detail);
                } catch (err) {
                    console.error(`Failed to generate lesson ${i}`, err);
                }
            }
        }
        setLessonGeneratingIndex(null);
    }, [skeleton, plan, setLessonDetail, setLessonGeneratingIndex]);

    if (!skeleton) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">Kein Sequenz-Skelett vorhanden.</p>
                <p className="text-secondary text-sm mb-4">Das Skelett wurde in Schritt 4 nicht korrekt gespeichert.</p>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                        Seite neu laden
                    </button>
                    <button className="btn btn-warning" onClick={async () => {
                        const skel = await generateSequenceSkeleton(plan);
                        const { setSequenceSkeleton } = usePlanStore.getState();
                        setSequenceSkeleton(skel);
                    }}>
                        🛠 Skelett reparieren
                    </button>
                </div>
            </div>
        );
    }

    const completedCount = skeleton.lessons.filter(l => l.detailPlan).length;
    const totalCount = skeleton.lessons.length;
    const warnings = plan.detailPlan ? runQualityChecks(plan) : [];

    return (
        <div>
            <h2>Detailplanung — Sequenz</h2>
            <p className="text-secondary mb-4">
                Generieren Sie die Detailplanung für jede Lektion einzeln oder alle auf einmal.
            </p>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{completedCount}/{totalCount} Lektionen detailliert</span>
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={handleGenerateAll}
                        disabled={lessonGeneratingIndex !== null || completedCount === totalCount}
                    >
                        {completedCount === totalCount ? '✅ Alle fertig' : '🚀 Alle generieren'}
                    </button>
                </div>
                <div className="sequence-progress-bar">
                    <div className="sequence-progress-fill" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                </div>
            </div>

            {/* Quality warnings */}
            {warnings.length > 0 && (
                <div className="mb-4">
                    {warnings.map((w, i) => (
                        <div key={i} className={`alert alert-${w.severity === 'error' ? 'error' : w.severity === 'warning' ? 'warning' : 'info'} mb-2`}>
                            <span>{w.severity === 'error' ? '🚫' : w.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            <div>
                                <strong>{w.message}</strong>
                                {w.suggestion && <p className="text-xs mt-1">{w.suggestion}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lesson accordion */}
            <div className="flex flex-col gap-3">
                {skeleton.lessons.map((lesson, index) => (
                    <details key={lesson.id} className="lesson-accordion card" open={index === (lessonGeneratingIndex ?? completedCount)}>
                        <summary className="lesson-accordion-header">
                            <div className="flex items-center gap-3" style={{ flex: 1 }}>
                                <span className={`lesson-number ${lesson.detailPlan ? 'completed' : ''}`}>
                                    {lesson.detailPlan ? '✓' : lesson.lessonNumber}
                                </span>
                                <div>
                                    <strong className="text-sm">{lesson.title}</strong>
                                    <p className="text-xs text-tertiary">{lesson.focus} · {lesson.durationMinutes} Min</p>
                                </div>
                            </div>
                            {lesson.intermediateCheck && (
                                <span className="badge badge-edited" style={{ marginRight: 'var(--space-3)' }}>
                                    📋 Zwischencheck
                                </span>
                            )}
                        </summary>

                        <div className="lesson-accordion-content">
                            {/* Goals */}
                            <div className="mb-3">
                                <span className="text-xs text-tertiary" style={{ textTransform: 'uppercase', fontWeight: 600 }}>Ziele</span>
                                <ul style={{ marginTop: 'var(--space-1)', paddingLeft: 'var(--space-5)' }}>
                                    {lesson.goals.map((g, gi) => (
                                        <li key={gi} className="text-sm">{g}</li>
                                    ))}
                                </ul>
                            </div>

                            {lesson.intermediateCheck && (
                                <div className="alert alert-info mb-3">
                                    <span>📋</span>
                                    <span>{lesson.intermediateCheck}</span>
                                </div>
                            )}

                            {/* Generate or show detail */}
                            {!lesson.detailPlan && (
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => handleGenerateLesson(index)}
                                    disabled={lessonGeneratingIndex !== null}
                                >
                                    {lessonGeneratingIndex === index ? (
                                        <>
                                            <span className="generating-spinner" />
                                            Detailplanung wird generiert…
                                        </>
                                    ) : (
                                        '✨ Detailplanung generieren'
                                    )}
                                </button>
                            )}

                            {lesson.detailPlan && (
                                <div className="flex flex-col gap-3">
                                    {lesson.detailPlan.phases.map(phase => (
                                        <div key={phase.id} className="detail-phase-card">
                                            <div className="detail-phase-header">
                                                <strong>{phase.name}</strong>
                                                <span className="badge badge-draft">{phase.durationMinutes} Min</span>
                                            </div>
                                            <p className="text-sm mb-2">{phase.description}</p>

                                            {phase.socialForm && (
                                                <span className="badge badge-generated mb-2">{phase.socialForm}</span>
                                            )}

                                            {/* Differentiation */}
                                            <div className="diff-levels mt-2">
                                                <div className="diff-level diff-level-a">
                                                    <span className="diff-level-label">A Basis</span>
                                                    <p className="text-xs">{phase.differentiation.niveauA}</p>
                                                </div>
                                                <div className="diff-level diff-level-b">
                                                    <span className="diff-level-label">B Standard</span>
                                                    <p className="text-xs">{phase.differentiation.niveauB}</p>
                                                </div>
                                                <div className="diff-level diff-level-c">
                                                    <span className="diff-level-label">C Challenge</span>
                                                    <p className="text-xs">{phase.differentiation.niveauC}</p>
                                                </div>
                                            </div>

                                            {/* Language supports */}
                                            {phase.differentiation.sentenceStarters && (
                                                <div className="mt-2">
                                                    <span className="text-xs text-tertiary" style={{ fontWeight: 600 }}>Satzstarter:</span>
                                                    <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                                                        {phase.differentiation.sentenceStarters.map((s, si) => (
                                                            <span key={si} className="pill" style={{ fontSize: 'var(--text-xs)', padding: '2px var(--space-2)', cursor: 'default' }}>
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}
