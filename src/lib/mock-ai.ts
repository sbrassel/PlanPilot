// ============================================
// PlanPilot — Didactic Engine (Mock 3.0 - High Fidelity)
// ============================================

import type { ShortVersion, DetailPlan, SequenceSkeleton, PlanData, Phase } from './types';
import { differentiatePhases } from './differentiation-engine';

// ─── Public API ─────────────────────────────────────────────────────────────

export async function generateShortVersion(plan: PlanData): Promise<ShortVersion> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const ctx = analyzeContext(plan);
    const phases = buildLessonFlow(ctx, plan);
    const summary = phases.map(p => ({
        name: p.name.replace(/^\d+'\s/, ''),
        durationMinutes: p.durationMinutes,
        description: p.description
    }));

    const structureLabel = getStructureLabel(plan.didacticSlots.slot1);

    return {
        title: plan.title || `${plan.subject} — ${structureLabel}`,
        overview: `Diese ${plan.durationMinutes}-minütige Lektion basiert auf dem Konzept «${ctx.thresholdConcept}». Sie folgt dem Prinzip des Backward Design und fokussiert auf kognitive Aktivierung.`,
        goals: plan.goals.length > 0 ? plan.goals : generateLearningGoals(plan),
        phasesSummary: summary,
        differentiationSummary: {
            niveauA: `Basis: Fokus auf Reproduktion und geführte Anwendung.`,
            niveauB: `Standard: Selbstständige Bearbeitung mit Transfer-Anteil.`,
            niveauC: `Challenge: Metakognitive Reflexion und komplexer Transfer.`,
            sentenceStarters: ['Ich vermute, dass...', 'Ein Argument dafür ist...', 'Im Vergleich dazu...'],
            wordList: ctx.keywords,
            accessModes: ['text', 'visual', 'audio'],
            supportHints: 'Scaffolding durch Visualisierung des Denkprozesses.',
        },
        languageSupports: [
            'Wortspeicher mit Fachbegriffen',
            'Satzmuster für Argumentation',
            'Visualisierung der Operatoren'
        ]
    };
}

export async function generateDetailPlan(plan: PlanData): Promise<DetailPlan> {
    await new Promise(resolve => setTimeout(resolve, 2500));

    const ctx = analyzeContext(plan);
    const rawPhases = buildLessonFlow(ctx, plan);
    const phases = differentiatePhases(rawPhases, plan);

    // High-Fidelity Components
    const diagnosis = generateDidacticDiagnosis(ctx);
    const rubric = generateRubric(ctx);

    return {
        phases,
        planBIncluded: true,
        reflectionNotes: 'Reflexion: Wurde das "Threshold Concept" von der Mehrheit verstanden? War die kognitive Aktivierung hoch genug?',
        // Block L Fields
        didacticDiagnosis: diagnosis,
        assessmentRubric: rubric
    };
}

export async function generateSequenceSkeleton(plan: PlanData): Promise<SequenceSkeleton> {
    const lessonCount = plan.lessonCount || 4;
    const subject = plan.subject || plan.topicDescription || 'Thema';
    const lessons = [];

    // Context-aware phase names depending on position
    const phaseNames = (i: number, total: number): { title: string; focus: string; goals: string[] } => {
        if (i === 1) return {
            title: `Einstieg: ${subject} entdecken`,
            focus: 'Vorwissen aktivieren & Problemstellung erschliessen',
            goals: [`Die SuS können ihr Vorwissen zu «${subject}» aktivieren und eigene Fragen formulieren.`]
        };
        if (i === total) return {
            title: `Abschluss: ${subject} reflektieren`,
            focus: 'Transfer, Reflexion & Lernprodukt sichern',
            goals: [`Die SuS können das Gelernte zu «${subject}» auf eine neue Situation übertragen und ihren Lernprozess reflektieren.`]
        };
        if (i === 2) return {
            title: `Grundlagen: ${subject} erarbeiten`,
            focus: 'Basiswissen erarbeiten & strukturieren',
            goals: [`Die SuS können die Grundbegriffe und -konzepte zu «${subject}» erklären.`]
        };
        if (i === total - 1) return {
            title: `Vertiefung: ${subject} anwenden`,
            focus: 'Anwendung in komplexeren Kontexten',
            goals: [`Die SuS können die erarbeiteten Konzepte zu «${subject}» auf neue Probleme anwenden.`]
        };
        return {
            title: `Erarbeitung ${i - 1}: ${subject} vertiefen`,
            focus: 'Systematische Erarbeitung & Übung',
            goals: [`Die SuS können Teilaspekte von «${subject}» eigenständig erarbeiten und üben.`]
        };
    };

    for (let i = 1; i <= lessonCount; i++) {
        const phase = phaseNames(i, lessonCount);
        lessons.push({
            id: `l-${i}`,
            lessonNumber: i,
            title: `Lektion ${i}: ${phase.title}`,
            focus: phase.focus,
            goals: phase.goals,
            durationMinutes: plan.durationMinutes || 45,
            intermediateCheck: i === Math.ceil(lessonCount / 2) ? 'Formative Lernstandserhebung — kurzes Quiz oder Peer-Feedback' : undefined
        });
    }

    return {
        lessons,
        progression: `Spiralcurricular: Aufbau von Grundlagen zu «${subject}» über Erarbeitung und Vertiefung bis zur Reflexion und Transfer.`,
        overallGoals: [
            `Die SuS können «${subject}» in seinen Grundzügen erklären.`,
            `Die SuS können das Gelernte auf neue Situationen anwenden.`
        ]
    };
}

export async function generateLessonDetail(plan: PlanData, _lessonIndex: number): Promise<DetailPlan> {
    // Delegate to the full engine which already handles context
    return generateDetailPlan(plan);
}

export async function refineDetailPlan(currentPlan: DetailPlan, instruction: string): Promise<DetailPlan> {
    const lower = instruction.toLowerCase();
    const refined = JSON.parse(JSON.stringify(currentPlan)) as DetailPlan;

    // Keyword-based transformations
    if (lower.includes('kürz') || lower.includes('kurz') || lower.includes('schneller')) {
        // Shorten longest phase
        const sorted = [...refined.phases].sort((a, b) => b.durationMinutes - a.durationMinutes);
        if (sorted.length > 0) {
            sorted[0].durationMinutes = Math.max(5, Math.round(sorted[0].durationMinutes * 0.6));
            sorted[0].description += ' (gekürzt)';
        }
    }

    if (lower.includes('gruppenarbeit') || lower.includes('gruppe') || lower.includes('kooperativ')) {
        const mainPhases = refined.phases.filter(p =>
            !p.name.toLowerCase().includes('einstieg') && !p.name.toLowerCase().includes('abschluss')
        );
        mainPhases.forEach(p => {
            p.socialForm = 'Gruppenarbeit (3–4 SuS)';
            if (p.teacherActions) {
                p.teacherActions = p.teacherActions.replace(/Plenum|Einzelarbeit/gi, 'Gruppenarbeit');
            }
        });
    }

    if (lower.includes('quiz') || lower.includes('test') || lower.includes('prüf')) {
        const lastPhase = refined.phases[refined.phases.length - 1];
        if (lastPhase) {
            lastPhase.description += ' Inkl. kurzes formatives Quiz zur Lernstandserhebung.';
        }
    }

    if (lower.includes('digital') || lower.includes('tablet') || lower.includes('app')) {
        refined.phases.forEach(p => {
            if (!p.materials) p.materials = [];
            if (!p.materials.some(m => m.toLowerCase().includes('tablet'))) {
                p.materials.push('Tablets / digitale Endgeräte');
            }
        });
    }

    if (lower.includes('differenz') || lower.includes('niveau')) {
        refined.phases.forEach(p => {
            p.differentiation.niveauA += ' — mit zusätzlichem Scaffolding und Hilfsstruktur.';
            p.differentiation.niveauC += ' — erweiterte Vertiefungsaufgabe.';
        });
    }

    return refined;
}

export async function reviseShortVersion(current: ShortVersion, prompt: string): Promise<ShortVersion> {
    return current;
}


// ─── 1. Didactic Context Analysis ──────────────────────────────────────────

interface LessonContext {
    topic: string;
    level: string;
    keywords: string[];
    method: 'active' | 'passive' | 'project' | 'mixed';
    thresholdConcept: string;
    misconception: string;
    relevance: string;
}

function analyzeContext(plan: PlanData): LessonContext {
    const text = (plan.title + ' ' + plan.subject + ' ' + (plan.topicDescription || '')).toLowerCase();
    const topic = plan.subject || 'Thema';

    // Keyword Extraction
    const keywords = text.split(/\s+/).filter(w => w.length > 5);

    // Threshold Concept & Misconception Generator (Mock Logic)
    let threshold = `Das Prinzip der Kausalität in ${topic}`;
    let misconception = `Dass ${topic} statisch ist und nicht prozesshaft.`;
    let relevance = `Verständnis von ${topic} ist essentiell für die Teilhabe an der Gesellschaft.`;

    if (text.includes('strom') || text.includes('physik')) {
        threshold = 'Der geschlossene Stromkreis und der Energiefluss';
        misconception = 'Strom wird "verbraucht" (statt Energieumwandlung)';
        relevance = 'Sicherer Umgang mit Elektrizität im Alltag.';
    } else if (text.includes('geschichte') || text.includes('zeit')) {
        threshold = 'Multiperspektivität von Quellen';
        misconception = 'Geschichte ist "objektive Wahrheit"';
        relevance = 'Erkennen von Manipulation in Medien heute.';
    } else if (text.includes('ethik') || text.includes('fussball') || text.includes('kommerzialisierung')) {
        threshold = 'Spannungsfeld zwischen Tradition und Marktlogik';
        misconception = 'Dass Kommerzialisierung nur "böse" ist (Multiperspektivität fehlt)';
        relevance = 'Kritische Konsumentenentscheidungen treffen.';
    }

    return {
        topic,
        level: plan.level || 'sek1',
        keywords,
        method: text.includes('projekt') ? 'project' : 'mixed',
        thresholdConcept: threshold,
        misconception,
        relevance
    };
}

// ─── 2. Goal Generation (Master Prompt) ────────────────────────────────────

export function generateLearningGoals(plan: PlanData): string[] {
    const ctx = analyzeContext(plan);
    const specificTopic = plan.topicDescription || ctx.topic;

    return [
        `Die SuS können die Kernmerkmale von «${specificTopic}» analysieren, indem sie fachspezifische Quellen untersuchen und die Zusammenhänge in einer Mindmap strukturieren.`,
        `Die SuS können beurteilen, inwiefern das Konzept «${ctx.thresholdConcept}» in Bezug auf ${specificTopic} relevant ist.`,
        `Die SuS können ihr Wissen auf ein konkretes Fallbeispiel zu ${specificTopic} transferieren und begründete Lösungsansätze entwickeln.`
    ];
}

// ─── 3. Didactic Components (Block L) ──────────────────────────────────────

function generateDidacticDiagnosis(ctx: LessonContext) {
    return {
        coreConcept: ctx.thresholdConcept,
        misconceptions: [
            ctx.misconception,
            'Fehlende Unterscheidung zwischen Ursache und Wirkung',
            'Übergenzealisierung von Einzelfällen'
        ],
        thresholdConcept: ctx.thresholdConcept,
        relevance: ctx.relevance
    };
}

function generateRubric(ctx: LessonContext) {
    return [
        {
            criteria: 'Fachverständnis',
            levelA: 'Nennt Basisbegriffe korrekt.',
            levelB: 'Erklärt Zusammenhänge verständlich.',
            levelC: 'Analysiert komplexe Wechselwirkungen.'
        },
        {
            criteria: 'Methodenkompetenz',
            levelA: 'Führt Arbeitsschritte nach Anleitung aus.',
            levelB: 'Plant das Vorgehen selbstständig.',
            levelC: 'Reflektiert das methodische Vorgehen kritisch.'
        },
        {
            criteria: 'Kommunikation',
            levelA: 'Verwendet Alltagssprache.',
            levelB: 'Nutzt Fachbegriffe meist korrekt.',
            levelC: 'Argumentiert präzise und adressatengerecht.'
        }
    ];
}

// ─── 4. Lesson Design (High Fidelity) ──────────────────────────────────────

// ─── 4. Lesson Design (High Fidelity) ──────────────────────────────────────

function buildLessonFlow(ctx: LessonContext, plan: PlanData): Phase[] {
    const dur = plan.durationMinutes;
    const structure = (plan as any).didacticSlots?.slot1 || 'standard';

    if (structure === 'aviva') {
        // AVIVA Structure (High Fidelity)

        // A - Ankommen & Aktivieren
        const tA = Math.round(dur * 0.15);
        const p1 = {
            name: 'A — Ankommen & Aktivieren',
            desc: `Herstellen von Präsenz und kognitive Aktivierung durch ${ctx.misconception}.`,
            teacher: `LP begrüsst und präsentiert das "Threshold Concept" als Rätsel/Bild.\nLP: "Stimmt das so?" (Provokation)`,
            child: `SuS kommen mental an, prüfen das Rätsel und bilden erste Hypothesen.`,
            op: 'Hypothesen bilden',
            check: 'Blitzlicht: Wer hat eine Idee?'
        };

        // V - Vorwissen
        const tV = Math.round(dur * 0.15);
        const p2 = {
            name: 'V — Vorwissen aktivieren',
            desc: 'Explizitmachung der Präkonzepte.',
            teacher: `LP fordert SuS auf, ihr Vorwissen zu notieren (Cluster).\nLP clustert an der Tafel nach Kategorien.`,
            child: `SuS notieren Assoziationen und verknüpfen sie mit dem neuen Thema.`,
            op: 'Assoziieren & Strukturieren',
            check: 'Cluster an der Tafel.'
        };

        // I - Informieren
        const tI = Math.round(dur * 0.25);
        const p3 = {
            name: 'I — Informieren',
            desc: 'Instruktion und Erarbeitung neuer Inhalte.',
            teacher: `LP präsentiert den Kerninhalt (Input). Fokus auf ${ctx.keywords[0] || 'Kernbegriff'}.\nLP nutzt Visualisierungen (Dual Coding).`,
            child: `SuS folgen dem Input, machen Notizen (Cornertaking) und stellen Verständnisfragen.`,
            op: 'Aufnehmen & Verarbeiten',
            check: 'Verständnisfrage (Hinge Point Question).'
        };

        // V - Verarbeiten
        const tVer = Math.round(dur * 0.30);
        const p4 = {
            name: 'V — Verarbeiten',
            desc: 'Vertiefte Auseinandersetzung und Anwendung.',
            teacher: `LP gibt Übungsaufgaben (gestuft A/B/C).\nLP coacht und gibt formativ Feedback.`,
            child: `SuS wenden das Wissen auf ein Fallbeispiel an.\nSie lösen das Einstiegs-Rätsel neu.`,
            op: 'Anwenden & Transferieren',
            check: 'Lernprodukt (z.B. Lösungsskizze).'
        };

        // A - Auswerten
        const tEnd = dur - (tA + tV + tI + tVer);
        const p5 = {
            name: 'A — Auswerten',
            desc: 'Metakognitive Reflexion des Lernprozesses.',
            teacher: `LP fragt: "Wie hat sich eure Meinung verändert?"\nLP würdigt den Zuwachs an Fachsprache.`,
            child: `SuS vergleichen Vorwissen (V) mit neuem Wissen (I).`,
            op: 'Reflektieren (Metakognition)',
            check: 'Rubrik-Selbsteinschätzung.'
        };

        return [
            createPhase(1, tA, p1),
            createPhase(2, tV, p2),
            createPhase(3, tI, p3),
            createPhase(4, tVer, p4),
            createPhase(5, tEnd, p5)
        ];

    } else {
        // Standard Structure (Cognitive Activation focus)
        const t1 = Math.round(dur * 0.15);
        const t4 = Math.round(dur * 0.15);
        const rest = dur - t1 - t4;
        const t2 = Math.round(rest * 0.6);
        const t3 = rest - t2;

        const p1 = {
            name: 'Einstieg: Kognitive Dissonanz',
            desc: `Konfrontation mit ${ctx.misconception}.`,
            teacher: `LP: "Viele denken, dass... aber ist das wahr?"`,
            child: `SuS diskutieren den Widerspruch.`,
            op: 'Problematisieren',
            check: 'Meinungsbild.'
        };
        const p2 = {
            name: 'Erarbeitung: Deep Dive',
            desc: `Analyse von Material zu «${ctx.topic}».`,
            teacher: `LP moderiert und scaffolded den Prozess.`,
            child: `SuS bearbeiten Material analytisch.`,
            op: 'Analysieren',
            check: 'Zwischenergebnis.'
        };
        const p3 = {
            name: 'Sicherung & Transfer',
            desc: 'Synthese der Ergebnisse.',
            teacher: `LP bündelt die Erkenntnisse.`,
            child: `SuS präsentieren und transferieren.`,
            op: 'Synthetisieren',
            check: 'Präsentation.'
        };
        const p4 = {
            name: 'Abschluss: Meta-View',
            desc: 'Rückblick auf das Lernen.',
            teacher: `LP: "Was war heute die schwierigste Hürde?"`,
            child: `SuS reflektieren ihren Lernweg.`,
            op: 'Reflektieren',
            check: 'Exit-Ticket.'
        };

        return [
            createPhase(1, t1, p1),
            createPhase(2, t2, p2),
            createPhase(3, t3, p3),
            createPhase(4, t4, p4)
        ];
    }
}

function createPhase(id: number, dur: number, template: any): Phase {
    return {
        id: `p-${id}`,
        name: `${dur}' ${template.name}`,
        durationMinutes: dur,
        description: template.desc,
        teacherActions: `${template.teacher}`,
        childActions: `${template.child}\n(Denkoperation: ${template.op})`,
        didacticComment: `Checkpoint: ${template.check}`,
        materials: ['Arbeitsmaterial', 'Beamer', 'Moderatorenkoffer'],
        socialForm: id === 2 ? 'Partner-/Gruppenarbeit' : 'Plenum',
        differentiation: {
            niveauA: 'Stark vorstrukturiert, Fokus auf Basisbegriffe.',
            niveauB: 'Standard-Auftrag mit Hilfekarten.',
            niveauC: 'Offene Aufgabenstellung, Transferforderung.'
        },
        planBAlternative: 'Lehrervortrag mit Tafelbild (bei Technik-Ausfall).'
    };
}

function getStructureLabel(slot: string | null): string {
    return slot ? slot.toUpperCase() : 'Standard';
}
