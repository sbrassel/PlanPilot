import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Allow responses up to 60 seconds
export const maxDuration = 60;

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
        name: z.string(),
        durationMinutes: z.number(),
        description: z.string(),
        teacherActions: z.string().describe('Konkretes Handeln der Lehrperson.'),
        childActions: z.string().describe('Konkretes Handeln der Schüler:innen.'),
        didacticComment: z.string().describe('Begründung der Wahl dieser Methode/Phase.'),
        materials: z.array(z.string()),
        socialForm: z.string(),
        differentiation: z.object({
            niveauA: z.string(),
            niveauB: z.string(),
            niveauC: z.string()
        }),
        planBAlternative: z.string().describe('Optionale Alternative, falls die Hauptaktivität nicht möglich ist.')
    })),
    planBIncluded: z.boolean(),
    reflectionNotes: z.string(),
    didacticDiagnosis: z.object({
        coreConcept: z.string(),
        misconceptions: z.array(z.string()),
        thresholdConcept: z.string(),
        relevance: z.string()
    }),
    assessmentRubric: z.array(z.object({
        criteria: z.string(),
        levelA: z.string(),
        levelB: z.string(),
        levelC: z.string()
    }))
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
        const besonderes = context.specialNeeds
            ? `Besondere Hinweise: ${context.specialNeeds}`
            : '';

        if (type === 'sequence') {
            schema = sequenceSchema;
            const lessonCount = context.lessonCount || 4;
            const singleDuration = context.durationMinutes || 45;

            systemPrompt = `Du bist ein moderner, kreativer Schweizer Didaktiker. Erstelle eine UNTERRICHTSSEQUENZ (Reihe) mit ${lessonCount} Lektionen für eine heterogene Klasse (Integrationsfokus).

KONTEXT:
- Fach: ${context.subject}
- Thema der Reihe: ${context.topicDescription || context.title}
- Stufe: ${context.level || 'Sek I'}
- Anzahl Lektionen: ${lessonCount}
- ${klassenprofil}
${lernziele ? `- ${lernziele} (Übergeordnete Reihe-Ziele)` : ''}
${didaktik ? `- ${didaktik}` : ''}
${besonderes ? `- ${besonderes}` : ''}

DIDAKTISCHE LEITLINIEN (CRITICAL):
1. **Lebensweltbezug (Catch them!)**: Starte NIEMALS mit abstrakter Theorie oder historischen Daten (z.B. "Verfassung 1848"). Starte IMMER im "Hier und Jetzt" der SuS (Konflikte, Handyverbot, Rap-Texte, Insta-Storys). Wecke erst Emotionen, dann Interesse, dann erst Theorie.
2. **Keine Platzhalter**: Formuliere für JEDE Lektion 1-2 KONKRETE Lernziele. Schreibe NICHT "Teilaspekt 1 bearbeiten". Schreibe: "Die SuS können die machtpolitischen Gründe für den Sonderbundskrieg erklären...".
3. **Methodenmix (Action!)**: Vermeide reine "Textarbeit". Plane Rollenspiele, Puzzles, Debatten, Bild-Analysen, Kahoot-Quizzes oder Erklärvideos. Die SuS sollen aktiv sein.
4. **Progression**: Baue die Reihe logisch auf. Lektion 1 muss knallen (Interesse). Die mittleren Lektionen erarbeiten Skills/Wissen. Die letzte Lektion ist eine Anwendung/Produkt (nicht nur ein Test).

AUFGABE:
Entwickle ein "Sequenz-Skelett". 
Gib jeder Lektion einen spannenden Titel und einen Fokus, der die SuS neugierig macht.`;

        } else if (type === 'detail') {
            schema = detailSchema;
            systemPrompt = `Du bist ein erfahrener Schweizer Didaktiker. Erstelle einen DETAILLIERTEN, KREATIVEN Unterrichtsplan.

KONTEXT:
- Fach: ${context.subject}
- Thema / Fokus: ${context.topicDescription || context.title}
- Stufe: ${context.level || 'Sek I'}
- Dauer: ${context.durationMinutes} Minuten
- ${klassenprofil}
${lernziele ? `- ${lernziele}` : ''}
${didaktik ? `- ${didaktik}` : ''}
${besonderes ? `- ${besonderes}` : ''}

QUALITÄTSANFORDERUNGEN & STIL:
1. **Konkrete Lernziele**: Das Wichtigste! Definiere 1-3 messbare Ziele für DIESE Lektion. KEINE Platzhalter wie "Teilaspekt X".
2. **Aktivierung**: Die SuS sollen machen, nicht nur zuhören. Plane kooperative Lernformen, Bewegtes Lernen oder digitale Tools (Kahoot, Mentimeter) ein.
3. **Differenzierung (Smart)**: 
   - Niveau A (Basis): Viel Scaffolding (Satzanfänge, Wortgeländer, Bildkarten).
   - Niveau B (Standard): Geführte Aufgaben.
   - Niveau C (Challenge): KEINE "Zusatzblätter". Gib ihnen Expertenrollen (Moderator, Chef-Redakteur, Peer-Tutor).
4. **Materialien**: Nenne konkrete, spannende Materialien (z.B. "Youtube-Video 'MrWissen2Go'", "Aktueller Zeitungsartikel aus '20 Minuten'", "Bildimpuls: Meme").

ABLAUF-DREHBUCH:
Schreibe genau, was LP und SuS tun.
- Einstieg: Packend, lebensnah.
- Erarbeitung: Aktiv, kooperativ.
- Sicherung: Kreativ (kein langweiliges Abfragen).

Sei mutig und modern!`;
        } else if (type === 'revise') {
            // Revise an existing short version based on user instructions
            schema = shortSchema;
            const currentSv = context.currentShortVersion;
            const userInstruction = context.revisionInstruction || '';
            systemPrompt = `Du bist ein erfahrener Schweizer Didaktiker. Du hast bereits eine Kurzversion eines Unterrichtsplans erstellt. Die Lehrperson möchte Änderungen vornehmen.

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

Erstelle eine ÜBERARBEITETE Kurzversion, die die Anweisung der Lehrperson umsetzt. Behalte den Rest möglichst bei.`;
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
1. **Lernziele**: Formuliere 3-4 SPEZIFISCHE Lernziele nach dem Muster: "Die SuS können [konkretes Verb: analysieren, beurteilen, vergleichen…], indem sie [was genau?], und zeigen dies durch [konkretes Produkt]." KEINE Platzhalter. KEINE generischen Begriffe wie "NMG" oder "das Thema".
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
        console.error('AI Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate content', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
