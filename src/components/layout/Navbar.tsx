'use client';

import Link from 'next/link';
import { usePlanStore } from '@/lib/store';

export default function Navbar() {
    const { canUndo, canRedo, undo, redo, resetPlan } = usePlanStore();

    return (
        <header className="navbar">
            <Link href="/" className="navbar-brand">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
                PlanPilot
            </Link>
            <nav className="navbar-nav">
                <Link href="/" className="active">Dashboard</Link>
                <Link href="/plan/new" onClick={() => resetPlan()}>Neuer Plan</Link>
            </nav>
            <div className="navbar-actions">
                <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={undo}
                    disabled={!canUndo()}
                    title="Rückgängig (Ctrl+Z)"
                    aria-label="Rückgängig"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 7h7a4 4 0 0 1 0 8H7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 4L3 7l3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={redo}
                    disabled={!canRedo()}
                    title="Wiederherstellen (Ctrl+Y)"
                    aria-label="Wiederherstellen"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M13 7H6a4 4 0 0 0 0 8h3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 4l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <div className="navbar-avatar" title="Lehrkraft">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="10" cy="7" r="3" />
                        <path d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6" />
                    </svg>
                </div>
            </div>
        </header>
    );
}
