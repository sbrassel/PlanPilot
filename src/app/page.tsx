'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { usePlanStore } from '@/lib/store';

export default function Dashboard() {
  const { resetPlan } = usePlanStore();

  return (
    <>
      <Navbar />
      <main className="dashboard">
        <div className="dashboard-hero">
          <h1>PlanPilot</h1>
          <p>
            Intelligente Unterrichtsplanung — schneller planen, didaktisch besser unterrichten.
          </p>
          <Link href="/plan/new" className="btn btn-primary btn-lg" onClick={() => resetPlan()}>
            ✨ Neuen Plan erstellen
          </Link>
        </div>

        <div className="dashboard-features">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <div className="feature-title">Didaktik-Slots</div>
            <div className="feature-desc">
              3 Slots für Strukturmodell, Lernmodus und Qualitätslayer — maximal fokussiert.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">A/B/C Differenzierung</div>
            <div className="feature-desc">
              Jede Planung enthält automatisch Basis, Standard und Challenge.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">Qualitäts-Gates</div>
            <div className="feature-desc">
              Erst Kurzversion anpassen, dann freigeben — erst danach Detailplanung.
            </div>
          </div>
        </div>

        <div className="dashboard-features" style={{ marginTop: 'var(--space-4)' }}>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <div className="feature-title">Sprachsensibel</div>
            <div className="feature-desc">
              Automatische Sprachstützen für heterogene Klassen (A2/B1).
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <div className="feature-title">Sequenzmodus</div>
            <div className="feature-desc">
              3–12 Lektionen als Sequenz planen, mit Progression und Zwischenchecks.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <div className="feature-title">Lehrplan 21</div>
            <div className="feature-desc">
              Kompetenzen direkt zuordnen, mit Confidence-Score und Bestätigung.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
