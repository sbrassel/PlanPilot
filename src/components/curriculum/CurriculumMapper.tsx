'use client';

import { useState, useMemo, useCallback } from 'react';
import { usePlanStore } from '@/lib/store';
import { searchCompetencies, autoSuggestCompetencies, createMapping } from '@/lib/curriculum-service';
import { LP21_AREAS, LP21_CYCLES } from '@/lib/lp21-data';
import type { CurriculumCompetency } from '@/lib/types';

export default function CurriculumMapper() {
    const { plan, addCurriculumMapping, removeCurriculumMapping, confirmMapping } = usePlanStore();
    const [query, setQuery] = useState('');
    const [areaFilter, setAreaFilter] = useState<string | null>(null);
    const [cycleFilter, setCycleFilter] = useState<string | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Debounced search
    const results = useMemo(() => {
        return searchCompetencies(query, {
            area: areaFilter || undefined,
            cycle: cycleFilter || undefined,
        }).slice(0, 15);
    }, [query, areaFilter, cycleFilter]);

    const addedIds = useMemo(
        () => new Set(plan.curriculumMappings.map(m => m.competencyId)),
        [plan.curriculumMappings]
    );

    const handleAdd = useCallback((comp: CurriculumCompetency) => {
        addCurriculumMapping(createMapping(comp, 0.5));
    }, [addCurriculumMapping]);

    const handleAutoSuggest = useCallback(async () => {
        setIsSuggesting(true);
        // Simulate slight delay
        await new Promise(r => setTimeout(r, 800));
        const suggestions = autoSuggestCompetencies(plan);
        for (const s of suggestions) {
            addCurriculumMapping(createMapping(s.competency, s.confidenceScore));
        }
        setIsSuggesting(false);
    }, [plan, addCurriculumMapping]);

    return (
        <div className="curriculum-mapper">
            {/* --- Mapped Competencies --- */}
            {plan.curriculumMappings.length > 0 && (
                <div className="mb-6">
                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                        Zugeordnete Kompetenzen ({plan.curriculumMappings.length})
                    </h4>
                    <div className="flex flex-col gap-2">
                        {plan.curriculumMappings.map(m => (
                            <div key={m.competencyId} className="card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="badge badge-generated">{m.competencyCode}</span>
                                        <span className="text-xs text-tertiary">{m.area}</span>
                                    </div>
                                    <p className="text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {m.competencyText}
                                    </p>
                                    {/* Confidence bar */}
                                    <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <div className="confidence-bar">
                                            <div className="confidence-fill" style={{ width: `${m.confidenceScore * 100}%` }} />
                                        </div>
                                        <span className="text-xs text-tertiary">{Math.round(m.confidenceScore * 100)}%</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {!m.confirmed && (
                                        <button
                                            className="btn btn-sm btn-success"
                                            onClick={() => confirmMapping(m.competencyId)}
                                            title="Bestätigen"
                                        >
                                            ✓
                                        </button>
                                    )}
                                    {m.confirmed && (
                                        <span className="badge badge-approved">Bestätigt</span>
                                    )}
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => removeCurriculumMapping(m.competencyId)}
                                        title="Entfernen"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Auto-Suggest Button --- */}
            <button
                className="btn btn-secondary w-full mb-4"
                onClick={handleAutoSuggest}
                disabled={isSuggesting || (!plan.subject && !plan.topicDescription)}
            >
                {isSuggesting ? '⏳ Kompetenzen werden analysiert…' :
                    plan.topicDescription ? '✨ Basierend auf Beschreibung Kompetenzen vorschlagen' :
                        '🤖 KI-Vorschlag: Kompetenzen automatisch zuordnen'}
            </button>

            {/* --- Search --- */}
            <div className="form-group mb-4">
                <label className="form-label" htmlFor="comp-search">Kompetenz suchen</label>
                <input
                    id="comp-search"
                    className="form-input"
                    type="text"
                    placeholder="z.B. MA.1 oder Lesen oder Zahlen…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>

            {/* --- Filter Pills --- */}
            <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                <button
                    className={`pill ${!areaFilter ? 'active' : ''}`}
                    onClick={() => setAreaFilter(null)}
                >
                    Alle Fächer
                </button>
                {LP21_AREAS.map(area => (
                    <button
                        key={area}
                        className={`pill ${areaFilter === area ? 'active' : ''}`}
                        onClick={() => setAreaFilter(areaFilter === area ? null : area)}
                    >
                        {area}
                    </button>
                ))}
            </div>
            <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                {LP21_CYCLES.map(cycle => (
                    <button
                        key={cycle}
                        className={`pill ${cycleFilter === cycle ? 'active' : ''}`}
                        onClick={() => setCycleFilter(cycleFilter === cycle ? null : cycle)}
                    >
                        {cycle}
                    </button>
                ))}
            </div>

            {/* --- Results --- */}
            <div className="flex flex-col gap-2">
                {results.length === 0 && (
                    <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                        <div className="empty-state-icon">🔍</div>
                        <p className="empty-state-text">Keine Kompetenzen gefunden. Versuche einen anderen Suchbegriff oder Filter.</p>
                    </div>
                )}
                {results.map(comp => (
                    <button
                        key={comp.id}
                        className="comp-result-card"
                        disabled={addedIds.has(comp.id)}
                        onClick={() => handleAdd(comp)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-draft">{comp.code}</span>
                            <span className="text-xs text-tertiary">{comp.area} · {comp.competencyArea}</span>
                            {comp.cycle && <span className="text-xs text-tertiary">({comp.cycle})</span>}
                        </div>
                        <p className="text-sm">{comp.competency}</p>
                        {comp.levelIndicators.length > 0 && (
                            <div className="text-xs text-tertiary mt-1">
                                {comp.levelIndicators.slice(0, 3).join(' · ')}
                            </div>
                        )}
                        {addedIds.has(comp.id) && (
                            <span className="badge badge-approved" style={{ marginTop: 'var(--space-1)' }}>Hinzugefügt</span>
                        )}
                    </button>
                ))}
            </div>
        </div >
    );
}
