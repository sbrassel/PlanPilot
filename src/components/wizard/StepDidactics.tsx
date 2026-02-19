'use client';

import { usePlanStore } from '@/lib/store';
import { STRUCTURE_MODELS, LEARNING_MODES, QUALITY_LAYERS } from '@/lib/constants';
import { checkDidacticCompatibility } from '@/lib/validation';

export default function StepDidactics() {
    const { plan, setSlot1, setSlot2, setSlot3, validationErrors } = usePlanStore();
    const { didacticSlots } = plan;
    const compat = checkDidacticCompatibility(didacticSlots);

    return (
        <div className="step-content-area">
            <h2>Didaktik-Auswahl</h2>
            <p className="text-secondary mb-6">Wähle bis zu 3 didaktische Konzepte (je eins pro Slot).</p>

            {validationErrors.length > 0 && (
                <div className="alert alert-error mb-4">
                    <div>{validationErrors.map((e, i) => <div key={i}>{e}</div>)}</div>
                </div>
            )}

            {/* Compatibility Warnings */}
            {compat.warnings.map((w, i) => (
                <div key={i} className={`alert alert-${w.severity} mb-4`}>
                    <div>
                        <strong>{w.severity === 'error' ? '❌' : '⚠️'} {w.message}</strong>
                        {w.suggestion && <p className="mt-2 text-sm">{w.suggestion}</p>}
                    </div>
                </div>
            ))}

            {/* Slot 1: Structure Model */}
            <div className="slot-section mb-6">
                <div className="slot-header">
                    <h3>
                        <span className="slot-number">1</span>
                        Strukturmodell
                    </h3>
                    {didacticSlots.slot1 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setSlot1(null)} type="button">
                            Abwählen
                        </button>
                    )}
                </div>
                <div className="slot-grid">
                    {STRUCTURE_MODELS.map(opt => (
                        <button
                            key={opt.value}
                            className={`slot-card ${didacticSlots.slot1 === opt.value ? 'slot-card-active' : ''}`}
                            onClick={() => setSlot1(didacticSlots.slot1 === opt.value ? null : opt.value)}
                            type="button"
                        >
                            <span className="slot-card-label">{opt.label}</span>
                            <span className="slot-card-desc">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Slot 2: Learning Mode */}
            <div className="slot-section mb-6">
                <div className="slot-header">
                    <h3>
                        <span className="slot-number">2</span>
                        Lernmodus
                    </h3>
                    {didacticSlots.slot2 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setSlot2(null)} type="button">
                            Abwählen
                        </button>
                    )}
                </div>
                <div className="slot-grid">
                    {LEARNING_MODES.map(opt => (
                        <button
                            key={opt.value}
                            className={`slot-card ${didacticSlots.slot2 === opt.value ? 'slot-card-active' : ''}`}
                            onClick={() => setSlot2(didacticSlots.slot2 === opt.value ? null : opt.value)}
                            type="button"
                        >
                            <span className="slot-card-label">{opt.label}</span>
                            <span className="slot-card-desc">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Slot 3: Quality Layer */}
            <div className="slot-section">
                <div className="slot-header">
                    <h3>
                        <span className="slot-number">3</span>
                        Qualitätslayer
                    </h3>
                    {didacticSlots.slot3 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setSlot3(null)} type="button">
                            Abwählen
                        </button>
                    )}
                </div>
                <div className="slot-grid">
                    {QUALITY_LAYERS.map(opt => (
                        <button
                            key={opt.value}
                            className={`slot-card ${didacticSlots.slot3 === opt.value ? 'slot-card-active' : ''}`}
                            onClick={() => setSlot3(didacticSlots.slot3 === opt.value ? null : opt.value)}
                            type="button"
                        >
                            <span className="slot-card-label">{opt.label}</span>
                            <span className="slot-card-desc">{opt.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Active count indicator */}
            <div className="slot-counter mt-6">
                <span className="text-sm text-secondary">
                    Aktive Konzepte: {[didacticSlots.slot1, didacticSlots.slot2, didacticSlots.slot3].filter(Boolean).length} / 3
                </span>
            </div>
        </div>
    );
}
