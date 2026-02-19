'use client';

import { usePlanStore } from '@/lib/store';
import type { ShortVersion, PlanData, SequenceSkeleton } from '@/lib/types';

export default function LivePreview() {
    const { plan } = usePlanStore();

    return (
        <aside className="wizard-preview">
            <div className="preview-header">
                <h3>Live-Vorschau</h3>
                <StatusBadge status={plan.status} />
            </div>

            {plan.shortVersion ? (
                <ShortVersionPreview sv={plan.shortVersion} plan={plan} />
            ) : plan.sequenceSkeleton ? (
                <SequencePreview skeleton={plan.sequenceSkeleton} />
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p className="empty-state-text">
                        Vorschau wird ab Schritt 4 angezeigt
                    </p>
                </div>
            )}
        </aside>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; className: string }> = {
        draft: { label: 'Entwurf', className: 'badge-draft' },
        ai_generated: { label: 'KI-Entwurf', className: 'badge-generated' },
        edited: { label: 'Bearbeitet', className: 'badge-edited' },
        revised: { label: 'Überarbeitet', className: 'badge-edited' },
        approved: { label: 'Freigegeben', className: 'badge-approved' },
        detail_ready: { label: 'Detail fertig', className: 'badge-approved' },
        exported: { label: 'Exportiert', className: 'badge-approved' },
    };

    const c = config[status] || config.draft;

    return <span className={`badge ${c.className}`}>{c.label}</span>;
}

function ShortVersionPreview({ sv, plan }: { sv: ShortVersion; plan: PlanData }) {
    return (
        <div className="preview-content">
            <h4 className="preview-title">{sv.title}</h4>
            <p className="preview-overview">{sv.overview}</p>

            <div className="preview-section">
                <h5>Lernziele</h5>
                <ul className="preview-list">
                    {sv.goals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                    ))}
                </ul>
            </div>

            <div className="preview-section">
                <h5>Phasen</h5>
                <div className="preview-phases">
                    {sv.phasesSummary.map((phase, i) => (
                        <div key={i} className="preview-phase-item">
                            <div className="preview-phase-header">
                                <span className="preview-phase-name">{phase.name}</span>
                                <span className="preview-phase-time text-mono">{phase.durationMinutes} Min</span>
                            </div>
                            <p className="preview-phase-desc">{phase.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="preview-section">
                <h5>Differenzierung</h5>
                <div className="preview-diff-grid">
                    <div className="preview-diff-item preview-diff-a">
                        <span className="preview-diff-label">A — Basis</span>
                        <p>{sv.differentiationSummary.niveauA}</p>
                    </div>
                    <div className="preview-diff-item preview-diff-b">
                        <span className="preview-diff-label">B — Standard</span>
                        <p>{sv.differentiationSummary.niveauB}</p>
                    </div>
                    <div className="preview-diff-item preview-diff-c">
                        <span className="preview-diff-label">C — Challenge</span>
                        <p>{sv.differentiationSummary.niveauC}</p>
                    </div>
                </div>
            </div>

            {sv.languageSupports && sv.languageSupports.length > 0 && (
                <div className="preview-section">
                    <h5>Sprachstützen</h5>
                    <ul className="preview-list">
                        {sv.languageSupports.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            {plan.gateBApproved && (
                <div className="alert alert-success mt-4" style={{ fontSize: 'var(--text-xs)' }}>
                    ✅ Kurzversion freigegeben — Detailplanung freigeschaltet
                </div>
            )}
        </div>
    );
}

function SequencePreview({ skeleton }: { skeleton: SequenceSkeleton }) {
    return (
        <div className="preview-content">
            <h4 className="preview-title">Sequenzübersicht</h4>
            <p className="preview-overview">{skeleton.progression}</p>

            <div className="preview-section">
                <h5>Lektionen</h5>
                <div className="preview-phases">
                    {skeleton.lessons.map((lesson) => (
                        <div key={lesson.id} className="preview-phase-item">
                            <div className="preview-phase-header">
                                <span className="preview-phase-name">{lesson.title}</span>
                                <span className="preview-phase-time text-mono">{lesson.durationMinutes} Min</span>
                            </div>
                            <p className="preview-phase-desc">{lesson.focus}</p>
                            {lesson.intermediateCheck && (
                                <span className="badge badge-edited" style={{ marginTop: '4px' }}>
                                    🔍 {lesson.intermediateCheck}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
