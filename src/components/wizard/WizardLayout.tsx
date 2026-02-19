'use client';

import { useState, useEffect } from 'react';
import { usePlanStore } from '@/lib/store';
import { SINGLE_STEPS, SEQUENCE_STEPS } from '@/lib/constants';
import Stepper from '@/components/stepper/Stepper';
import StepperMobile from '@/components/stepper/StepperMobile';
import LivePreview from '@/components/preview/LivePreview';
import StepContext from './StepContext';
import StepGoals from './StepGoals';
import StepDidactics from './StepDidactics';
import StepGenerate from './StepGenerate';
import StepGateA from './StepGateA';
import StepRevision from './StepRevision';
import StepGateB from './StepGateB';
import StepDetail from './StepDetail';
import StepDetailSequence from './StepDetailSequence';
import StepExport from './StepExport';

export default function WizardLayout() {
    const { currentStep, nextStep, prevStep, plan } = usePlanStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null; // Avoid hydration mismatch by waiting for mount

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <StepContext />;
            case 2: return <StepGoals />;
            case 3: return <StepDidactics />;
            case 4: return <StepGenerate />;
            case 5: return <StepGateA />;
            case 6: return <StepRevision />;
            case 7: return <StepGateB />;
            case 8:
                return plan.mode === 'sequence'
                    ? <StepDetailSequence />
                    : <StepDetail />;
            case 9: return <StepExport />;
            default: return <StepContext />;
        }
    };

    const steps = plan.mode === 'sequence' ? SEQUENCE_STEPS : SINGLE_STEPS;
    const totalSteps = steps.length;

    return (
        <>
            {/* Mobile Stepper */}
            <div className="mobile-only">
                <StepperMobile />
            </div>

            <div className="wizard-layout">
                {/* Left: Stepper Sidebar */}
                <div className="wizard-sidebar desktop-only">
                    <Stepper />
                </div>

                {/* Center: Main Content */}
                <main className="wizard-main">
                    {renderStep()}

                    {/* Step Navigation */}
                    <div className="step-nav">
                        <button
                            className="btn btn-ghost"
                            onClick={prevStep}
                            disabled={currentStep <= 1}
                            type="button"
                        >
                            ← Zurück
                        </button>
                        <div className="step-nav-right">
                            <span className="text-sm text-secondary" style={{ alignSelf: 'center' }}>
                                Schritt {currentStep} / {totalSteps}
                            </span>
                            <button
                                className="btn btn-primary"
                                onClick={nextStep}
                                disabled={currentStep >= totalSteps}
                                type="button"
                            >
                                Weiter →
                            </button>
                        </div>
                    </div>
                </main>

                {/* Right: Live Preview */}
                <div className="desktop-only">
                    <LivePreview />
                </div>
            </div>
        </>
    );
}
