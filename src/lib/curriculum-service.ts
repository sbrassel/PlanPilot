// ============================================
// PlanPilot — Curriculum Service
// ============================================

import type { CurriculumCompetency, CurriculumMapping, PlanData } from './types';
import { LP21_COMPETENCIES, getCompetenciesByArea, getCompetenciesByCycle } from './lp21-data';

// --- Fuzzy Search ---

export function searchCompetencies(
    query: string,
    filters?: { area?: string; cycle?: string }
): CurriculumCompetency[] {
    let results = LP21_COMPETENCIES;

    // Apply filters
    if (filters?.area) {
        results = getCompetenciesByArea(filters.area);
    }
    if (filters?.cycle) {
        results = results.filter(c => c.cycle === filters.cycle);
    }

    // Search
    if (!query.trim()) return results;

    const q = query.toLowerCase().trim();
    const terms = q.split(/\s+/);

    return results
        .map(c => {
            const searchText = `${c.code} ${c.area} ${c.competencyArea} ${c.competency} ${(c.levelIndicators || []).join(' ')}`.toLowerCase();
            const score = terms.reduce((acc, term) => {
                // Exact code match gets highest score
                if (c.code.toLowerCase().includes(term)) return acc + 10;
                // Area/competencyArea match
                if (c.area.toLowerCase().includes(term) || c.competencyArea.toLowerCase().includes(term)) return acc + 5;
                // General text match
                if (searchText.includes(term)) return acc + 1;
                return acc;
            }, 0);
            return { competency: c, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.competency);
}

// --- Auto-suggest based on plan context ---

export function autoSuggestCompetencies(
    plan: PlanData
): Array<{ competency: CurriculumCompetency; confidenceScore: number }> {
    const suggestions: Array<{ competency: CurriculumCompetency; confidenceScore: number }> = [];

    // Determine cycle from level
    const cycle = levelToCycle(plan.level);

    // Filter by cycle first
    let pool = cycle ? getCompetenciesByCycle(cycle) : LP21_COMPETENCIES;

    // Score each competency based on plan context
    const subjectLower = plan.subject.toLowerCase();
    const topicDescLower = (plan.topicDescription || '').toLowerCase();
    const specialNeedsLower = (plan.specialNeeds || '').toLowerCase();
    const goalsLower = plan.goals.join(' ').toLowerCase();

    // Combine all context for search, giving weight to description
    const searchText = `${subjectLower} ${topicDescLower} ${specialNeedsLower} ${goalsLower}`;

    for (const comp of pool) {
        let confidence = 0;
        const compText = `${comp.area} ${comp.competencyArea} ${comp.competency}`.toLowerCase();

        // Subject area match
        if (subjectLower.includes(comp.area.toLowerCase()) || comp.area.toLowerCase().includes(subjectLower.split(' ')[0])) {
            confidence += 0.4;
        }

        // Keyword overlap between goals and competency
        const compWords = compText.split(/\s+/).filter(w => w.length > 3);
        const matchingWords = compWords.filter(w => searchText.includes(w));
        confidence += Math.min(0.4, (matchingWords.length / Math.max(compWords.length, 1)) * 0.6);

        // Small bonus for matching competencyArea keywords in subject
        if (searchText.includes(comp.competencyArea.toLowerCase().split(' ')[0])) {
            confidence += 0.15;
        }

        // Cap at 0.95
        confidence = Math.min(0.95, confidence);

        if (confidence >= 0.15) {
            suggestions.push({ competency: comp, confidenceScore: Math.round(confidence * 100) / 100 });
        }
    }

    // Sort by confidence, return top 5
    return suggestions
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 5);
}

// --- Parse uploaded curriculum file ---

export async function parseUploadedCurriculum(
    file: File
): Promise<CurriculumCompetency[]> {
    const text = await file.text();
    const results: CurriculumCompetency[] = [];

    if (file.name.endsWith('.csv')) {
        // CSV: expect columns: code, area, competencyArea, competency
        const lines = text.split('\n').filter(l => l.trim());
        const hasHeader = lines[0]?.toLowerCase().includes('code') || lines[0]?.toLowerCase().includes('kompetenz');
        const startLine = hasHeader ? 1 : 0;

        for (let i = startLine; i < lines.length; i++) {
            const cols = lines[i].split(/[;,\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols.length >= 2) {
                results.push({
                    id: `upload-${i}`,
                    code: cols[0] || `U.${i}`,
                    area: cols[1] || 'Custom',
                    competencyArea: cols[2] || 'Allgemein',
                    competency: cols[3] || cols[1] || cols[0],
                    cycle: null,
                    levelIndicators: cols[4] ? cols[4].split('|').map(s => s.trim()) : [],
                });
            }
        }
    } else {
        // TXT: each non-empty line is a competency
        const lines = text.split('\n').filter(l => l.trim());

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#') || line.startsWith('//')) continue;

            // Try to extract code pattern (XX.N.X.N)
            const codeMatch = line.match(/^([A-Z]{1,4}\.\d+\.[A-Z]\.\d+|[A-Z]{1,4}\.\d+\.\d+)/);
            const code = codeMatch ? codeMatch[1] : `U.${i + 1}`;
            const text = codeMatch ? line.slice(codeMatch[0].length).trim().replace(/^[:\-–]\s*/, '') : line;

            results.push({
                id: `upload-${i}`,
                code,
                area: 'Upload',
                competencyArea: 'Benutzerdefiniert',
                competency: text,
                cycle: null,
                levelIndicators: [],
            });
        }
    }

    return results;
}

// --- Create a mapping from competency ---

export function createMapping(
    competency: CurriculumCompetency,
    confidenceScore: number = 0.5
): CurriculumMapping {
    return {
        competencyId: competency.id,
        competencyCode: competency.code,
        competencyText: competency.competency,
        area: competency.area,
        confidenceScore,
        confirmed: false,
    };
}

// --- Helper: Level → Cycle ---

function levelToCycle(level: string | null): string | null {
    switch (level) {
        case 'kg': return 'Zyklus 1';
        case 'primar': return 'Zyklus 2';
        case 'sek1':
        case '10sj':
        case 'gymnasium': return 'Zyklus 3';
        default: return null;
    }
}
