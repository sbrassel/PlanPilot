// ============================================
// PlanPilot — Differentiation Engine
// ============================================

import type { Differentiation, Phase, PlanData, ClassProfile } from './types';

// --- Main Engine ---

export function generateDifferentiation(
    phase: { name: string; description: string; socialForm?: string },
    classProfile: ClassProfile,
    context: { subject: string; level: string | null }
): Differentiation {
    const needsLanguageSupport = shouldAddLanguageSupport(classProfile);
    const phaseType = detectPhaseType(phase.name, phase.description);

    return {
        niveauA: generateNiveauA(phase, phaseType, context),
        niveauB: generateNiveauB(phase, phaseType, context),
        niveauC: generateNiveauC(phase, phaseType, context),
        sentenceStarters: needsLanguageSupport ? getSentenceStarters(phaseType) : undefined,
        wordList: needsLanguageSupport ? generateWordList(phase.description, context.subject) : undefined,
        accessModes: getAccessModes(phaseType, classProfile),
        supportHints: needsLanguageSupport ? getSupportHint(classProfile, phaseType) : undefined,
    };
}

// --- Differentiate all phases ---

export function differentiatePhases(
    phases: Phase[],
    plan: PlanData
): Phase[] {
    return phases.map(phase => ({
        ...phase,
        differentiation: generateDifferentiation(
            phase,
            plan.classProfile,
            { subject: plan.subject, level: plan.level }
        ),
    }));
}

// --- Phase type detection ---

type PhaseType = 'input' | 'practice' | 'discussion' | 'creative' | 'assessment' | 'reflection' | 'general';

function detectPhaseType(name: string, description: string): PhaseType {
    const text = `${name} ${description}`.toLowerCase();

    if (/einstieg|einführ|input|erklär|inform|vorstell|präsent/.test(text)) return 'input';
    if (/üb|anwend|vertieft|arbeit|aufgab|bearbeit|training/.test(text)) return 'practice';
    if (/diskuss|debatt|gespräch|austausch|dialog|diskurs|argum/.test(text)) return 'discussion';
    if (/gestalt|kreativ|produkt|erstell|entwer|design|projekt/.test(text)) return 'creative';
    if (/prüf|test|bewert|assessment|kontroll|überprüf|evaluati/.test(text)) return 'assessment';
    if (/reflex|rückblick|auswert|meta|zusammenfass|sicher/.test(text)) return 'reflection';
    return 'general';
}

// --- Niveau A (Basis) ---

function generateNiveauA(
    phase: { name: string; description: string },
    phaseType: PhaseType,
    context: { subject: string; level: string | null }
): string {
    const scaffolds: Record<PhaseType, string[]> = {
        input: [
            'Vereinfachter Text mit Schlüsselbegriff-Markierungen.',
            'Visuelles Begleitmaterial (Bilder, Symbole) zur Unterstützung.',
            'Vorentlastung der wichtigsten Begriffe.',
        ],
        practice: [
            'Reduzierte Aufgabenanzahl (50% des Standards).',
            'Schritt-für-Schritt-Anleitung mit Beispiellösung.',
            'Hilfsblatt mit Lösungsstrategien verfügbar.',
        ],
        discussion: [
            'Gesprächshilfe mit vorformulierten Satzanfängen.',
            'Partnerarbeit statt Plenum (kleinerer Rahmen).',
            'Bildkarten als Gesprächsanlass.',
        ],
        creative: [
            'Vorlage oder Teilprodukt als Startpunkt.',
            'Klare Gestaltungskriterien als Checkliste.',
            'Reduzierte Komplexität (ein Material, eine Technik).',
        ],
        assessment: [
            'Vereinfachte Aufgabenformulierung.',
            'Multiple-Choice-Format statt offene Fragen.',
            'Mehr Bearbeitungszeit.',
        ],
        reflection: [
            'Reflexionsfragen als Ankreuz-Format.',
            'Smileys / Ampel statt Freitext.',
            'Partnerreflexion statt Einzelreflexion.',
        ],
        general: [
            'Vereinfachtes Material mit Hilfsstrukturen.',
            'Weniger Aufgaben, mehr Bearbeitungszeit.',
            'Partnerarbeit oder Tandems zur Unterstützung.',
        ],
    };

    const options = scaffolds[phaseType];
    return options.join(' ');
}

// --- Niveau B (Standard) ---

function generateNiveauB(
    phase: { name: string; description: string },
    _phaseType: PhaseType,
    _context: { subject: string; level: string | null }
): string {
    // Niveau B reflects the standard plan content
    return `Standardausführung: ${phase.description}`;
}

// --- Niveau C (Challenge) ---

function generateNiveauC(
    phase: { name: string; description: string },
    phaseType: PhaseType,
    _context: { subject: string; level: string | null }
): string {
    const extensions: Record<PhaseType, string[]> = {
        input: [
            'Vertiefende Zusatzfrage zum Weiterdenken.',
            'Vergleich mit anderem Themengebiet herstellen.',
            'Fachbegriffe auch in Fremdsprache / Fachsprache einordnen.',
        ],
        practice: [
            'Zusatzaufgaben mit erhöhtem Anforderungsniveau.',
            'Offene Problemstellung ohne vorgegebenen Lösungsweg.',
            'Transfer auf unbekannte Situationen.',
        ],
        discussion: [
            'Moderationsrolle übernehmen.',
            'Gegenargumente formulieren und verteidigen.',
            'Diskussionsergebnisse schriftlich zusammenfassen.',
        ],
        creative: [
            'Erweitertes Produkt mit zusätzlichen Gestaltungselementen.',
            'Eigene Kriterien für Qualitätsbeurteilung entwickeln.',
            'Peer-Feedback geben und einbauen.',
        ],
        assessment: [
            'Offene Analyse- oder Transferaufgaben.',
            'Eigene Aufgaben zum Thema erstellen.',
            'Fehleranalyse bei Beispiellösungen.',
        ],
        reflection: [
            'Reflexion auf Meta-Ebene: Lernstrategien analysieren.',
            'Schriftlicher Reflexionstext mit Begründung.',
            'Lernziel-Selbstbewertung mit Evidenz.',
        ],
        general: [
            'Erweiterte Aufgabenstellung mit Transferbezug.',
            'Selbstständige Vertiefung und Reflexion.',
            'Ergebnisse präsentieren oder dokumentieren.',
        ],
    };

    const options = extensions[phaseType];
    return options.join(' ');
}

// --- Language Support ---

function shouldAddLanguageSupport(profile: ClassProfile): boolean {
    return (
        ['a1', 'a2', 'b1'].includes(profile.languageLevel) ||
        profile.heterogeneity === 'high'
    );
}

function getSentenceStarters(phaseType: PhaseType): string[] {
    const starters: Record<PhaseType, string[]> = {
        input: [
            'Ich habe verstanden, dass…',
            'Das Wichtigste ist…',
            'Mir ist aufgefallen, dass…',
            'Ein Beispiel dafür ist…',
        ],
        practice: [
            'Zuerst mache ich…',
            'Dann versuche ich…',
            'Ich beginne mit…',
            'Mein nächster Schritt ist…',
        ],
        discussion: [
            'Ich denke, dass…',
            'Ich bin anderer Meinung, weil…',
            'Ich stimme zu, weil…',
            'Dazu möchte ich ergänzen, dass…',
            'Meiner Meinung nach…',
            'Ein Argument dafür ist…',
        ],
        creative: [
            'Meine Idee ist…',
            'Ich möchte darstellen, wie…',
            'Für mein Produkt verwende ich…',
            'Ich habe mich entschieden für…',
        ],
        assessment: [
            'Die Lösung ist…, weil…',
            'Ich habe herausgefunden, dass…',
            'Der Unterschied zwischen X und Y ist…',
        ],
        reflection: [
            'Heute habe ich gelernt, dass…',
            'Schwierig war für mich…',
            'Beim nächsten Mal möchte ich…',
            'Besonders gut gelungen ist…',
            'Ich habe mein Ziel erreicht, weil…',
        ],
        general: [
            'Ich denke, dass…',
            'Mir ist aufgefallen, dass…',
            'Ich habe bemerkt, dass…',
            'Das bedeutet, dass…',
        ],
    };

    return starters[phaseType];
}

function generateWordList(description: string, subject: string): string[] {
    // Extract key terms from description (words > 4 chars, capitalized in original, or domain-specific)
    const text = `${description} ${subject}`;
    const words = text.match(/[A-ZÄÖÜ][a-zäöüß]{3,}/g) || [];
    const unique = [...new Set(words)];

    // Add some domain-specific terms based on subject patterns
    const domainTerms: string[] = [];
    const subjectLower = subject.toLowerCase();

    if (subjectLower.includes('mathe')) {
        domainTerms.push('Gleichung', 'Variable', 'Ergebnis', 'Operation', 'Berechnung');
    } else if (subjectLower.includes('deutsch')) {
        domainTerms.push('Textsorte', 'Absatz', 'Argument', 'Hauptaussage', 'Zusammenfassung');
    } else if (subjectLower.includes('nmg') || subjectLower.includes('natur')) {
        domainTerms.push('Experiment', 'Hypothese', 'Beobachtung', 'Ergebnis', 'Lebensraum');
    } else if (subjectLower.includes('geschich') || subjectLower.includes('rzg')) {
        domainTerms.push('Quelle', 'Epoche', 'Ursache', 'Wirkung', 'Ereignis');
    }

    return [...unique.slice(0, 6), ...domainTerms.slice(0, 4)].slice(0, 8);
}

function getAccessModes(
    phaseType: PhaseType,
    profile: ClassProfile
): ('text' | 'visual' | 'audio' | 'product')[] {
    const modes: ('text' | 'visual' | 'audio' | 'product')[] = ['text'];

    // Always add visual for A1/A2 or high heterogeneity
    if (['a1', 'a2'].includes(profile.languageLevel) || profile.heterogeneity === 'high') {
        modes.push('visual');
    }

    // Add audio for input/discussion phases or low language levels
    if (['input', 'discussion'].includes(phaseType) || ['a1', 'a2'].includes(profile.languageLevel)) {
        if (!modes.includes('audio')) modes.push('audio');
    }

    // Add product for creative/practice phases
    if (['creative', 'practice'].includes(phaseType)) {
        modes.push('product');
    }

    return modes;
}

function getSupportHint(profile: ClassProfile, phaseType: PhaseType): string {
    const hints: string[] = [];

    if (['a1', 'a2'].includes(profile.languageLevel)) {
        hints.push('Schlüsselwörter vorentlasten und an der Tafel sichtbar machen.');
        hints.push('Einfache Sprache verwenden, komplexe Sätze aufteilen.');
    }

    if (profile.languageLevel === 'b1') {
        hints.push('Fachbegriffe mit Erklärungen versehen.');
    }

    if (profile.heterogeneity === 'high') {
        hints.push('Partnersystem (stärkere/schwächere SuS im Tandem) einsetzen.');
    }

    if (phaseType === 'discussion' && ['a1', 'a2', 'b1'].includes(profile.languageLevel)) {
        hints.push('Gesprächsregeln visuell aufhängen. Sprechzeit in kleinen Gruppen maximieren.');
    }

    return hints.join(' ');
}
