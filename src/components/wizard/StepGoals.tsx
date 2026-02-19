'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import { generateLearningGoals } from '@/lib/mock-ai';
import { generateLessonPlan } from '@/lib/ai';
import { ShortVersion } from '@/lib/types';
import CurriculumMapper from '@/components/curriculum/CurriculumMapper';
import CurriculumUpload from '@/components/curriculum/CurriculumUpload';

export default function StepGoals() {
    const { plan, addGoal, updateGoal, removeGoal, setGoals, setShortVersion, validationErrors } = usePlanStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateGoals = async () => {
        setIsGenerating(true);
        try {
            const result = await generateLessonPlan(plan, 'short') as ShortVersion;
            setShortVersion(result);
            setGoals(result.goals);
        } catch (e) {
            console.error('AI Error, using smart fallback:', e);
            const fallbackGoals = generateLearningGoals(plan);
            setGoals(fallbackGoals);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="step-content-area">
            <h2>Lernziele &amp; Lehrplan</h2>
            <p className="text-secondary mb-6">Definiere die Lernziele und ordne Lehrplan-Kompetenzen zu.</p>

            {validationErrors.length > 0 && (
                <div className="alert alert-error mb-4">
                    <div>
                        {validationErrors.map((e, i) => <div key={i}>{e}</div>)}
                    </div>
                </div>
            )}

            {/* Goals */}
            <div className="form-group mb-6">
                <label className="form-label">Lernziele</label>
                <div className="goals-list">
                    {plan.goals.map((goal, i) => (
                        <div key={i} className="goal-item">
                            <span className="goal-number">{i + 1}</span>
                            <input
                                className="form-input"
                                type="text"
                                value={goal}
                                onChange={e => updateGoal(i, e.target.value)}
                                placeholder={`Lernziel ${i + 1}…`}
                                aria-label={`Lernziel ${i + 1}`}
                            />
                            {plan.goals.length > 1 && (
                                <button
                                    className="btn btn-ghost btn-sm btn-icon"
                                    onClick={() => removeGoal(i)}
                                    type="button"
                                    aria-label={`Lernziel ${i + 1} entfernen`}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mt-2">
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={addGoal}
                        type="button"
                    >
                        + Manuell hinzufügen
                    </button>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleGenerateGoals}
                        disabled={isGenerating || (!plan.subject && !plan.topicDescription)}
                        type="button"
                    >
                        {isGenerating ? 'Generiere...' : '✨ KI-Vorschlag für Lernziele'}
                    </button>
                </div>
            </div>

            {/* Curriculum Mapping */}
            <div className="card mb-6">
                <h3 className="mb-4">Lehrplan 21 — Kompetenz-Mapping</h3>
                <CurriculumMapper />
            </div>

            {/* Custom Upload */}
            <div className="card">
                <CurriculumUpload />
            </div>
        </div >
    );
}
