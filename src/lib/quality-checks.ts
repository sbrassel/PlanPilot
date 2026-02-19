// ============================================
// PlanPilot — Quality Engine (5 Checks)
// ============================================

import type { QualityWarning, PlanData, Phase } from './types';

/**
 * Run all quality checks against a plan.
 * Returns combined warnings sorted by severity.
 */
export function runQualityChecks(plan: PlanData): QualityWarning[] {
    const warnings: QualityWarning[] = [];

    if (plan.detailPlan?.phases) {
        warnings.push(...checkTimeReality(plan.detailPlan.phases, plan.durationMinutes));
        warnings.push(...checkWorkload(plan.detailPlan.phases));
    }

    if (plan.shortVersion?.phasesSummary) {
        const phaseDurations = plan.shortVersion.phasesSummary.map(p => p.durationMinutes);
        const total = phaseDurations.reduce((a, b) => a + b, 0);
        if (Math.abs(total - plan.durationMinutes) > 2) {
            warnings.push({
                type: 'time',
                severity: 'warning',
                message: `Phasenzeiten (${total} Min) passen nicht zur Gesamtdauer (${plan.durationMinutes} Min).`,
                suggestion: `Passe die Phasenzeiten an, sodass sie insgesamt ${plan.durationMinutes} Minuten ergeben.`,
            });
        }
    }

    warnings.push(...checkLanguageLevel(plan));
    warnings.push(...checkResources(plan));

    // Sort: errors first, then warnings, then info
    const severityOrder = { error: 0, warning: 1, info: 2 };
    warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return warnings;
}

/**
 * Check 1: Time Reality
 * Phase durations must sum to total lesson duration.
 */
export function checkTimeReality(phases: Phase[], totalDuration: number): QualityWarning[] {
    const warnings: QualityWarning[] = [];
    const phaseTotal = phases.reduce((sum, p) => sum + p.durationMinutes, 0);

    if (phaseTotal > totalDuration + 2) {
        warnings.push({
            type: 'time',
            severity: 'error',
            message: `Phasen dauern insgesamt ${phaseTotal} Min, aber nur ${totalDuration} Min verfügbar.`,
            suggestion: `Kürze Phasen um ${phaseTotal - totalDuration} Minuten.`,
        });
    } else if (phaseTotal < totalDuration - 5) {
        warnings.push({
            type: 'time',
            severity: 'warning',
            message: `${totalDuration - phaseTotal} Min ungenutzt. Überlege, ob du Phasen verlängerst oder eine Pufferzeit einplanst.`,
        });
    }

    // Check individual phases
    for (const phase of phases) {
        if (phase.durationMinutes < 3) {
            warnings.push({
                type: 'time',
                severity: 'warning',
                message: `Phase "${phase.name}" hat nur ${phase.durationMinutes} Min — zu kurz für sinnvolle Arbeit.`,
                suggestion: 'Kombiniere kurze Phasen oder verlängere sie auf mindestens 5 Minuten.',
            });
        }
    }

    return warnings;
}

/**
 * Check 3: Language Level
 * If class profile is A2/B1, ensure language-sensitive content.
 */
export function checkLanguageLevel(plan: PlanData): QualityWarning[] {
    const warnings: QualityWarning[] = [];
    const langLevel = plan.classProfile.languageLevel;

    if ((langLevel === 'a1' || langLevel === 'a2' || langLevel === 'b1') &&
        plan.classProfile.heterogeneity !== 'low') {

        // Check if language_sensitive quality layer is selected
        if (plan.didacticSlots.slot3 !== 'language_sensitive') {
            warnings.push({
                type: 'language',
                severity: 'warning',
                message: `Sprachstand ${langLevel.toUpperCase()} mit Heterogenität — sprachsensible Materialien empfohlen.`,
                suggestion: 'Wähle "Sprachsensibler Unterricht" als Qualitätslayer oder stelle sicher, dass Satzstarter und Wortlisten enthalten sind.',
            });
        }

        // Ensure differentiation includes language supports
        if (plan.shortVersion && (!plan.shortVersion.languageSupports || plan.shortVersion.languageSupports.length === 0)) {
            warnings.push({
                type: 'language',
                severity: 'info',
                message: 'Sprachstützen (Satzstarter, Wortlisten) werden automatisch hinzugefügt.',
            });
        }
    }

    return warnings;
}

/**
 * Check 4: Workload
 * Too many methods/products in one lesson → suggest reduction.
 */
export function checkWorkload(phases: Phase[]): QualityWarning[] {
    const warnings: QualityWarning[] = [];

    if (phases.length > 6) {
        warnings.push({
            type: 'workload',
            severity: 'warning',
            message: `${phases.length} Phasen in einer Lektion — hohe kognitive Belastung für SuS.`,
            suggestion: 'Reduziere auf maximal 5–6 Phasen und priorisiere die wichtigsten Aktivitäten.',
        });
    }

    // Check for too many different social forms
    const socialForms = new Set(phases.map(p => p.socialForm).filter(Boolean));
    if (socialForms.size > 4) {
        warnings.push({
            type: 'workload',
            severity: 'info',
            message: `${socialForms.size} verschiedene Sozialformen — viele Wechsel können unruhig wirken.`,
            suggestion: 'Überlege, ob 2–3 Sozialformen reichen.',
        });
    }

    return warnings;
}

/**
 * Check 5: Resources
 * If no tech available, ensure analog alternatives exist.
 */
export function checkResources(plan: PlanData): QualityWarning[] {
    const warnings: QualityWarning[] = [];

    // Check if any phase mentions digital tools but no Plan B
    if (plan.detailPlan?.phases) {
        const digitalKeywords = ['tablet', 'laptop', 'computer', 'digital', 'app', 'online', 'internet', 'beamer', 'smartboard'];

        for (const phase of plan.detailPlan.phases) {
            const hasDigitalContent = digitalKeywords.some(keyword =>
                phase.description.toLowerCase().includes(keyword) ||
                phase.materials?.some(m => m.toLowerCase().includes(keyword))
            );

            if (hasDigitalContent && !phase.planBAlternative) {
                warnings.push({
                    type: 'resources',
                    severity: 'warning',
                    message: `Phase "${phase.name}" nutzt digitale Mittel, aber hat keine analoge Alternative (Plan B).`,
                    suggestion: 'Ergänze eine analoge Alternative für den Fall, dass die Technik ausfällt.',
                });
            }
        }
    }

    return warnings;
}
