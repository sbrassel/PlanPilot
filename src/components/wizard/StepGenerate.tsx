'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import { generateSequenceSkeleton, generateShortVersion } from '@/lib/mock-ai';
import { generateLessonPlan } from '@/lib/ai';
import { ShortVersion, SequenceSkeleton } from '@/lib/types';

export default function StepGenerate() {
    const { plan, setShortVersion, setSequenceSkeleton, isGenerating, setGenerating, setAbortController, cancelGeneration } = usePlanStore();
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        const controller = new AbortController();
        setAbortController(controller);
        setGenerating(true);
        setError(null);

        try {
            if (plan.mode === 'sequence') {
                const skeleton = await generateLessonPlan(plan, 'sequence', controller.signal) as SequenceSkeleton;
                setSequenceSkeleton(skeleton);
                // Derive a synthetic short version from the skeleton instead of a second API call
                const syntheticSv: ShortVersion = {
                    title: plan.title || plan.subject,
                    overview: skeleton.progression,
                    goals: skeleton.overallGoals,
                    phasesSummary: skeleton.lessons.map(l => ({
                        name: `Lektion ${l.lessonNumber}: ${l.title}`,
                        durationMinutes: l.durationMinutes,
                        description: l.focus,
                    })),
                    differentiationSummary: {
                        niveauA: 'Scaffolding und Hilfsstrukturen für alle Lektionen.',
                        niveauB: 'Standardausführung gemäss Sequenzplanung.',
                        niveauC: 'Erweiterte Aufgaben und Vertiefung.',
                    },
                };
                setShortVersion(syntheticSv);
            } else {
                const sv = await generateLessonPlan(plan, 'short', controller.signal) as ShortVersion;
                setShortVersion(sv);
            }
        } catch (e) {
            // Don't show error if user cancelled
            if (e instanceof DOMException && e.name === 'AbortError') {
                return;
            }
            console.error('AI Error, using fallback:', e);
            if (plan.mode === 'sequence') {
                const fallbackSkeleton = await generateSequenceSkeleton(plan);
                setSequenceSkeleton(fallbackSkeleton);
            }
            const fallbackSv = await generateShortVersion(plan);
            setShortVersion(fallbackSv);
            setError('Hinweis: KI nicht verfügbar. Ein Entwurf wurde mit der lokalen Vorlage erstellt — passe ihn in Gate A an.');
        } finally {
            setGenerating(false);
            setAbortController(null);
        }
    };

    const handleCancel = () => {
        cancelGeneration();
    };

    const hasGenerated = plan.shortVersion !== null;

    return (
        <div className="step-content-area">
            <h2>{plan.mode === 'sequence' ? 'Sequenz-Skelett & Kurzversion' : 'KI-Kurzversion'}</h2>
            <p className="text-secondary mb-6">
                Die KI erstellt basierend auf deinen Angaben eine {plan.mode === 'sequence' ? 'Sequenzübersicht und ' : ''}Kurzversion.
            </p>

            {error && (
                <div className="alert alert-warning mb-4">{error}</div>
            )}

            {!hasGenerated && !isGenerating && (
                <div className="generate-cta">
                    <div className="card card-elevated" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>🤖</div>
                        <h3 className="mb-2">Bereit zur Generierung</h3>
                        <p className="text-secondary mb-6">
                            Basierend auf: {plan.subject || 'k.A.'} · {plan.durationMinutes} Min · {plan.level || 'k.A.'}
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleGenerate}
                            type="button"
                        >
                            ✨ Kurzversion generieren
                        </button>
                    </div>
                </div>
            )}

            {isGenerating && (
                <div className="generating-state">
                    <div className="card card-elevated" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                        <div className="spinner mb-4" aria-live="polite" role="status">
                            <span className="sr-only">Wird generiert…</span>
                        </div>
                        <h3 className="mb-2">KI arbeitet…</h3>
                        <p className="text-secondary">
                            Die Kurzversion wird erstellt. Das dauert einige Sekunden.
                        </p>
                        <div className="skeleton-block mt-6" />
                        <div className="skeleton-block" />
                        <div className="skeleton-text" style={{ width: '70%', margin: '0 auto' }} />
                        <button
                            className="btn btn-ghost mt-4"
                            onClick={handleCancel}
                            type="button"
                        >
                            ✕ Abbrechen
                        </button>
                    </div>
                </div>
            )}

            {hasGenerated && !isGenerating && (
                <div className="generate-done">
                    <div className="alert alert-success mb-4">
                        ✅ Kurzversion wurde erstellt! Sieh dir die Vorschau rechts an.
                    </div>
                    <div className="card">
                        <h3 className="mb-4">{plan.shortVersion?.title}</h3>
                        <p className="text-secondary">{plan.shortVersion?.overview}</p>

                        <div className="mt-4">
                            <h4 className="mb-2">Phasen</h4>
                            {plan.shortVersion?.phasesSummary.map((phase, i) => (
                                <div key={i} className="phase-summary-item">
                                    <span className="phase-name">{phase.name}</span>
                                    <span className="phase-time text-mono">{phase.durationMinutes} Min</span>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-secondary mt-4"
                            onClick={handleGenerate}
                            type="button"
                        >
                            🔄 Neu generieren
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
