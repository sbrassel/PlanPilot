import { PlanData, ShortVersion, DetailPlan, SequenceSkeleton } from '../types';

const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1500;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const response = await fetch(url, options);

        if (response.ok) return response;

        // Only retry on transient errors
        if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < retries) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`API returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
        }

        // Non-retryable or exhausted retries — throw
        const errorText = await response.text();
        console.error(`API Error (${response.status} ${response.statusText}):`, errorText);

        let errorDetails: Record<string, unknown> = {};
        try { errorDetails = JSON.parse(errorText); } catch { /* Not JSON */ }

        throw new Error((errorDetails as any).error || `API request failed: ${response.status}`);
    }

    throw new Error('Unexpected: retry loop exited without returning');
}

export async function generateLessonPlan(plan: PlanData, type: 'short' | 'detail' | 'sequence' = 'short'): Promise<ShortVersion | DetailPlan | SequenceSkeleton> {
    const response = await fetchWithRetry('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, type }),
    });

    const data = await response.json();
    return data as ShortVersion | DetailPlan | SequenceSkeleton;
}

export async function reviseLessonPlan(plan: PlanData, currentShortVersion: ShortVersion, instruction: string): Promise<ShortVersion> {
    const response = await fetchWithRetry('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            plan: { ...plan, currentShortVersion, revisionInstruction: instruction },
            type: 'revise',
        }),
    });

    const data = await response.json();
    return data as ShortVersion;
}
