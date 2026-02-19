'use client';

import { useState } from 'react';
import { usePlanStore } from '@/lib/store';
import type { ShortVersion } from '@/lib/types';
import { reviseLessonPlan } from '@/lib/ai';

export default function StepGateA() {
    const { plan, editedShortVersion, setEditedShortVersion, approveGateA } = usePlanStore();
    const [showDiff, setShowDiff] = useState(false);

    // Chat / Edit Mode State
    const [editMode, setEditMode] = useState<'direct' | 'chat'>('chat'); // Default to chat as requested
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);
    const [isRevising, setIsRevising] = useState(false);

    const sv = plan.shortVersion;
    const edited = editedShortVersion;

    if (!sv || !edited) {
        return (
            <div className="step-content-area">
                <h2>Anpassen (Gate A)</h2>
                <div className="alert alert-warning">
                    Bitte generiere zuerst eine Kurzversion (Schritt 4).
                </div>
            </div>
        );
    }

    const handleOverviewChange = (value: string) => {
        setEditedShortVersion({ ...edited, overview: value });
    };

    const handleGoalChange = (index: number, value: string) => {
        const newGoals = [...edited.goals];
        newGoals[index] = value;
        setEditedShortVersion({ ...edited, goals: newGoals });
    };

    const handlePhaseChange = (index: number, field: 'name' | 'description' | 'durationMinutes', value: string | number) => {
        const newPhases = [...edited.phasesSummary];
        newPhases[index] = { ...newPhases[index], [field]: value };
        setEditedShortVersion({ ...edited, phasesSummary: newPhases });
    };

    const handleApprove = () => {
        approveGateA();
    };

    const handleChatSubmit = async () => {
        if (!chatInput.trim() || !edited) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsRevising(true);

        try {
            const revised = await reviseLessonPlan(plan, edited, userMsg);
            setEditedShortVersion(revised);
            setChatHistory(prev => [...prev, { role: 'ai', text: 'Ich habe den Plan entsprechend angepasst. Überprüfe die Änderungen unten.' }]);
        } catch (error) {
            console.error(error);
            setChatHistory(prev => [...prev, { role: 'ai', text: 'Entschuldigung, da ist etwas schiefgelaufen.' }]);
        } finally {
            setIsRevising(false);
        }
    };

    const hasChanges = JSON.stringify(sv) !== JSON.stringify(edited);

    return (
        <div className="step-content-area">
            <div className="gate-header">
                <h2>🔒 Anpassungs-Gate A</h2>
                <span className={`badge ${plan.gateAApproved ? 'badge-approved' : hasChanges ? 'badge-edited' : 'badge-draft'}`}>
                    {plan.gateAApproved ? 'Freigegeben' : hasChanges ? 'Bearbeitet' : 'Entwurf'}
                </span>
            </div>
            <p className="text-secondary mb-6">
                Passe die KI-Kurzversion an deine Bedürfnisse an. Du kannst Texte, Ziele und Phasen bearbeiten.
            </p>

            {/* Diff Toggle */}
            <div className="mb-4">
                <button
                    className={`btn ${showDiff ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setShowDiff(!showDiff)}
                    type="button"
                >
                    {showDiff ? '✏️ Editor' : '📊 Diff anzeigen'}
                </button>
            </div>

            {showDiff ? (
                <DiffView original={sv} edited={edited} />
            ) : (
                <div className="gate-editor-container">
                    {/* Mode Toggle */}
                    <div className="editor-mode-toggle mb-6">
                        <button
                            className={`mode-btn ${editMode === 'chat' ? 'active' : ''}`}
                            onClick={() => setEditMode('chat')}
                        >
                            💬 Mit AI anpassen
                        </button>
                        <button
                            className={`mode-btn ${editMode === 'direct' ? 'active' : ''}`}
                            onClick={() => setEditMode('direct')}
                        >
                            ✏️ Direkt bearbeiten
                        </button>
                    </div>

                    {editMode === 'chat' ? (
                        <div className="chat-interface card p-4">
                            <div className="chat-history mb-4" style={{ minHeight: '150px', maxHeight: '300px', overflowY: 'auto' }}>
                                <div className="chat-message ai-message">
                                    Hallo! Wie kann ich die Kurzversion für dich anpassen? (z.B. "Kürze die Einstiegsphase", "Füge ein Ziel hinzu")
                                </div>
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`chat-message ${msg.role}-message mt-3`}>
                                        {msg.text}
                                    </div>
                                ))}
                                {isRevising && (
                                    <div className="chat-message ai-message mt-3">
                                        <span className="generating-spinner" style={{ width: '16px', height: '16px', borderTopColor: '#6366f1' }} />
                                        &nbsp; Denke nach...
                                    </div>
                                )}
                            </div>
                            <div className="chat-input-row" style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Deine Änderungswünsche..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    disabled={isRevising}
                                    onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleChatSubmit}
                                    disabled={isRevising || !chatInput.trim()}
                                >
                                    Senden
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="gate-editor">
                            {/* Title */}
                            <div className="form-group mb-4">
                                <label className="form-label">Titel</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={edited.title}
                                    onChange={e => setEditedShortVersion({ ...edited, title: e.target.value })}
                                />
                            </div>

                            {/* Overview */}
                            <div className="form-group mb-4">
                                <label className="form-label">Überblick</label>
                                <textarea
                                    className="form-textarea"
                                    value={edited.overview}
                                    onChange={e => handleOverviewChange(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            {/* Goals */}
                            <div className="form-group mb-4">
                                <label className="form-label">Lernziele</label>
                                {edited.goals.map((goal, i) => (
                                    <div key={i} className="goal-item mb-2">
                                        <span className="goal-number">{i + 1}</span>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={goal}
                                            onChange={e => handleGoalChange(i, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Phases */}
                            <div className="form-group mb-4">
                                <label className="form-label">Phasen</label>
                                {edited.phasesSummary.map((phase, i) => (
                                    <div key={i} className="card mb-2" style={{ padding: 'var(--space-3)' }}>
                                        <div className="form-row">
                                            <input
                                                className="form-input"
                                                type="text"
                                                value={phase.name}
                                                onChange={e => handlePhaseChange(i, 'name', e.target.value)}
                                                style={{ flex: 2 }}
                                            />
                                            <input
                                                className="form-input text-mono"
                                                type="number"
                                                value={phase.durationMinutes}
                                                onChange={e => handlePhaseChange(i, 'durationMinutes', parseInt(e.target.value) || 0)}
                                                style={{ width: '80px' }}
                                            />
                                        </div>
                                        <textarea
                                            className="form-textarea mt-2"
                                            value={phase.description}
                                            onChange={e => handlePhaseChange(i, 'description', e.target.value)}
                                            rows={2}
                                            style={{ minHeight: '60px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Approve Gate */}
            <div className="gate-actions mt-6">
                <button
                    className="btn btn-success btn-lg"
                    onClick={handleApprove}
                    type="button"
                >
                    ✅ Kurzversion bestätigen
                </button>
                <span className="text-sm text-secondary">
                    {hasChanges ? 'Du hast Änderungen vorgenommen.' : 'Keine Änderungen.'}
                </span>
            </div>
        </div>
    );
}

function DiffView({ original, edited }: { original: ShortVersion; edited: ShortVersion }) {
    const changes: Array<{ field: string; from: string; to: string }> = [];

    if (original.title !== edited.title) {
        changes.push({ field: 'Titel', from: original.title, to: edited.title });
    }
    if (original.overview !== edited.overview) {
        changes.push({ field: 'Überblick', from: original.overview, to: edited.overview });
    }
    // Goals: detect changes, additions, and removals
    const maxGoals = Math.max(original.goals.length, edited.goals.length);
    for (let i = 0; i < maxGoals; i++) {
        const orig = original.goals[i];
        const edit = edited.goals[i];
        if (orig && edit && orig !== edit) {
            changes.push({ field: `Lernziel ${i + 1}`, from: orig, to: edit });
        } else if (orig && !edit) {
            changes.push({ field: `Lernziel ${i + 1}`, from: orig, to: '(entfernt)' });
        } else if (!orig && edit) {
            changes.push({ field: `Lernziel ${i + 1} (neu)`, from: '(leer)', to: edit });
        }
    }
    original.phasesSummary.forEach((p, i) => {
        const ep = edited.phasesSummary[i];
        if (ep && (p.name !== ep.name || p.description !== ep.description || p.durationMinutes !== ep.durationMinutes)) {
            changes.push({
                field: `Phase: ${p.name}`,
                from: `${p.name} (${p.durationMinutes} Min): ${p.description}`,
                to: `${ep.name} (${ep.durationMinutes} Min): ${ep.description}`,
            });
        }
    });

    if (changes.length === 0) {
        return (
            <div className="alert alert-info">
                Keine Änderungen vorgenommen.
            </div>
        );
    }

    return (
        <div className="diff-container">
            {changes.map((c, i) => (
                <div key={i} className="diff-section">
                    <div className="diff-field-label">{c.field}</div>
                    <div className="diff-line diff-removed">− {c.from}</div>
                    <div className="diff-line diff-added">+ {c.to}</div>
                </div>
            ))}
        </div>
    );
}
