'use client';

import { useState, useCallback, useRef } from 'react';
import { usePlanStore } from '@/lib/store';
import { parseUploadedCurriculum, createMapping } from '@/lib/curriculum-service';
import type { CurriculumCompetency } from '@/lib/types';

export default function CurriculumUpload() {
    const { addCurriculumMapping } = usePlanStore();
    const [parsedItems, setParsedItems] = useState<CurriculumCompetency[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        setError(null);
        const validTypes = ['.txt', '.csv'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validTypes.includes(ext)) {
            setError(`Dateityp "${ext}" wird noch nicht unterstützt. Bitte TXT oder CSV verwenden. (PDF/DOCX benötigt serverseitige Verarbeitung)`);
            return;
        }

        setIsParsing(true);
        try {
            const results = await parseUploadedCurriculum(file);
            setParsedItems(results);
        } catch {
            setError('Fehler beim Lesen der Datei.');
        }
        setIsParsing(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const addItem = useCallback((comp: CurriculumCompetency) => {
        addCurriculumMapping(createMapping(comp, 0.7));
        setParsedItems(prev => prev.filter(p => p.id !== comp.id));
    }, [addCurriculumMapping]);

    const addAll = useCallback(() => {
        for (const comp of parsedItems) {
            addCurriculumMapping(createMapping(comp, 0.7));
        }
        setParsedItems([]);
    }, [parsedItems, addCurriculumMapping]);

    return (
        <div className="curriculum-upload">
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                Eigenen Lehrplan hochladen
            </h4>

            {/* --- Dropzone --- */}
            <div
                className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') fileRef.current?.click(); }}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    aria-label="Datei hochladen"
                />
                <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)', opacity: 0.5 }}>📄</div>
                <p className="text-sm text-secondary">
                    {isParsing ? '⏳ Datei wird verarbeitet…' : 'Datei hierher ziehen oder klicken zum Auswählen'}
                </p>
                <p className="text-xs text-tertiary mt-1">TXT, CSV unterstützt</p>
            </div>

            {error && (
                <div className="alert alert-warning mt-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* --- Parsed Results --- */}
            {parsedItems.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-secondary">{parsedItems.length} Kompetenzen erkannt</span>
                        <button className="btn btn-sm btn-primary" onClick={addAll}>
                            Alle hinzufügen
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {parsedItems.map(comp => (
                            <div key={comp.id} className="card" style={{ padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-draft">{comp.code}</span>
                                    </div>
                                    <p className="text-sm mt-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {comp.competency}
                                    </p>
                                </div>
                                <button className="btn btn-sm btn-secondary" onClick={() => addItem(comp)}>
                                    + Hinzufügen
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
