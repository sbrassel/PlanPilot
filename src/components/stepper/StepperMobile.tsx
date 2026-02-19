'use client';

import React from 'react';
import { usePlanStore } from '@/lib/store';
import { SINGLE_STEPS, SEQUENCE_STEPS } from '@/lib/constants';

export default function StepperMobile() {
    const { plan, currentStep } = usePlanStore();
    const steps = plan.mode === 'sequence' ? SEQUENCE_STEPS : SINGLE_STEPS;
    const totalSteps = steps.length;
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="stepper-mobile">
            <div className="stepper-mobile-info">
                <span className="stepper-mobile-step">
                    Schritt {currentStep} von {totalSteps}
                </span>
                <span className="stepper-mobile-title">
                    {getStepTitle(currentStep, plan.mode)}
                </span>
            </div>
            <div className="stepper-mobile-bar" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
                <div className="stepper-mobile-fill" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}

function getStepTitle(step: number, mode: string): string {
    const titles: Record<number, string> = {
        1: 'Kontext',
        2: 'Ziele & Lehrplan',
        3: 'Didaktik',
        4: mode === 'sequence' ? 'Sequenz-Skelett' : 'KI-Kurzversion',
        5: mode === 'sequence' ? 'Sequenz anpassen' : 'Anpassen',
        6: 'KI-Überarbeitung',
        7: mode === 'sequence' ? 'Freigeben' : 'Freigabe',
        8: 'Detailplanung',
        9: 'Export',
    };
    return titles[step] || '';
}
