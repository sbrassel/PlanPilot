import { PlanData, ShortVersion, DetailPlan, SequenceSkeleton } from '../types';

export async function generateLessonPlan(plan: PlanData, type: 'short' | 'detail' | 'sequence' = 'short'): Promise<ShortVersion | DetailPlan | SequenceSkeleton> {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan, type }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status} ${response.statusText}):`, errorText);

        let errorDetails = {};
        try {
            errorDetails = JSON.parse(errorText);
        } catch {
            // Not JSON
        }

        throw new Error((errorDetails as any).error || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data as ShortVersion | DetailPlan | SequenceSkeleton;
}

export async function reviseLessonPlan(plan: PlanData, currentShortVersion: ShortVersion, instruction: string): Promise<ShortVersion> {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            plan: { ...plan, currentShortVersion, revisionInstruction: instruction },
            type: 'revise',
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status} ${response.statusText}):`, errorText);

        let errorDetails = {};
        try {
            errorDetails = JSON.parse(errorText);
        } catch {
            // Not JSON
        }

        throw new Error((errorDetails as any).error || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data as ShortVersion;
}
