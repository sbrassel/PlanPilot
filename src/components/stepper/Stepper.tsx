'use client';

import React from 'react';
import { usePlanStore } from '@/lib/store';
import { SINGLE_STEPS, SEQUENCE_STEPS } from '@/lib/constants';
import { isStepAccessible } from '@/lib/validation';
import type { StepConfig, PlanData } from '@/lib/types';

export default function Stepper() {
    const { plan, currentStep, setStep } = usePlanStore();
    const steps = plan.mode === 'sequence' ? SEQUENCE_STEPS : SINGLE_STEPS;

    return (
        <nav className="stepper" role="navigation" aria-label="Planungsschritte">
            <div className="stepper-header">
                <span className="stepper-mode-badge">
                    {plan.mode === 'single' ? '📄 Einzelstunde' : '📚 Sequenz'}
                </span>
            </div>
            <ol className="stepper-list">
                {steps.map((step, index) => {
                    // Insert gate divider before gate steps
                    const prevStep = index > 0 ? steps[index - 1] : null;
                    const showGateDivider = step.isGate && (!prevStep || !prevStep.isGate);

                    return (
                        <React.Fragment key={step.id}>
                            {showGateDivider && step.gateLabel && (
                                <li className="stepper-gate-divider">
                                    <span className="gate-label">{step.gateLabel}</span>
                                    <GateStatusBadge step={step.id} plan={plan} />
                                </li>
                            )}
                            <StepItem
                                step={step}
                                isCurrent={currentStep === step.id}
                                isCompleted={currentStep > step.id}
                                isAccessible={isStepAccessible(step.id, plan)}
                                onClick={() => setStep(step.id)}
                            />
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}

function StepItem({
    step,
    isCurrent,
    isCompleted,
    isAccessible,
    onClick,
}: {
    step: StepConfig;
    isCurrent: boolean;
    isCompleted: boolean;
    isAccessible: boolean;
    onClick: () => void;
}) {
    const stateClass = isCurrent
        ? 'step-active'
        : isCompleted
            ? 'step-completed'
            : isAccessible
                ? 'step-upcoming'
                : 'step-locked';

    return (
        <li className={`stepper-item ${stateClass}`}>
            <button
                className="stepper-button"
                onClick={onClick}
                disabled={!isAccessible}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.title}${!isAccessible ? ' (gesperrt)' : ''}`}
            >
                <span className="step-indicator">
                    {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M11.5 3.5L5.5 10L2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : !isAccessible ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="3" y="5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M4 5V4C4 2.89543 4.89543 2 6 2V2C7.10457 2 8 2.89543 8 4V5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    ) : (
                        <span className="step-number">{step.id}</span>
                    )}
                </span>
                <span className="step-content">
                    <span className="step-title">{step.title}</span>
                    <span className="step-desc">{step.description}</span>
                </span>
            </button>
        </li>
    );
}

function GateStatusBadge({ step, plan }: { step: number; plan: PlanData }) {
    let status: 'pending' | 'approved' = 'pending';

    if (step === 5 && plan.gateAApproved) status = 'approved';
    if (step === 7 && plan.gateBApproved) status = 'approved';

    return (
        <span className={`gate-status gate-status-${status}`}>
            {status === 'approved' ? '✅' : '⏳'}
        </span>
    );
}
