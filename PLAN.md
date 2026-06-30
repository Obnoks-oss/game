# Plan: Reaktionsjäger V2

## Ausgangslage

Das Spiel "Reaktionsjäger" ist ein Browser-Klickspiel in Vanilla JavaScript.
Die Architektur verwendet vier UMD-IIFE-Module in `src/`, geladen über `<script>`-Tags:

| Datei | Aufgabe |
|---|---|
| `src/scoring.js` | Punkte-Logik, Statistik-Tracking (`hit()`, `missclick()`, `getStats()`) |
| `src/storage.js` | localStorage-Persistenz (Rekord, Highscores) |
| `src/ui.js` | DOM-Manipulation, Statistik-Panel, Dialoge |
| `src/game.js` | Spiel-Controller, Timer, Event-Handler, Fallback-Module |

Tests in `tests/` mit Vitest + jsdom.

---

## Stufe 1: Doppelte Test-Imports bereinigen

**Priorität:** Hoch  
**Status:** ✅ Bereits bereinigt (keine Duplikate vorhanden)

### Ziel
Doppelte und nicht gruppierte Test-Imports in `tests/scoring.test.js` entfernen.

### Wegbeschreibung
1. Datei `tests/scoring.test.js` öffnen
2. Zeilen 4-8 (den doppelten Import-Block) löschen – bereits erledigt
3. Prüfen, dass im `describe("scoring module")`-Block alle Tests gruppiert sind – ✅ bereits im describe-Block
4. Die beiden freistehenden Tests außerhalb des `describe`-Blocks in den Block verschieben – bereits erledigt

### Prüfungsmethodik

| Test | Erwartung |
|---|---|
| `npm run test:run` | 15 Tests, 0 Fehler |
| `npm run build` | Build erfolgreich |

---

## Stufe 2: Statistik-Feature

**Priorität:** Mittel
**Status:** ✅ Bereits umgesetzt

### Ziel
Nach Spielende erscheint ein Panel mit Spielstatistik unter dem Spielfeld.

### Umgesetzte Funktionen

- **State-Erweiterung:** `scoring.hits`, `scoring.missclicks`, `scoring.reactionTimes:[]`, `scoring.bestTime`
- **Tracking:** `scoring.hit(reactionTime)` bei Ziel-Treffer, `scoring.missclick()` bei Fehlklick
- **Berechnung:** `scoring.getStats()` liefert `{points, hits, missclicks, avgReactionTime, bestReactionTime}`
- **Anzeige:** `ui.showStats(stats)` befüllt das Statistik-Panel und blendet es ein
- **Reset:** `scoring.reset()` + `ui.hideStats()` bei Spielstart

### Enthaltene Werte

| Feld | Inhalt |
|---|---|
| Punkte | Erreichte Punktzahl |
| Treffer | Anzahl erfolgreicher Ziel-Klicks |
| Fehlklicks | Klicks ins Spielfeld außerhalb von Ziel/Bombe |
| Ø Reaktionszeit | Durchschnitt über alle Treffer (ms) |
| Beste Zeit | Schnellster Treffer (ms) |

### Dateien

- `src/scoring.js` – State, `hit()`, `missclick()`, `getStats()`
- `src/game.js` – `zielErscheinungsZeit`, Aufruf von `scoring.hit()`/`missclick()`/`getStats()`
- `src/ui.js` – `showStats()`, `hideStats()`, Element-Referenzen
- `index.html` – `<section id="statistik">` mit 5 Anzeigen
- `src/style.css` – `.statistik`-Grid, `.hidden`
- `tests/scoring.test.js` – 4 Tests für `hit()`, `missclick()`, `getStats()`, `reset()`

---

## Stufe 3: Tastatursteuerung (Leertaste)

**Priorität:** Mittel
**Status:** Teilweise umgesetzt

### Bereits erledigt

| Maßnahme | Ort |
|---|---|
| `tabindex="0"` + `role="application"` auf `#spielfeld` | `index.html:47` |
| `role="status"` + `aria-live="polite"` auf `#meldung` | `index.html:103` |
| `:focus-visible`-Styles für Buttons, Inputs, Spielfeld | `src/style.css:407-420` |
| `@media (prefers-reduced-motion: reduce)` | `src/style.css:422-443` |
| Ziel-Fokus bei Erscheinen (`elements.ziel.focus()`) | `src/game.js:220` |
| Escape-Taste schließt Rekord-Dialog | `src/game.js:462-470` |

### Umgesetzt

**Leertaste simuliert Ziel-Klick** – Ermöglicht Treffer per Tastatur, auch wenn das Ziel gerade nicht fokussiert ist:

- In `src/game.js:460-477` wurde der bestehende `keydown`-Listener erweitert
- Bei laufendem Spiel löst `Space` → `elements.ziel.click()` aus
- `event.preventDefault()` verhindert Seiten-Scrollen

### Prüfungsmethodik

| Test | Erwartung |
|---|---|
| Spiel starten, Leertaste drücken | +1 Punkt, Ziel bewegt sich |
| `npm run test:run` | Alle 15 Tests grün |

---

## Stufe 4: Keyboard-Shortcuts-Hinweis

**Priorität:** Niedrig

### Ziel
Hinweis auf Tastatursteuerung im UI anzeigen.

### Umgesetzt

- `index.html:84-86`: `<p class="tastatur-hinweis">` unter dem Start-Button eingefügt
- `src/style.css:284-288`: `.tastatur-hinweis` mit zentriertem, dezentem Styling

### Prüfungsmethodik

| Test | Erwartung |
|---|---|
| Seite laden | Hinweis sichtbar unter Start-Button |
| Build | Keine Fehler |

---

## Stufe 5: Fehlklicks – Beibehalten und dokumentieren

**Priorität:** Niedrig
**Status:** ✅ Bereits umgesetzt und wertvoll

### Begründung
Anders als im ursprünglichen Plan bewertet, haben Fehlklicks im Reaktionsjäger einen klaren Mehrwert:
- Sie trainieren die Zielgenauigkeit (nicht nur Reaktionsgeschwindigkeit)
- Die Statistik zeigt Fehlklick-Verhältnis → Spieler können ihre Präzision verbessern
- Rückmeldung "Fehlklick! Konzentrier dich auf den Kreis." gibt direktes Feedback

### Bereits umgesetzt
- `scoring.missclick()` in `handleFieldClick()` (`src/game.js:390`)
- Anzeige in der Statistik als `Fehlklicks` (`index.html:67`)

### Empfehlung
Keine Änderung – vorhandenen Code in `game.js`, `scoring.js` und `ui.js` unverändert lassen.

---

## Stufe 6: Module-Resolution-Fix (Browser-Kompatibilität)

**Priorität:** Hoch  
**Status:** ✅ Fertig

### Problem
In der Browser-Umgebung gibt `resolveModule("scoring")` das rohe scoring-Objekt zurück (`root.Reaktionsjaeger.scoring`), nicht `{scoring: ...}`.  
`scoringModule.scoring` ist daher `undefined`, und die Fallback-Implementierung wird fälschlich verwendet – das Spiel reagiert nicht auf Klicks.

### Lösung
Fallback-Chain in `src/game.js:127-129` um die rohen Module ergänzt:

```js
const scoring = scoringModule.scoring || scoringModule || createScoringFallback(calculatePoints);
const storage = storageModule.storage || storageModule || createStorageFallback();
const ui = uiModule.ui || uiModule || createUiFallback();
```

| Umgebung | `scoringModule` | `scoringModule.scoring` | Auflösung |
|---|---|---|---|
| Node.js (Test) | `{ scoring, ... }` | scoring-Objekt ✅ | `scoringModule.scoring` |
| Browser | scoring-Objekt (roh) | `undefined` ❌ | `scoringModule` (roh) ✅ |

### Prüfungsmethodik

| Test | Erwartung |
|---|---|
| `npm run test:run` | 15 Tests, 0 Fehler |
| `npm run build` | Build erfolgreich |
| Spiel im Browser starten | Klicks auf Start-Button/Spielfeld funktionieren |

---

## Zusammenfassung

| Stufe | Feature | Status | Aufwand |
|---|---|---|---|
| 1 | Doppelte Test-Imports entfernen | ✅ Fertig | Klein |
| 2 | Statistik | ✅ Fertig | – |
| 3 | Tastatursteuerung (Leertaste) | ✅ Fertig | Klein |
| 4 | Keyboard-Hinweis | ✅ Fertig | Klein |
| 5 | Fehlklicks | ✅ Beibehalten | – |
| 6 | Module-Resolution-Fix | ✅ Fertig | Klein |
