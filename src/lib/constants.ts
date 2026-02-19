// ============================================
// PlanPilot — Constants & Configuration
// ============================================

import type { StepConfig } from './types';

// --- Level Labels ---
export const LEVEL_OPTIONS = [
    { value: 'kg', label: 'Kindergarten' },
    { value: 'primar', label: 'Primar' },
    { value: 'sek1', label: 'Sek I' },
    { value: '10sj', label: '10. Schuljahr' },
    { value: 'gymnasium', label: 'Gymnasium' },
] as const;

// --- Duration Options ---
export const DURATION_OPTIONS = [
    { value: 45, label: '45 Min' },
    { value: 60, label: '60 Min' },
    { value: 90, label: '90 Min' },
] as const;

// --- Learning Goal Types ---
export const LEARNING_GOAL_OPTIONS = [
    { value: 'knowledge', label: 'Wissen' },
    { value: 'application', label: 'Anwendung' },
    { value: 'reflection', label: 'Reflexion' },
    { value: 'transfer', label: 'Transfer' },
] as const;

// --- Heterogeneity ---
export const HETEROGENEITY_OPTIONS = [
    { value: 'low', label: 'Gering' },
    { value: 'medium', label: 'Mittel' },
    { value: 'high', label: 'Hoch' },
] as const;

// --- Language Level ---
export const LANGUAGE_LEVEL_OPTIONS = [
    { value: 'a1', label: 'A1' },
    { value: 'a2', label: 'A2' },
    { value: 'b1', label: 'B1' },
    { value: 'b2', label: 'B2' },
    { value: 'c1', label: 'C1' },
    { value: 'c2', label: 'C2' },
] as const;

// --- Didactic Slot 1: Structure Models ---
export const STRUCTURE_MODELS = [
    { value: 'aviva', label: 'AVIVA', description: 'Ankommen, Vorwissen, Informieren, Verarbeiten, Auswerten' },
    { value: 'direct_instruction', label: 'Direkte Instruktion', description: 'Klare, lehrpersonengesteuerte Vermittlung' },
    { value: '5e', label: '5E', description: 'Engage, Explore, Explain, Elaborate, Evaluate' },
    { value: 'workshop', label: 'Workshop / Atelier', description: 'Offene Lernumgebung mit Stationen' },
    { value: 'project_cycle', label: 'Projektzyklus', description: 'Planen, Durchführen, Präsentieren, Reflektieren' },
] as const;

// --- Didactic Slot 2: Learning Modes ---
export const LEARNING_MODES = [
    { value: 'cooperative', label: 'Kooperatives Lernen', description: 'Think-Pair-Share, Jigsaw, Gruppenpuzzle' },
    { value: 'problem_based', label: 'Problemorientiert', description: 'Authentische Problemstellungen lösen' },
    { value: 'inquiry', label: 'Inquiry / Forschend', description: 'Fragen stellen, untersuchen, Ergebnisse teilen' },
    { value: 'project_based', label: 'Projektbasiert', description: 'Reales Produkt in längeren Phasen erstellen' },
    { value: 'practice', label: 'Übungsmodus', description: 'Gezieltes Üben und Vertiefen' },
    { value: 'discourse', label: 'Diskurs / Debatte', description: 'Argumente entwickeln und austauschen' },
] as const;

// --- Didactic Slot 3: Quality Layers ---
export const QUALITY_LAYERS = [
    { value: 'four_k', label: '4K', description: 'Kreativität, Kritisches Denken, Kommunikation, Kollaboration' },
    { value: 'deeper_learning', label: 'Deeper Learning', description: 'Tiefes Verständnis und Transfer' },
    { value: 'language_sensitive', label: 'Sprachsensibler Unterricht', description: 'Scaffolding, Wortschatz, Satzbausteine' },
    { value: 'formative_assessment', label: 'Formatives Assessment', description: 'Lernprozessbegleitende Beurteilung' },
    { value: 'udl', label: 'UDL', description: 'Universal Design for Learning — Mehrfachzugänge' },
    { value: 'self_regulated', label: 'Selbstreguliertes Lernen', description: 'Lernstrategien, Metakognition, Planung' },
    { value: 'gamification', label: 'Gamification light', description: 'Spielelemente für Motivation' },
] as const;

// --- Incompatible Didactic Combinations ---
export const INCOMPATIBLE_COMBOS: Array<{
    slot1?: string;
    slot2?: string;
    slot3?: string;
    reason: string;
    alternative: string;
}> = [
        {
            slot1: 'direct_instruction',
            slot2: 'inquiry',
            reason: 'Direkte Instruktion und Forschendes Lernen widersprechen sich im Steuerungsgrad.',
            alternative: '5E mit Inquiry kombinieren oder Direkte Instruktion mit Übungsmodus.',
        },
        {
            slot1: 'direct_instruction',
            slot2: 'project_based',
            reason: 'Direkte Instruktion ist stark lehrerzentriert, Projektbasiertes Lernen stark schülerzentriert.',
            alternative: 'Workshop/Atelier mit Projektbasiertem Lernen oder Direkte Instruktion mit Übungsmodus.',
        },
        {
            slot2: 'practice',
            slot3: 'gamification',
            reason: 'Übungsmodus mit Gamification kann zu oberflächlicher Beschäftigung führen.',
            alternative: 'Übungsmodus mit Formativem Assessment oder Gamification mit Kooperativem Lernen.',
        },
    ];

// --- Wizard Steps (Einzelstunde) ---
export const SINGLE_STEPS: StepConfig[] = [
    { id: 1, title: 'Kontext', description: 'Stufe, Fach, Dauer, Klassenprofil', isGate: false },
    { id: 2, title: 'Ziele & Lehrplan', description: 'Lernziele und Kompetenz-Mapping', isGate: false },
    { id: 3, title: 'Didaktik', description: 'Strukturmodell, Lernmodus, Qualitätslayer', isGate: false },
    { id: 4, title: 'KI-Kurzversion', description: 'Automatische Planerstellung', isGate: false },
    { id: 5, title: 'Anpassen', description: 'Kurzversion bearbeiten', isGate: true, gateLabel: 'GATE A' },
    { id: 6, title: 'KI-Überarbeitung', description: 'Überarbeitete Version prüfen', isGate: false },
    { id: 7, title: 'Freigabe', description: 'Kurzversion bestätigen', isGate: true, gateLabel: 'GATE B' },
    { id: 8, title: 'Detailplanung', description: 'Vollständige Unterrichtsplanung', isGate: false },
    { id: 9, title: 'Export', description: 'PDF/DOCX herunterladen', isGate: false },
];

// --- Wizard Steps (Sequenz) ---
export const SEQUENCE_STEPS: StepConfig[] = [
    { id: 1, title: 'Kontext', description: 'Stufe, Fach, Lektionenanzahl', isGate: false },
    { id: 2, title: 'Ziele & Lehrplan', description: 'Übergeordnete Kompetenzen', isGate: false },
    { id: 3, title: 'Didaktik', description: 'Strukturmodell, Lernmodus, Qualitätslayer', isGate: false },
    { id: 4, title: 'Sequenz-Skelett', description: 'KI erstellt Lektionsübersicht', isGate: false },
    { id: 5, title: 'Sequenz anpassen', description: 'Reihenfolge und Fokus bearbeiten', isGate: true, gateLabel: 'GATE S1' },
    { id: 6, title: 'KI-Überarbeitung', description: 'Überarbeitete Sequenz prüfen', isGate: false },
    { id: 7, title: 'Sequenz freigeben', description: 'Sequenz bestätigen', isGate: true, gateLabel: 'GATE S2' },
    { id: 8, title: 'Detailplanung', description: 'Details pro Lektion', isGate: false },
    { id: 9, title: 'Export', description: 'PDF/DOCX herunterladen', isGate: false },
];

// --- Plan Mode Labels ---
export const MODE_OPTIONS = [
    { value: 'single', label: 'Einzelstunde', description: 'Eine Lektion planen (45–90 Min)', icon: '📄' },
    { value: 'sequence', label: 'Sequenz', description: '3–12 Lektionen mit Progression', icon: '📚' },
] as const;
