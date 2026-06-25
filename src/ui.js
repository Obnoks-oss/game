(function (root, factory) {
    const api = factory();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    root.Reaktionsjaeger = root.Reaktionsjaeger || {};
    root.Reaktionsjaeger.ui = api.ui;
})(typeof window !== "undefined" ? window : globalThis, function () {
    function createFakeTargetButton(gameField) {
        const button = document.createElement("button");
        button.className = "fake-target";
        button.setAttribute("aria-label", "Fake target");
        gameField.appendChild(button);
        return button;
    }

    function setTextContent(target, value) {
        if (target) {
            target.textContent = value;
        }
    }

    const ui = {
        elements: null,

        init() {
            if (typeof document === "undefined") {
                this.elements = {};
                return this.elements;
            }

            this.elements = {
                spielfeld: document.getElementById("spielfeld"),
                ziel: document.getElementById("ziel"),
                bomben: Array.from(document.querySelectorAll(".bombe")),
                startTaste: document.getElementById("start"),
                feuerwerkContainer: document.getElementById("feuerwerk"),
                punkteAnzeige: document.getElementById("punkte"),
                zeitAnzeige: document.getElementById("zeit"),
                rekordAnzeige: document.getElementById("rekord"),
                meldung: document.getElementById("meldung"),
                modusButtons: Array.from(document.querySelectorAll(".modus-button")),
                highscoreLists: {
                    anfänger: document.getElementById("highscores-anfänger"),
                    mittel: document.getElementById("highscores-mittel"),
                    schwer: document.getElementById("highscores-schwer"),
                },
                highscoreGroups: {
                    anfänger: document.querySelector('.highscore-group[data-mode="anfänger"]'),
                    mittel: document.querySelector('.highscore-group[data-mode="mittel"]'),
                    schwer: document.querySelector('.highscore-group[data-mode="schwer"]'),
                },
                recordDialog: document.getElementById("record-dialog"),
                playerNameInput: document.getElementById("player-name"),
                recordSaveButton: document.getElementById("record-save"),
                recordCancelButton: document.getElementById("record-cancel"),
            };
            return this.elements;
        },

        getElements() {
            if (!this.elements) {
                this.init();
            }
            return this.elements;
        },

        updateDisplay({ points, timeLeft, record }) {
            const elements = this.getElements();
            setTextContent(elements.punkteAnzeige, points);
            setTextContent(elements.zeitAnzeige, timeLeft === null ? "∞" : timeLeft);
            setTextContent(elements.rekordAnzeige, record);
        },

        setMessage(message) {
            setTextContent(this.getElements().meldung, message);
        },

        setModeButtons(activeMode, modeConfig) {
            const elements = this.getElements();
            elements.modusButtons.forEach((button) => {
                button.classList.toggle("active", button.dataset.modus === activeMode);
            });
            this.setMessage(`Modus: ${modeConfig[activeMode].label}`);
        },

        setStartButtonDisabled(disabled) {
            if (this.getElements().startTaste) {
                this.getElements().startTaste.disabled = disabled;
            }
        },

        setTargetVisible(visible) {
            if (this.getElements().ziel) {
                this.getElements().ziel.style.display = visible ? "block" : "none";
            }
        },

        setBombsVisible(activeBombIndex = -1) {
            const elements = this.getElements();
            elements.bomben.forEach((bombe, index) => {
                bombe.style.display = index === activeBombIndex ? "block" : "none";
            });
        },

        showFireworks() {
            const container = this.getElements().feuerwerkContainer;
            if (!container) {
                return;
            }
            container.innerHTML = "";
            const partikel = 14;
            for (let i = 0; i < partikel; i++) {
                const span = document.createElement("span");
                const winkel = Math.random() * Math.PI * 2;
                const distanz = 80 + Math.random() * 70;
                const dx = Math.cos(winkel) * distanz;
                const dy = Math.sin(winkel) * distanz;
                span.style.left = "50%";
                span.style.top = "50%";
                span.style.setProperty("--dx", `${dx.toFixed(0)}px`);
                span.style.setProperty("--dy", `${dy.toFixed(0)}px`);
                span.style.background = ["#fbbf24", "#38bdf8", "#fb7185", "#22c55e"][Math.floor(Math.random() * 4)];
                span.style.animationDelay = `${Math.random() * 0.2}s`;
                container.appendChild(span);
            }
            container.classList.add("active");
            setTimeout(() => {
                container.classList.remove("active");
                container.innerHTML = "";
            }, 1200);
        },

        renderHighscores(highscores, activeMode = null) {
            const elements = this.getElements();
            elements.activeHighscoreMode = activeMode;

            Object.entries(elements.highscoreLists || {}).forEach(([mode, list]) => {
                if (!list) {
                    return;
                }

                const group = elements.highscoreGroups && elements.highscoreGroups[mode];
                if (group) {
                    group.classList.toggle("active", activeMode === mode);
                }

                const entries = highscores[mode] || [];
                list.innerHTML = "";
                if (entries.length === 0) {
                    const emptyItem = document.createElement("li");
                    emptyItem.textContent = "Noch keine Einträge";
                    list.appendChild(emptyItem);
                    return;
                }

                entries.forEach((entry, index) => {
                    const item = document.createElement("li");
                    item.textContent = `${index + 1}. ${entry.name || "Unbekannt"} – ${entry.score}`;
                    list.appendChild(item);
                });
            });
        },

        setActiveHighscoreMode(mode) {
            const elements = this.getElements();
            elements.activeHighscoreMode = mode;
            Object.entries(elements.highscoreGroups || {}).forEach(([key, group]) => {
                if (group) {
                    group.classList.toggle("active", mode === key);
                }
            });
        },

        showRecordDialog() {
            const elements = this.getElements();
            if (elements.recordDialog) {
                elements.recordDialog.classList.remove("hidden");
                if (elements.playerNameInput) {
                    elements.playerNameInput.value = "";
                    elements.playerNameInput.focus();
                }
            }
        },

        hideRecordDialog() {
            const elements = this.getElements();
            if (elements.recordDialog) {
                elements.recordDialog.classList.add("hidden");
            }
        },
    };

    return { ui, createFakeTargetButton };
});
