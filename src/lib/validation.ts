// ============================================
// PlanPilot — Step Validation & Didactic Compatibility
// ============================================

import type { PlanData, CompatibilityResult, QualityWarning, DidacticSlots } from './types';
import { INCOMPATIBLE_COMBOS } from './constants';

// --- Step Validation ---

export function validateStep(step: number, plan: PlanData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (step) {
        case 1: // Context
            if (!plan.level) errors.push('Bitte wähle eine Stufe.');
            if (!plan.subject.trim()) errors.push('Bitte gib ein Fach/Thema ein.');
            if (plan.durationMinutes <= 0) errors.push('Bitte wähle eine Dauer.');
            if (plan.classProfile.classSize <= 0) errors.push('Bitte gib die Klassengrösse ein.');
            if (plan.mode === 'sequence' && (plan.lessonCount < 3 || plan.lessonCount > 12)) {
                errors.push('Sequenz benötigt 3–12 Lektionen.');
            }
            if (!plan.learningGoalType) errors.push('Bitte wähle einen Lernzieltyp.');
            break;

        case 2: // Goals + Curriculum
            if (plan.goals.length === 0 || !plan.goals.some(g => g.trim())) {
                errors.push('Bitte gib mindestens ein Lernziel ein.');
            }
            break;

        case 3: // Didactics
            if (!plan.didacticSlots.slot1) errors.push('Bitte wähle ein Strukturmodell (Slot 1).');
            break;

        case 4: // AI Generation
            // No user validation needed — AI generates
            break;

        case 5: // Gate A — user edits
            // Always valid, user can proceed with or without edits
            break;

        case 6: // AI Revision
            break;

        case 7: // Gate B — approval
            if (!plan.gateAApproved && !plan.gateBApproved) {
                errors.push('Bitte bestätige die Kurzversion, bevor du fortfährst.');
            }
            break;

        case 8: // Detail Plan
            if (!plan.gateBApproved) {
                errors.push('Detailplanung erst nach Freigabe der Kurzversion möglich.');
            }
            break;

        case 9: // Export
            if (plan.mode === 'single' && !plan.detailPlan) {
                errors.push('Bitte erstelle zuerst eine Detailplanung.');
            }
            if (plan.mode === 'sequence' && (!plan.sequenceSkeleton || !plan.sequenceSkeleton.lessons.some(l => l.detailPlan))) {
                errors.push('Bitte erstelle die Detailplanung für mindestens eine Lektion der Sequenz.');
            }
            break;
    }

    return { valid: errors.length === 0, errors };
}

// --- Check if step is accessible ---

export function isStepAccessible(step: number, plan: PlanData): boolean {
    // Steps 1-4 are always accessible if preceding steps are valid
    if (step <= 4) return true;

    // Steps 5-7 need step 4 completed (AI generated)
    if (step >= 5 && step <= 7) {
        return plan.shortVersion !== null;
    }

    // Step 8 needs Gate B approved
    if (step === 8) {
        return plan.gateBApproved;
    }

    // Step 9 needs detail plan or sequence readiness
    if (step === 9) {
        if (plan.mode === 'sequence') {
            return plan.sequenceSkeleton !== null;
        }
        return plan.detailPlan !== null;
    }

    return false;
}

// --- Didactic Compatibility Check ---

export function checkDidacticCompatibility(slots: DidacticSlots): CompatibilityResult {
    const warnings: QualityWarning[] = [];
    const alternatives: string[] = [];

    // Count active slots
    const activeCount = [slots.slot1, slots.slot2, slots.slot3].filter(Boolean).length;

    // Check known incompatible combinations
    for (const combo of INCOMPATIBLE_COMBOS) {
        const matches =
            (!combo.slot1 || combo.slot1 === slots.slot1) &&
            (!combo.slot2 || combo.slot2 === slots.slot2) &&
            (!combo.slot3 || combo.slot3 === slots.slot3);

        // Only trigger if at least 2 slots match
        const matchCount = [
            combo.slot1 && combo.slot1 === slots.slot1,
            combo.slot2 && combo.slot2 === slots.slot2,
            combo.slot3 && combo.slot3 === slots.slot3,
        ].filter(Boolean).length;

        if (matches && matchCount >= 2) {
            warnings.push({
                type: 'compatibility',
                severity: 'warning',
                message: combo.reason,
                suggestion: combo.alternative,
            });
            alternatives.push(combo.alternative);
        }
    }

    return {
        compatible: warnings.length === 0,
        warnings,
        alternatives,
    };
}
