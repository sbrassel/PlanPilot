'use client';

import { usePlanStore } from '@/lib/store';

export default function StepGateB() {
    const { plan, approveGateB } = usePlanStore();

    const sv = plan.shortVersion;

    if (!sv) {
        return (
            <div className="step-content-area">
                <h2>Freigabe (Gate B)</h2>
                <div className="alert alert-warning">
                    Bitte generiere und bearbeite zuerst eine Kurzversion.
                </div>
            </div>
        );
    }

    return (
        <div className="step-content-area">
            <div className="gate-header">
                <h2>🔐 Freigabe — Gate B</h2>
                <span className={`badge ${plan.gateBApproved ? 'badge-approved' : 'badge-draft'}`}>
                    {plan.gateBApproved ? 'Freigegeben ✅' : 'Ausstehend'}
                </span>
            </div>
            <p className="text-secondary mb-6">
                Prüfe die finale Kurzversion und gib sie frei, um die Detailplanung zu generieren.
            </p>

            {/* Summary of what will be locked */}
            <div className="card mb-6">
                <h3 className="mb-4">Zusammenfassung</h3>

                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="form-label">Titel</span>
                        <p>{sv.title}</p>
                    </div>
                    <div className="summary-item">
                        <span className="form-label">Stufe</span>
                        <p>{plan.level}</p>
                    </div>
                    <div className="summary-item">
                        <span className="form-label">Fach</span>
                        <p>{plan.subject}</p>
                    </div>
                    <div className="summary-item">
                        <span className="form-label">Dauer</span>
                        <p className="text-mono">{plan.durationMinutes} Min</p>
                    </div>
                </div>

                <div className="mt-4">
                    <span className="form-label">Lernziele</span>
                    <ul className="preview-list">
                        {sv.goals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                </div>

                <div className="mt-4">
                    <span className="form-label">Phasen ({sv.phasesSummary.length})</span>
                    {sv.phasesSummary.map((p, i) => (
                        <div key={i} className="phase-summary-item">
                            <span>{p.name}</span>
                            <span className="text-mono text-secondary">{p.durationMinutes} Min</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gate B Approval */}
            {!plan.gateBApproved ? (
                <div className="gate-approval">
                    <div className="alert alert-warning mb-4">
                        ⚠️ Nach Freigabe wird die Detailplanung generiert. Du kannst danach zurückkehren und Änderungen vornehmen.
                    </div>
                    <button
                        className="btn btn-success btn-lg w-full"
                        onClick={approveGateB}
                        type="button"
                    >
                        ✅ Kurzversion freigeben — Detailplanung starten
                    </button>
                </div>
            ) : (
                <div className="alert alert-success">
                    ✅ Kurzversion freigegeben! Gehe weiter zur Detailplanung.
                </div>
            )}
        </div>
    );
}
