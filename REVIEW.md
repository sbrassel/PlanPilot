# PlanPilot — Code Review & Rollout Readiness

**Datum:** 19.02.2026  
**Reviewer:** Antigravity (Senior Full-Stack / QA / DevOps)  
**Version:** `main @ 0824168`

---

## A) Findings & Fixes

### ✅ Fixes implementiert (dieser Review)

| # | Severity | Issue | Datei | Status | Commit |
|---|----------|-------|-------|--------|--------|
| 1 | 🔴 BLOCKER | `verify-*.ts` im Build → Build-Fehler auf Netlify | `tsconfig.json`, `.gitignore` | ✅ Fixed | `563c5c6` |
| 2 | 🔴 HIGH | Kein Retry bei API-Fehlern (429/500) → sofort Fallback | `src/lib/ai/index.ts` | ✅ Fixed | `5286a3a` |
| 3 | 🔴 HIGH | API-Fehler leaken interne Details (evtl. Keys) | `src/app/api/generate/route.ts` | ✅ Fixed | `0824168` |
| 4 | 🔴 HIGH | `test-helpers.ts` fehlte `reflectionNotes` | `src/lib/test-helpers.ts` | ✅ Fixed | frühere Session |

### 🔶 Offene Issues (priorisiert)

| # | Severity | Issue | Datei | Beschreibung |
|---|----------|-------|-------|--------------|
| 5 | 🔴 HIGH | **OpenAI Key kompromittiert** | `.env.local` | Key war in Terminal/Chat sichtbar. → **Key bei OpenAI rotieren!** |
| 6 | 🟡 MED | Mock-Sequenz generiert Platzhalter-Ziele | `mock-ai.ts:76` | `"Die SuS können Teilaspekt ${i} bearbeiten"` — nutzlos für Fallback |
| 7 | 🟡 MED | `generateLessonDetail()` wirft `Not implemented` | `mock-ai.ts:89` | Sequence-Detail-Fallback ist kaputt |
| 8 | 🟡 MED | `lessonCount` → NaN bei ungültigem Input | `StepContext.tsx:130` | `parseInt("abc")` → `NaN`, kein User-Feedback |
| 9 | 🟡 MED | `refineDetailPlan()` ist No-Op | `mock-ai.ts:92-96` | Gibt immer den unveränderten Plan zurück |
| 10 | 🟡 MED | Kein `AbortController` auf Fetch → kein Cancel | `ai/index.ts` | User kann Generation nicht abbrechen |
| 11 | 🟢 LOW | `structuredClone` im Undo-Stack → ggf. Performance | `store.ts:202` | Bei 50 Undo-Steps und grossem Plan evtl. langsam |
| 12 | 🟢 LOW | `localStorage` Autosave keine Size-Limits | `store.ts:126` | Kann bei sehr grossen Plänen fehlschlagen |
| 13 | 🟢 LOW | Dashboard „Meine Pläne" existiert nicht | `page.tsx:171` | Referenz zu Feature, das nicht implementiert ist |
| 14 | 🟢 LOW | Keine `id`-Felder auf `SequenceLesson` bei API | `route.ts:67` | `id` fehlt im Schema → Sequence-Lessons haben keine stabile ID |

---

## B) Roadmap

### ⚡ Quick Wins (1–2 Tage)

1. **OpenAI Key rotieren** (platform.openai.com → neuen Key erzeugen, in Netlify eintragen)
2. **Input-Validierung NaN-Guard** für `lessonCount` und `classSize`
3. **AbortController** für API-Calls → Cancel-Button während Generation
4. **Mock-Sequenz verbessern** — kontextabhängige Ziele statt Platzhalter
5. **Error-Boundary React-Component** um den Wizard wrappen

### 🏃 Sprint (1–2 Wochen)

1. **„Meine Pläne" Feature** — localStorage-basierte Planverwaltung (CRUD)
2. **Evaluation Harness** — 5 Golden-Test-Inputs mit automatischem Schema-Check auf API-Output
3. **Sequence-Detail Fallback implementieren** (`generateLessonDetail()`)
4. **KI-Refinement tatsächlich implementieren** — `refineDetailPlan()` via echte API
5. **A11y Audit** — Fokus-Management, Keyboard-Navigation im Stepper, ARIA-Labels
6. **i18n-Vorbereitung** — Strings in Konstanten-Dateien auslagern

### 📅 Next (1 Monat)

1. **User-Accounts & Cloud-Storage** (z.B. Supabase/Firebase)
2. **Prompt-Tuning mit Few-Shot-Examples** pro Stufe/Fach
3. **Streaming API** (Server-Sent Events) für Live-Generation-Feedback
4. **PDF/DOCX Template-System** — anpassbare Export-Vorlagen
5. **Analytics/Telemetry** (anonymisiert) — welche Features genutzt werden
6. **Rate-Limit Dashboard** — verbleibende API-Calls anzeigen

---

## C) Deployment Checklist

### 🔑 Pre-Deploy

- [x] Build erfolgreich lokal (`npm run build` → Exit 0)
- [x] Debug-Skripte aus Build ausgeschlossen (`tsconfig.json` + `.gitignore`)
- [x] API-Fehler sanitized (keine Leaks von Keys/Internals)
- [x] Retry-Logik für transiente API-Fehler
- [x] `netlify.toml` konfiguriert
- [ ] ⚠️ **OpenAI API Key rotieren** (aktueller Key war sichtbar!)
- [ ] ⚠️ **Environment Variable in Netlify setzen** (`OPENAI_API_KEY`)

### 🚀 Deploy

- [ ] Netlify Dashboard prüfen → Build grün?
- [ ] URL aufrufen → Landing Page lädt?
- [ ] „Neuen Plan erstellen" → Wizard startet?
- [ ] Step 1-3 ausfüllen → Step 4 „Generieren" → KI antwortet?
- [ ] Export (PDF/DOCX) → Datei wird heruntergeladen?

### 🔒 Post-Deploy Security

- [ ] Alte API Keys deaktivieren
- [ ] Netlify Deploy-Logs prüfen (keine Secrets in Logs?)
- [ ] CORS/CSP Headers prüfen (aktuell: none configured → akzeptabel für MVP)

---

## D) Output-Qualität — Was wurde verbessert?

### Bereits implementierte Verbesserungen

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| **API Resilience** | Sofort Fallback auf generische Mock-Daten bei jedem Fehler | 2 Retries mit exponential backoff, dann erst Fallback |
| **Error Messages** | Englisch, technisch, ggf. Keys in Logs | Deutsch, user-freundlich, sanitized |
| **Build Stability** | Bricht wegen Debug-Skripten ab | Sauber, Debug-Skripte ausgeschlossen |

### Empfehlungen für weitere Output-Qualität

1. **Prompt-Engineering**: Die aktuellen Prompts in `route.ts` sind bereits gut (Schweiz-spezifisch, LP21, AVIVA). Empfehlung: Few-Shot-Examples pro Stufe hinzufügen.
2. [x] **Refine Lesson Output**: Ensure "ready-to-teach" quality with script-like instructions and high-fidelity didactic components.
3. **Schema-Validation**: Der `generateObject()`-Call mit Zod-Schema ist der richtige Ansatz. Empfehlung: Post-Validation auf Phasen-Zeitensumme.
4. **Evaluation Harness**: Noch nicht gebaut — wäre der nächste grosse Qualitätshebel (5-10 Golden-Inputs, automatischer Check auf Vollständigkeit/Kohärenz).
