'use client';

import { usePlanStore } from '@/lib/store';
import { LEVEL_OPTIONS, DURATION_OPTIONS, LEARNING_GOAL_OPTIONS, HETEROGENEITY_OPTIONS, LANGUAGE_LEVEL_OPTIONS, MODE_OPTIONS } from '@/lib/constants';

export default function StepContext() {
    const {
        plan, setMode, setLevel, setDuration, setLearningGoalType,
        setSubject, setTopicDescription, setTitle, setClassSize, setHeterogeneity, setLanguageLevel, setSpecialNeeds,
        validationErrors,
    } = usePlanStore();

    return (
        <div className="step-content-area">
            <h2>Kontext erfassen</h2>
            <p className="text-secondary mb-6">Grundlegende Angaben zu Stufe, Fach und Klassenprofil.</p>

            {validationErrors.length > 0 && (
                <div className="alert alert-error mb-4">
                    <div>
                        {validationErrors.map((e, i) => <div key={i}>{e}</div>)}
                    </div>
                </div>
            )}

            {/* Plan Mode */}
            <div className="form-group mb-6">
                <label className="form-label">Planungstyp</label>
                <div className="mode-cards">
                    {MODE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`mode-card ${plan.mode === opt.value ? 'mode-card-active' : ''}`}
                            onClick={() => setMode(opt.value)}
                            type="button"
                        >
                            <span className="mode-card-icon">{opt.icon}</span>
                            <span className="mode-card-label">{opt.label}</span>
                            <span className="mode-card-desc">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Description (Priority 1) */}
            <div className="form-group mb-6">
                <label htmlFor="topicDescription" className="form-label">Beschreibung der Lektion</label>
                <textarea
                    id="topicDescription"
                    className={`form-input focus-ring ${validationErrors.some(e => e.includes('Beschreibung')) ? 'error' : ''}`}
                    value={plan.topicDescription}
                    onChange={e => setTopicDescription(e.target.value)}
                    placeholder="Beschreibe kurz, worum es in der Lektion gehen soll (Thema, Methode, Material...)"
                    rows={4}
                    style={{ resize: 'vertical' }}
                />
                <p className="form-hint">Dient als Basis für die KI-Vorschläge.</p>
            </div>

            {/* Title */}
            <div className="form-group mb-4">
                <label htmlFor="title" className="form-label">Titel (optional)</label>
                <input
                    id="title"
                    className="form-input"
                    type="text"
                    value={plan.title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="z.B. Brüche einführen"
                />
            </div>

            {/* Level */}
            <div className="form-group mb-4">
                <label htmlFor="level" className="form-label">Stufe</label>
                <select
                    id="level"
                    className={`form-select ${validationErrors.some(e => e.includes('Stufe')) ? 'error' : ''}`}
                    value={plan.level || ''}
                    onChange={e => setLevel(e.target.value as typeof plan.level & string)}
                >
                    <option value="">Bitte wählen…</option>
                    {LEVEL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Subject (Short Title) */}
            <div className="form-group mb-4">
                <label htmlFor="subject" className="form-label">Fach / Thema (Kurztitel)</label>
                <input
                    id="subject"
                    className={`form-input ${validationErrors.some(e => e.includes('Fach')) ? 'error' : ''}`}
                    type="text"
                    value={plan.subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="z.B. Mathematik — Gleichungen"
                />
            </div>

            {/* Duration */}
            <div className="form-group mb-4">
                <label className="form-label">Dauer</label>
                <div className="pill-group">
                    {DURATION_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`pill ${plan.durationMinutes === opt.value ? 'active' : ''}`}
                            onClick={() => setDuration(opt.value)}
                            type="button"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lesson count for sequence */}
            {plan.mode === 'sequence' && (
                <div className="form-group mb-4">
                    <label htmlFor="lessonCount" className="form-label">Anzahl Lektionen</label>
                    <input
                        id="lessonCount"
                        className="form-input"
                        type="number"
                        min={3}
                        max={12}
                        value={plan.lessonCount}
                        onChange={e => usePlanStore.getState().updatePlan({ lessonCount: parseInt(e.target.value) || 6 })}
                    />
                    <span className="form-hint">3–12 Lektionen</span>
                </div>
            )}

            {/* Learning Goal Type */}
            <div className="form-group mb-6">
                <label className="form-label">Lernzieltyp</label>
                <div className="pill-group">
                    {LEARNING_GOAL_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            className={`pill ${plan.learningGoalType === opt.value ? 'active' : ''}`}
                            onClick={() => setLearningGoalType(opt.value)}
                            type="button"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Class Profile */}
            <div className="card mb-4">
                <h3 className="mb-4">Klassenprofil</h3>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="classSize" className="form-label">Klassengrösse</label>
                        <input
                            id="classSize"
                            className="form-input"
                            type="number"
                            min={1}
                            max={35}
                            value={plan.classProfile.classSize}
                            onChange={e => setClassSize(parseInt(e.target.value) || 1)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="heterogeneity" className="form-label">Heterogenität</label>
                        <select
                            id="heterogeneity"
                            className="form-select"
                            value={plan.classProfile.heterogeneity}
                            onChange={e => setHeterogeneity(e.target.value as 'low' | 'medium' | 'high')}
                        >
                            {HETEROGENEITY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="langLevel" className="form-label">Sprachstand (∅)</label>
                        <select
                            id="langLevel"
                            className="form-select"
                            value={plan.classProfile.languageLevel}
                            onChange={e => setLanguageLevel(e.target.value)}
                        >
                            {LANGUAGE_LEVEL_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Special Needs */}
            <div className="form-group">
                <label htmlFor="specialNeeds" className="form-label">Besonderes / Bemerkungen</label>
                <textarea
                    id="specialNeeds"
                    className="form-input"
                    value={plan.specialNeeds}
                    onChange={e => setSpecialNeeds(e.target.value)}
                    placeholder="Spezielle Bedürfnisse, Raumsituation, Material, etc."
                    rows={2}
                />
            </div>
        </div>
    );
}
