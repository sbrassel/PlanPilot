import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Allow responses up to 90 seconds (detail plans are longer)
export const maxDuration = 90;

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const shortSchema = z.object({
    title: z.string().describe('Ein kurzer, prägnanter Titel für die Lektion.'),
    overview: z.string().describe('Eine Zusammenfassung des Lektionsablaufs und des didaktischen Fokus.'),
    goals: z.array(z.string()).describe('3-4 präzise Lernziele nach dem Muster: "Die SuS können [Handlung], indem sie [Methode/Inhalt], und zeigen dies durch [Produkt/Leistung].". Vermeide generische Platzhalter.'),
    phasesSummary: z.array(z.object({
        name: z.string(),
        durationMinutes: z.number(),
        description: z.string()
    })).describe('Eine Übersicht über die Phasen der Lektion.'),
    differentiationSummary: z.object({
        niveauA: z.string(),
        niveauB: z.string(),
        niveauC: z.string(),
        sentenceStarters: z.array(z.string()),
        wordList: z.array(z.string()),
        accessModes: z.array(z.string()),
        supportHints: z.string(),
    }),
    languageSupports: z.array(z.string())
});

const detailSchema = z.object({
    phases: z.array(z.object({
        id: z.string(),
        name: z.string().describe('Name der Phase (z.B. "Einstieg: Provokation" oder "A — Ankommen & Aktivieren")'),
        durationMinutes: z.number(),
        description: z.string().describe('Kurze Zusammenfassung, was in dieser Phase inhaltlich passiert.'),
        teacherActions: z.string().describe(
            'KONKRETES DREHBUCH für die Lehrperson. Schreibe in der 3. Person, was die LP tut und WÖRTLICH sagt. ' +
            'Beispiel: \'LP zeigt Bild auf Beamer und fragt: «Was seht ihr? Was fällt euch auf?» LP sammelt 3–4 Antworten an der Tafel. ' +
            'LP gibt dann den Arbeitsauftrag: «Ihr habt jetzt 10 Minuten, um in der Gruppe…»\' ' +
            'Schreibe MINDESTENS 4–6 Sätze. Gib konkrete Fragen, Satzanfänge und Handlungsanweisungen.'
        ),
        childActions: z.string().describe(
            'KONKRETES DREHBUCH für die Schüler:innen. Schreibe in der 3. Person, was die SuS tun. ' +
            'Beispiel: \'Die SuS betrachten das Bild und notieren ihre Beobachtungen auf Post-Its (1 Beobachtung pro Post-It). ' +
            'Sie tauschen ihre Post-Its in der Tischgruppe aus und ordnen sie nach Kategorien. ' +
            'Eine Person aus jeder Gruppe präsentiert die 2 wichtigsten Erkenntnisse im Plenum.\' ' +
            'Schreibe MINDESTENS 4–6 Sätze. Gib konkrete Aktivitäten, Produkte und Zeitangaben.'
        ),
        didacticComment: z.string().describe('Kurze fachdidaktische Begründung: Warum diese Methode? Welche Kompetenz wird gefördert?'),
        materials: z.array(z.string()).describe('Konkrete Materialien mit Quellenangabe wenn möglich (z.B. "Video: MrWissen2Go — Bundesstaat Schweiz (3:45 min)", "Arbeitsblatt A: Lückentext mit Wortbank")'),
        socialForm: z.string().describe('Sozialform: Plenum, Einzelarbeit, Partnerarbeit, Gruppenarbeit (3-4 SuS), Think-Pair-Share, Kugellager, etc.'),
        differentiation: z.object({
            niveauA: z.string().describe('Basis: Konkrete Hilfen (Satzanfänge, Bildkarten, Wortbank, vereinfachter Text). KEINE leeren Floskeln.'),
            niveauB: z.string().describe('Standard: Was die meisten SuS machen. Klare Aufgabenstellung.'),
            niveauC: z.string().describe('Challenge: Echte Vertiefung (Expertenrolle, komplexere Quelle, Peer-Tutoring). KEINE "Zusatzblätter".')
        }),
        planBAlternative: z.string().describe('Konkrete Alternative falls die Hauptaktivität scheitert (z.B. Technikausfall, SuS unruhig, zu wenig Zeit).')
    })).describe('MINDESTENS 4 Phasen. Bei AVIVA zwingend 5 Phasen (A-V-I-V-A). Bei Standard mindestens 4 Phasen (Einstieg, Erarbeitung I, Erarbeitung II/Vertiefung, Sicherung).'),
    planBIncluded: z.boolean(),
    reflectionNotes: z.string().describe('Konkrete Reflexionsfragen für die LP nach der Lektion (mind. 3 Fragen).'),
    didacticDiagnosis: z.object({
        coreConcept: z.string().describe('Das zentrale Konzept, das die SuS verstehen sollen.'),
        misconceptions: z.array(z.string()).describe('2-3 typische Fehlvorstellungen der SuS zu diesem Thema.'),
        thresholdConcept: z.string().describe('Das "Schwellenkonzept" (Threshold Concept) — der Aha-Moment, der das Verständnis verändert.'),
        relevance: z.string().describe('Warum ist dieses Thema für die SuS relevant? Lebensweltbezug.')
    }),
    assessmentRubric: z.array(z.object({
        criteria: z.string(),
        levelA: z.string(),
        levelB: z.string(),
        levelC: z.string()
    })).describe('2-3 Bewertungskriterien mit konkreten Niveaubeschreibungen.')
});

const sequenceSchema = z.object({
    progression: z.string().describe('Kurze Beschreibung des logischen Aufbaus der Sequenz.'),
    overallGoals: z.array(z.string()).describe('Übergeordnete Lernziele für die gesamte Sequenz.'),
    lessons: z.array(z.object({
        lessonNumber: z.number(),
        title: z.string(),
        focus: z.string().describe('Hauptfokus dieser Lektion.'),
        goals: z.array(z.string()).describe('Spezifische Lernziele für diese Lektion.'),
        durationMinutes: z.number().describe('Dauer dieser Lektion in Minuten.'),
        intermediateCheck: z.string().optional().describe('Zwischencheck oder Meilenstein (optional).')
    }))
});

// ─── Structure Model Instructions ───────────────────────────────────────────

function getStructureInstructions(slot1: string | null, totalMinutes: number): string {
    const models: Record<string, string> = {
        aviva: `
STRUKTUR: AVIVA-Modell (zwingend 5 Phasen in dieser Reihenfolge):
1. **A — Ankommen & Aktivieren** (~${Math.round(totalMinutes * 0.12)} Min): Aufmerksamkeit herstellen, Neugier wecken. Oft mit einer Provokation, einem Rätsel oder kontroversen Aussage.
2. **V — Vorwissen aktivieren** (~${Math.round(totalMinutes * 0.13)} Min): SuS machen ihr Vorwissen sichtbar (Cluster, Brainstorming, Think-Pair-Share). LP erkennt Fehlvorstellungen.
3. **I — Informieren** (~${Math.round(totalMinutes * 0.25)} Min): Neue Inhalte werden erarbeitet. LP Input + kooperative Erarbeitung. NICHT nur Frontalvortrag.
4. **V — Verarbeiten** (~${Math.round(totalMinutes * 0.35)} Min): Übung und Anwendung auf eigene Fälle/Beispiele. Hier passiert das eigentliche Lernen. Differenzierte Aufgaben (A/B/C).
5. **A — Auswerten** (~${Math.round(totalMinutes * 0.15)} Min): Reflexion: Was habe ich gelernt? Was war schwierig? Selbsteinschätzung + Ausblick.`,

        direct_instruction: `
STRUKTUR: Direct Instruction (4 Phasen):
1. **Advance Organizer** (~${Math.round(totalMinutes * 0.10)} Min): Vorschau auf das Ziel der Stunde.
2. **LP-Input & Modelling** (~${Math.round(totalMinutes * 0.25)} Min): LP demonstriert das Vorgehen Schritt für Schritt (I do).
3. **Guided Practice** (~${Math.round(totalMinutes * 0.40)} Min): SuS üben unter Anleitung (We do → You do).
4. **Closure & Check** (~${Math.round(totalMinutes * 0.25)} Min): Zusammenfassung und formativer Check.`,

        '5e': `
STRUKTUR: 5E-Modell (5 Phasen):
1. **Engage** (~${Math.round(totalMinutes * 0.12)} Min): Phänomen oder Problem als Einstieg.
2. **Explore** (~${Math.round(totalMinutes * 0.25)} Min): Selbstständige Erkundung.
3. **Explain** (~${Math.round(totalMinutes * 0.20)} Min): Begriffs- und Konzeptklärung.
4. **Elaborate** (~${Math.round(totalMinutes * 0.28)} Min): Vertiefung und Transfer.
5. **Evaluate** (~${Math.round(totalMinutes * 0.15)} Min): Selbsteinschätzung und Reflexion.`,

        workshop: `
STRUKTUR: Werkstatt/Lernlandschaft (4 Phasen):
1. **Briefing** (~${Math.round(totalMinutes * 0.10)} Min): Aufträge vorstellen, Regeln klären.
2. **Werkstatt-Arbeit** (~${Math.round(totalMinutes * 0.55)} Min): Selbstständige Arbeit an differenzierten Posten.
3. **Debriefing** (~${Math.round(totalMinutes * 0.20)} Min): Ergebnisse teilen, Schwierigkeiten besprechen.
4. **Reflexion** (~${Math.round(totalMinutes * 0.15)} Min): Was habe ich geschafft? Was ist offen?`,

        project_cycle: `
STRUKTUR: Projektzyklus (4 Phasen):
1. **Auftrag klären** (~${Math.round(totalMinutes * 0.15)} Min): Ziel definieren, Kriterien festlegen.
2. **Planen & Entwerfen** (~${Math.round(totalMinutes * 0.25)} Min): Design Thinking / Prototyping.
3. **Umsetzen** (~${Math.round(totalMinutes * 0.40)} Min): Produktion mit Coaching.
4. **Präsentieren & Reflektieren** (~${Math.round(totalMinutes * 0.20)} Min): Peer-Feedback und Meta-Reflexion.`
    };

    return models[slot1 || ''] || `
STRUKTUR: Standard (mindestens 4 Phasen):
1. **Einstieg / Provokation** (~${Math.round(totalMinutes * 0.15)} Min): Packend, lebensnah. Kognitive Dissonanz erzeugen.
2. **Erarbeitung I** (~${Math.round(totalMinutes * 0.30)} Min): Kooperative Erarbeitung neuer Inhalte.
3. **Erarbeitung II / Vertiefung** (~${Math.round(totalMinutes * 0.35)} Min): Anwendung und Übung, differenziert.
4. **Sicherung & Reflexion** (~${Math.round(totalMinutes * 0.20)} Min): Ergebnissicherung und Metareflexion.`;
}

// ─── API Route ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    if (!process.env.OPENAI_API_KEY) {
        console.error('Missing OPENAI_API_KEY');
        return NextResponse.json({ error: 'OpenAI API Key is missing on server.' }, { status: 500 });
    }

    try {
        const { plan: context, type } = await req.json();

        let schema;
        let systemPrompt: string;

        // Build context string from all available plan data
        const klassenprofil = context.classProfile
            ? `Klassenprofil: ${context.classProfile.classSize || '?'} SuS, Heterogenität: ${context.classProfile.heterogeneity || 'mittel'}, Sprachniveau: ${context.classProfile.languageLevel || 'B2'}.`
            : '';
        const lernziele = context.goals?.filter((g: string) => g.trim()).length > 0
            ? `Bereits definierte Lernziele:\n${context.goals.filter((g: string) => g.trim()).map((g: string, i: number) => `  ${i + 1}. ${g}`).join('\n')}`
            : '';
        const didaktik = context.didacticSlots?.slot1
            ? `Gewähltes Unterrichtsmodell: ${context.didacticSlots.slot1}`
            : '';
        const lernmodus = context.didacticSlots?.slot2
            ? `Lernmodus: ${context.didacticSlots.slot2}`
            : '';
        const qualitaet = context.didacticSlots?.slot3
            ? `Qualitätsfokus: ${context.didacticSlots.slot3}`
            : '';
        const besonderes = context.specialNeeds
            ? `Besondere Hinweise: ${context.specialNeeds}`
            : '';

        if (type === 'sequence') {
            schema = sequenceSchema;
            const lessonCount = context.lessonCount || 4;

            systemPrompt = `Du bist ein moderner, kreativer Schweizer Didaktiker. Erstelle eine UNTERRICHTSSEQUENZ (Reihe) mit ${lessonCount} Lektionen für eine heterogene Klasse.

KONTEXT:
- Fach: ${context.subject}
- Thema der Reihe: ${context.topicDescription || context.title}
- Stufe: ${context.level || 'Sek I'}
- Anzahl Lektionen: ${lessonCount}
- ${klassenprofil}
${lernziele ? `- ${lernziele}` : ''}
${didaktik ? `- ${didaktik}` : ''}
${besonderes ? `- ${besonderes}` : ''}

DIDAKTISCHE LEITLINIEN (CRITICAL):
1. **Lebensweltbezug**: Starte NIEMALS mit abstrakter Theorie. Starte IMMER im "Hier und Jetzt" der SuS.
2. **Keine Platzhalter**: Formuliere für JEDE Lektion 1-2 KONKRETE Lernziele. Schreibe NICHT "Teilaspekt 1 bearbeiten".
3. **Methodenmix**: Vermeide reine Textarbeit. Plane Rollenspiele, Puzzles, Debatten, Bild-Analysen, Kahoot-Quizzes etc.
4. **Progression**: Lektion 1 = knallen. Mittlere Lektionen = Skills/Wissen. Letzte Lektion = Anwendung/Produkt.

Gib jeder Lektion einen spannenden, konkreten Titel.`;

        } else if (type === 'detail') {
            schema = detailSchema;

            const structureInstructions = getStructureInstructions(
                context.didacticSlots?.slot1 || null,
                context.durationMinutes || 45
            );

            // Check if we have an approved short version to build upon
            const approvedShort = context.shortVersion;
            const shortContext = approvedShort ? `

FREIGEGEBENE KURZVERSION (diese ist der Ausgangspunkt!):
- Titel: ${approvedShort.title}
- Überblick: ${approvedShort.overview}
- Lernziele: ${approvedShort.goals?.join('; ')}
- Phasen: ${approvedShort.phasesSummary?.map((p: any) => `${p.name} (${p.durationMinutes} Min): ${p.description}`).join(' | ')}
Baue die Detailplanung auf dieser Kurzversion auf! Die Phasenstruktur und Lernziele sollen konsistent sein.` : '';

            systemPrompt = `Du bist ein erfahrener Schweizer Didaktiker. Erstelle eine PFANNENFERTIGE, SOFORT EINSETZBARE Detailplanung.

KONTEXT:
- Fach: ${context.subject}
- Thema / Fokus: ${context.topicDescription || context.title}
- Stufe: ${context.level || 'Sek I'}
- Dauer: ${context.durationMinutes} Minuten
- ${klassenprofil}
${lernziele ? `- ${lernziele}` : ''}
${didaktik ? `- ${didaktik}` : ''}
${lernmodus ? `- ${lernmodus}` : ''}
${qualitaet ? `- ${qualitaet}` : ''}
${besonderes ? `- ${besonderes}` : ''}
${shortContext}

${structureInstructions}

═══════════════════════════════════════════════════════
QUALITÄTSANFORDERUNGEN — LIES DAS GENAU!
═══════════════════════════════════════════════════════

🎯 ZIEL: Die Lehrperson soll diesen Plan ausdrucken und SOFORT damit unterrichten können.

1. **DREHBUCH, NICHT STICHWORTE!**
   Schreibe für JEDE Phase ein detailliertes Drehbuch:
   - teacherActions: Was die LP konkret SAGT und TUT. Schreibe wörtliche Rede in Guillemets («…»).
     Beispiel: «LP begrüsst die Klasse und zeigt das Bild auf dem Beamer. LP fragt: «Schaut euch dieses Bild genau an. Was fällt euch auf? Was erkennt ihr?» LP wartet 10 Sekunden (Think Time). LP nimmt 3–4 Antworten entgegen und notiert Stichworte an der Tafel. LP sagt: «Heute geht es genau um diese Frage. Am Ende der Stunde könnt ihr…»»
   - childActions: Was die SuS konkret TUN. Schreibe Schritt für Schritt.
     Beispiel: «Die SuS betrachten das Bild still (30 Sek). Sie notieren 2 Beobachtungen auf Post-Its. In der Tischgruppe tauschen sie ihre Post-Its aus und einigen sich auf die 3 wichtigsten Punkte. Ein:e Sprecher:in fasst für das Plenum zusammen.»

   MINDESTENS 4-6 Sätze pro Feld!

2. **KONKRETE MATERIALIEN**
   Nicht "ein Text" sondern z.B.:
   - "Arbeitsblatt A: Lückentext mit Wortbank (12 Lücken)"
   - "Bildimpuls: Karikatur von Honegger, 1847 (Beamer)"
   - "Video: SRF mySchool — Die Entstehung der Schweiz (5:20 min)"
   - "Kahoot-Quiz: 8 Fragen zur Repetition (Link auf Arbeitsblatt)"

3. **DIFFERENZIERUNG MIT SUBSTANZ**
   - Niveau A (Basis): Konkrete Hilfsmittel (Satzanfänge, Wortbank, Bildkarten, vereinfachte Texte)
   - Niveau B (Standard): Klare Aufgabe mit leichten Hilfen
   - Niveau C (Challenge): Expertenrolle (z.B. «Du bist Chefredakteur:in und musst...»), KEINE "Zusatzblätter"

4. **SOZIALFORMEN VARIIEREN**
   Nutze mindestens 3 verschiedene Sozialformen über die ganze Lektion (z.B. Plenum, Think-Pair-Share, Gruppenarbeit, Einzelarbeit).

5. **ZEITMANAGEMENT REALISTISCH**
   Die Summe aller Phasen muss EXAKT ${context.durationMinutes} Minuten ergeben.

Sei mutig, kreativ und lebensnah! Die SuS sollen aktiv sein, nicht nur zuhören.`;

        } else if (type === 'revise') {
            schema = shortSchema;
            const currentSv = context.currentShortVersion;
            const userInstruction = context.revisionInstruction || '';
            systemPrompt = `Du bist ein erfahrener Schweizer Didaktiker. Du hast bereits eine Kurzversion eines Unterrichtsplans erstellt. Die Lehrperson möchte Änderungen.

AKTUELLE KURZVERSION:
- Titel: ${currentSv?.title || 'k.A.'}
- Überblick: ${currentSv?.overview || 'k.A.'}
- Lernziele: ${currentSv?.goals?.join('; ') || 'k.A.'}
- Phasen: ${currentSv?.phasesSummary?.map((p: any) => `${p.name} (${p.durationMinutes} Min): ${p.description}`).join(' | ') || 'k.A.'}

KONTEXT:
- Fach: ${context.subject}
- Stufe: ${context.level || 'Sek I'}
- Dauer: ${context.durationMinutes} Minuten
- ${klassenprofil}

ANWEISUNG DER LEHRPERSON:
"${userInstruction}"

Erstelle eine ÜBERARBEITETE Kurzversion, die die Anweisung umsetzt. Behalte den Rest möglichst bei.`;
        } else {
            // Short version
            schema = shortSchema;
            systemPrompt = `Du bist ein erfahrener Schweizer Didaktiker (Lehrplan 21). Erstelle eine KURZVERSION eines Unterrichtsplans.

KONTEXT:
- Fach: ${context.subject}
- Thema / Fokus: ${context.topicDescription || context.title}
- Stufe: ${context.level || 'Sek I'}
- Dauer: ${context.durationMinutes} Minuten
- ${klassenprofil}
${didaktik ? `- ${didaktik}` : ''}

QUALITÄTSANFORDERUNGEN:
1. **Lernziele**: Formuliere 3-4 SPEZIFISCHE Lernziele nach dem Muster: "Die SuS können [konkretes Verb: analysieren, beurteilen, vergleichen…], indem sie [was genau?], und zeigen dies durch [konkretes Produkt]." KEINE Platzhalter.
2. **Phasen**: Gliedere die Stunde in 3-5 Phasen mit konkreter Beschreibung (was passiert inhaltlich?).
3. **Differenzierung**: Beschreibe kurz 3 Niveaus (Basis, Standard, Challenge) mit konkretem Bezug zum Thema.
4. **Sprachliche Hilfen**: Schlage Satzmuster, Fachbegriffe und Zugangsmodi vor, die zum Thema passen.`;
        }

        const result = await generateObject({
            model: openai('gpt-4o'),
            schema: schema as any,
            prompt: systemPrompt,
        });

        return NextResponse.json(result.object);
    } catch (error) {
        // Sanitize: never log full error objects that might contain API keys
        const message = error instanceof Error ? error.message : 'Unknown error';
        const safeMessage = message.replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]');
        console.error('AI Generation Error:', safeMessage);

        // Classify error for user-friendly response
        if (safeMessage.includes('rate') || safeMessage.includes('429') || safeMessage.includes('quota')) {
            return NextResponse.json(
                { error: 'OpenAI Rate-Limit erreicht. Bitte warte 30 Sekunden und versuche es erneut.' },
                { status: 429 }
            );
        }

        if (safeMessage.includes('timeout') || safeMessage.includes('ETIMEDOUT')) {
            return NextResponse.json(
                { error: 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: 'Inhalt konnte nicht generiert werden. Bitte versuche es erneut.' },
            { status: 500 }
        );
    }
}
