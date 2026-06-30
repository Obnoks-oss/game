(function (root, factory) {
    const api = factory(root);

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    root.Reaktionsjaeger = root.Reaktionsjaeger || {};
    root.Reaktionsjaeger.game = api.game;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
    function resolveModule(name) {
        if (typeof module !== "undefined" && module.exports) {
            try {
                return require(`./${name}`);
            } catch (error) {
                return null;
            }
        }

        return root.Reaktionsjaeger && root.Reaktionsjaeger[name];
    }

    function createScoringFallback(calculatePointsFn) {
        return {
            points: 0,
            record: 0,
            hits: 0,
            missclicks: 0,
            reactionTimes: [],
            bestTime: Infinity,
            reset() {
                this.points = 0;
                this.hits = 0;
                this.missclicks = 0;
                this.reactionTimes = [];
                this.bestTime = Infinity;
            },
            increase() {
                this.points = calculatePointsFn(this.points);
                return this.points;
            },
            hit(reactionTime) {
                this.points = calculatePointsFn(this.points);
                this.hits++;
                if (reactionTime != null) {
                    this.reactionTimes.push(reactionTime);
                    if (reactionTime < this.bestTime) {
                        this.bestTime = reactionTime;
                    }
                }
                return this.points;
            },
            missclick() { this.missclicks++; },
            getStats() {
                const avg = this.reactionTimes.length > 0
                    ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
                    : 0;
                return {
                    points: this.points,
                    hits: this.hits,
                    missclicks: this.missclicks,
                    avgReactionTime: Math.round(avg),
                    bestReactionTime: this.bestTime === Infinity ? 0 : this.bestTime,
                };
            },
            decrease() { this.points = Math.max(0, this.points - 1); return this.points; },
            finishRound() {
                if (this.points > this.record) {
                    this.record = this.points;
                    return { isNewRecord: true, points: this.points, record: this.record };
                }
                return { isNewRecord: false, points: this.points, record: this.record };
            },
        };
    }

    function createStorageFallback() {
        return {
            loadRecord() { return 0; },
            saveRecord() {},
        };
    }

    function createUiFallback() {
        return {
            init() {
                if (typeof document === "undefined") {
                    return {};
                }

                return {
                    spielfeld: document.getElementById("spielfeld") || document.createElement("div"),
                    ziel: document.getElementById("ziel") || document.createElement("button"),
                    bomben: Array.from(document.querySelectorAll(".bombe")),
                    startTaste: document.getElementById("start") || document.createElement("button"),
                    feuerwerkContainer: document.getElementById("feuerwerk") || document.createElement("div"),
                    punkteAnzeige: document.getElementById("punkte") || document.createElement("span"),
                    zeitAnzeige: document.getElementById("zeit") || document.createElement("span"),
                    rekordAnzeige: document.getElementById("rekord") || document.createElement("span"),
                    meldung: document.getElementById("meldung") || document.createElement("p"),
                    modusButtons: Array.from(document.querySelectorAll(".modus-button")),
                };
            },
            updateDisplay() {},
            setMessage() {},
            setModeButtons() {},
            setStartButtonDisabled() {},
            setTargetVisible() {},
            setBombsVisible() {},
            showFireworks() {},
            showStats() {},
            hideStats() {},
        };
    }

    function bindIfPresent(target, eventName, handler) {
        if (target && typeof target.addEventListener === "function") {
            target.addEventListener(eventName, handler);
        }
    }

    const scoringModule = resolveModule("scoring") || {};
    const storageModule = resolveModule("storage") || {};
    const uiModule = resolveModule("ui") || {};

    const calculatePoints = scoringModule.calculatePoints || root.Reaktionsjaeger?.calculatePoints || ((currentPoints) => currentPoints + 1);
    const scoring = scoringModule.scoring || scoringModule || createScoringFallback(calculatePoints);
    const storage = storageModule.storage || storageModule || createStorageFallback();
    const ui = uiModule.ui || uiModule || createUiFallback();

    const elements = ui.init ? ui.init() : {};
    const modusConfig = {
        warmup: { label: "Warm Up", zielzeit: null, spielDauer: null },
        anfänger: { label: "Anfänger", zielzeit: 1.9, spielDauer: 20 },
        mittel: { label: "Mittel", zielzeit: 0.9, spielDauer: 20 },
        schwer: { label: "Schwer", zielzeit: 0.6, spielDauer: 20 },
    };

    let spielRestzeit = null;
    let zielRestzeit = null;
    let spielLaeuft = false;
    let zielTimerId = null;
    let spielTimerId = null;
    let bombenAktiv = false;
    let modus = "warmup";
    let pendingRecord = null;
    let zielErscheinungsZeit = null;

    scoring.record = storage.loadRecord(0);
    ui.renderHighscores ? ui.renderHighscores(storage.loadHighscores ? storage.loadHighscores() : {}, null) : null;

    function anzeigeAktualisieren() {
        ui.updateDisplay({
            points: scoring.points,
            timeLeft: spielRestzeit,
            record: scoring.record,
        });
    }

    function setModus(name) {
        modus = name;
        ui.setModeButtons(name, modusConfig);
        if (ui.setActiveHighscoreMode) {
            ui.setActiveHighscoreMode(name === "warmup" ? null : name);
        }
        if (ui.renderHighscores) {
            ui.renderHighscores(storage.loadHighscores ? storage.loadHighscores() : {}, name === "warmup" ? null : name);
        }
        resetGame();
    }

    function resetGame() {
        spielLaeuft = false;
        clearTargetTimer();
        clearGameTimer();
        scoring.reset();
        bombenAktiv = false;
        ui.setTargetVisible(false);
        versteckeBomben();
        spielRestzeit = modusConfig[modus].spielDauer;
        zielRestzeit = modusConfig[modus].zielzeit === null ? null : Math.round(modusConfig[modus].zielzeit * 1000);
        ui.setStartButtonDisabled(false);
        anzeigeAktualisieren();
    }

    function clearTargetTimer() {
        if (zielTimerId !== null) {
            clearInterval(zielTimerId);
            zielTimerId = null;
        }
    }

    function clearGameTimer() {
        if (spielTimerId !== null) {
            clearInterval(spielTimerId);
            spielTimerId = null;
        }
    }

    function platziereElementZufall(element, elementGroesse) {
        const box = elements.spielfeld.getBoundingClientRect();
        const half = elementGroesse / 2;
        const maxX = box.width - elementGroesse;
        const maxY = box.height - elementGroesse;
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;
        element.style.left = `${x + half}px`;
        element.style.top = `${y + half}px`;
    }

    function zielBewegen() {
        const neueGroesse = Math.floor(35 + Math.random() * 35);
        elements.ziel.style.width = `${neueGroesse}px`;
        elements.ziel.style.height = `${neueGroesse}px`;
        elements.ziel.style.setProperty("--ziel-scale", "1");
        platziereElementZufall(elements.ziel, neueGroesse);
        zielErscheinungsZeit = Date.now();
        elements.ziel.focus();
    }

    function startTargetTimer() {
        clearTargetTimer();
        if (modusConfig[modus].zielzeit === null) {
            zielRestzeit = null;
            return;
        }

        zielRestzeit = Math.round(modusConfig[modus].zielzeit * 1000);
        zielTimerId = setInterval(() => {
            if (!spielLaeuft) {
                clearTargetTimer();
                return;
            }
            zielRestzeit -= 100;
            if (zielRestzeit <= 0) {
                zielVerpasst();
            }
        }, 100);
    }

    function startGameTimer() {
        clearGameTimer();
        if (modusConfig[modus].spielDauer === null) {
            spielRestzeit = null;
            anzeigeAktualisieren();
            return;
        }

        spielRestzeit = modusConfig[modus].spielDauer;
        anzeigeAktualisieren();
        spielTimerId = setInterval(() => {
            if (!spielLaeuft) {
                clearGameTimer();
                return;
            }

            spielRestzeit -= 1;
            anzeigeAktualisieren();
            if (spielRestzeit <= 0) {
                spielBeenden();
            }
        }, 1000);
    }

    function zielVerpasst() {
        clearTargetTimer();
        ui.setMessage("Zu langsam! Der Kreis wird neu gesetzt.");
        zielBewegen();
        versteckeBomben();
        if (Math.random() < 0.35) {
            zeigeBomben();
        }
        if (modusConfig[modus].zielzeit !== null) {
            startTargetTimer();
        }
    }

    function bewegeBomben() {
        elements.bomben.forEach((bombe) => {
            const bombenGroesse = 28 + Math.floor(Math.random() * 14);
            bombe.style.width = `${bombenGroesse}px`;
            bombe.style.height = `${bombenGroesse}px`;
            platziereElementZufall(bombe, bombenGroesse);
        });
    }

    function zeigeBomben() {
        const aktiveBombe = elements.bomben[Math.floor(Math.random() * elements.bomben.length)];
        elements.bomben.forEach((bombe, index) => {
            const isActive = bombe === aktiveBombe;
            bombe.style.display = isActive ? "block" : "none";
            if (isActive) {
                bombe.style.width = "";
                bombe.style.height = "";
            }
        });
        bombenAktiv = true;
        bewegeBomben();
    }

    function versteckeBomben() {
        elements.bomben.forEach((bombe) => {
            bombe.style.display = "none";
        });
        bombenAktiv = false;
    }

    function spieleStartWieder() {
        scoring.reset();
        spielLaeuft = true;
        bombenAktiv = false;
        ui.hideStats();

        spielRestzeit = modusConfig[modus].spielDauer;
        zielRestzeit = modusConfig[modus].zielzeit === null ? null : Math.round(modusConfig[modus].zielzeit * 1000);
        anzeigeAktualisieren();
        ui.setMessage("Los! Klicke auf den Kreis.");
        ui.setStartButtonDisabled(true);
        ui.setTargetVisible(true);
        versteckeBomben();
        zielBewegen();
        if (modusConfig[modus].spielDauer !== null) {
            startGameTimer();
        }
        startTargetTimer();
    }

    function spielStarten() {
        if (spielLaeuft) {
            return;
        }
        spieleStartWieder();
    }

    function spielBeenden() {
        spielLaeuft = false;
        clearTargetTimer();
        clearGameTimer();
        ui.setTargetVisible(false);
        versteckeBomben();
        ui.setStartButtonDisabled(false);
        anzeigeAktualisieren();

        const stats = scoring.getStats();
        ui.showStats(stats);

        const result = scoring.finishRound();
        storage.saveRecord(result.record);
        if (result.isNewRecord) {
            pendingRecord = { mode: modus, score: result.points };
            ui.setMessage(`Neuer Rekord! ${result.points} Punkte. Gib deinen Namen ein!`);
            ui.showFireworks();
            ui.showRecordDialog();
        } else {
            ui.setMessage(`Spiel beendet. Du hast ${result.points} Punkte erreicht.`);
        }
        if (ui.renderHighscores) {
            ui.renderHighscores(storage.loadHighscores ? storage.loadHighscores() : {}, modus === "warmup" ? null : modus);
        }
    }

    function handleTargetHit(event) {
        event.stopPropagation();
        if (!spielLaeuft) {
            return;
        }
        const reactionTime = zielErscheinungsZeit ? Date.now() - zielErscheinungsZeit : null;
        scoring.hit(reactionTime);
        anzeigeAktualisieren();
        ui.setMessage("Treffer! Punkt erzielt.");
        elements.ziel.classList.remove("hit");
        void elements.ziel.offsetWidth;
        elements.ziel.classList.add("hit");
        zielBewegen();
        versteckeBomben();
        if (Math.random() < 0.35) {
            zeigeBomben();
        }
        if (bombenAktiv) {
            bewegeBomben();
        }
        startTargetTimer();
    }

    function handleFieldClick(event) {
        const target = event.target;
        if (!target || !(target instanceof Element)) {
            return;
        }

        if (spielLaeuft) {
            const isInPlayArea = target.closest("#spielfeld");
            if (isInPlayArea) {
                scoring.missclick();
                ui.setMessage("Fehlklick! Konzentrier dich auf den Kreis.");
            }
            return;
        }

        const isInteractiveTarget = target.closest("#ziel, .bombe, #start, .modus-button, .dialog, .modus-panel, .highscore-panel");
        if (isInteractiveTarget) {
            return;
        }

        const clickedInsidePlayArea = target.closest("#spielfeld, .spiel-panel");
        if (!clickedInsidePlayArea) {
            return;
        }

        spielStarten();
    }

    function handleBombHit(event) {
        event.stopPropagation();
        if (!spielLaeuft) {
            return;
        }
        scoring.decrease();
        anzeigeAktualisieren();
        ui.setMessage("Autsch! Bombe getroffen – Punkt verloren.");
        versteckeBomben();
        zielBewegen();
        startTargetTimer();
    }

    bindIfPresent(elements.ziel, "click", handleTargetHit);
    elements.bomben.forEach((bombe) => {
        bindIfPresent(bombe, "click", handleBombHit);
    });
    bindIfPresent(document, "click", handleFieldClick);
    elements.modusButtons.forEach((button) => {
        bindIfPresent(button, "click", () => setModus(button.dataset.modus));
    });
    bindIfPresent(elements.startTaste, "click", spielStarten);

    if (elements.recordSaveButton) {
        bindIfPresent(elements.recordSaveButton, "click", () => {
            if (!pendingRecord) {
                ui.hideRecordDialog();
                return;
            }

            const name = (elements.playerNameInput && elements.playerNameInput.value.trim()) || "Spieler";
            storage.saveHighscore(pendingRecord.mode, { name, score: pendingRecord.score });
            pendingRecord = null;
            ui.hideRecordDialog();
            if (ui.renderHighscores) {
                ui.renderHighscores(storage.loadHighscores ? storage.loadHighscores() : {}, modus === "warmup" ? null : modus);
            }
        });
    }

    if (elements.recordCancelButton) {
        bindIfPresent(elements.recordCancelButton, "click", () => {
            pendingRecord = null;
            ui.hideRecordDialog();
        });
    }

    bindIfPresent(document, "keydown", (event) => {
        if (event.key === "Escape") {
            if (elements.recordDialog && !elements.recordDialog.classList.contains("hidden")) {
                pendingRecord = null;
                ui.hideRecordDialog();
            }
            return;
        }

        if (!spielLaeuft) return;

        if (event.key === " " || event.code === "Space") {
            event.preventDefault();
            elements.ziel.click();
        }
    });

    resetGame();

    return { game: { resetGame, spielStarten } };
});
