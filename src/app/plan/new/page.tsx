'use client';

import Navbar from '@/components/layout/Navbar';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import WizardLayout from '@/components/wizard/WizardLayout';

export default function NewPlanPage() {
    return (
        <>
            <Navbar />
            <ErrorBoundary>
                <WizardLayout />
            </ErrorBoundary>
        </>
    );
}
