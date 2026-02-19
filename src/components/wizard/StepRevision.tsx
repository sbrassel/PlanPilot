'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import { reviseLessonPlan } from '@/lib/ai';

export default function StepRevision() {
    const { plan, setShortVersion, editedShortVersion, isGenerating, setGenerating } = usePlanStore();
    const [error, setError] = useState<string | null>(null);

    const hasEdits = editedShortVersion && plan.shortVersion &&
        JSON.stringify(editedShortVersion) !== JSON.stringify(plan.shortVersion);

    const handleRevise = async () => {
        setGenerating(true);
        setError(null);

        try {
            if (!plan.shortVersion || !editedShortVersion) return;

            // Send edited version to real AI for intelligent revision
            const revised = await reviseLessonPlan(
                plan,
                editedShortVersion,
                'Überarbeite die Kurzversion basierend auf den Änderungen der Lehrperson. Verbessere Formulierungen und Kohärenz.'
            );

            setShortVersion(revised);
            usePlanStore.getState().updatePlan({ status: 'revised' });
        } catch {
            setError('Fehler bei der Überarbeitung. Bitte versuche es erneut.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="step-content-area">
            <h2>KI-Überarbeitung</h2>
            <p className="text-secondary mb-6">
                Die KI überarbeitet die Kurzversion basierend auf deinen Änderungen.
            </p>

            {error && (
                <div className="alert alert-error mb-4">{error}</div>
            )}

            {hasEdits ? (
                <div>
                    <div className="alert alert-info mb-4">
                        Du hast Änderungen an der Kurzversion vorgenommen. Die KI kann diese in eine überarbeitete Version einarbeiten.
                    </div>

                    {isGenerating ? (
                        <div className="card card-elevated" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                            <div className="spinner mb-4" aria-live="polite" role="status">
                                <span className="sr-only">Wird überarbeitet…</span>
                            </div>
                            <h3 className="mb-2">KI überarbeitet…</h3>
                            <div className="skeleton-block mt-6" />
                            <div className="skeleton-block" />
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleRevise}
                            type="button"
                        >
                            🔄 Kurzversion überarbeiten
                        </button>
                    )}
                </div>
            ) : (
                <div className="alert alert-info">
                    Keine Änderungen erkannt. Du kannst direkt zur Freigabe weitergehen.
                </div>
            )}

            {plan.status === 'revised' && (
                <div className="alert alert-success mt-4">
                    ✅ Überarbeitung abgeschlossen. Prüfe die Vorschau rechts und gehe zur Freigabe.
                </div>
            )}
        </div>
    );
}
