(function (root, factory) {
    const api = factory();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    root.Reaktionsjaeger = root.Reaktionsjaeger || {};
    root.Reaktionsjaeger.storage = api.storage;
})(typeof window !== "undefined" ? window : globalThis, function () {
    const STORAGE_KEY = "reaction_hunter_record";
    const HIGHSCORE_KEY = "reaction_hunter_highscores";
    const MODES = ["anfänger", "mittel", "schwer"];

    function getStorage() {
        return typeof globalThis.localStorage !== "undefined" ? globalThis.localStorage : null;
    }

    function readHighscores() {
        const storageApi = getStorage();
        if (!storageApi) {
            return {};
        }

        try {
            const raw = storageApi.getItem(HIGHSCORE_KEY);
            if (!raw) {
                return {};
            }
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (error) {
            console.warn("Highscores konnten nicht geladen werden:", error);
            return {};
        }
    }

    function writeHighscores(highscores) {
        const storageApi = getStorage();
        if (!storageApi) {
            return;
        }

        try {
            storageApi.setItem(HIGHSCORE_KEY, JSON.stringify(highscores));
        } catch (error) {
            console.warn("Highscores konnten nicht gespeichert werden:", error);
        }
    }

    const storage = {
        loadRecord(defaultValue = 0) {
            const storageApi = getStorage();
            if (!storageApi) {
                return defaultValue;
            }

            try {
                const stored = storageApi.getItem(STORAGE_KEY);
                const parsed = stored === null ? null : Number(stored);
                return Number.isFinite(parsed) ? parsed : defaultValue;
            } catch (error) {
                console.warn("Rekord konnte nicht geladen werden:", error);
                return defaultValue;
            }
        },

        saveRecord(record) {
            const storageApi = getStorage();
            if (!storageApi) {
                return;
            }

            try {
                storageApi.setItem(STORAGE_KEY, String(record));
            } catch (error) {
                console.warn("Rekord konnte nicht gespeichert werden:", error);
            }
        },

        loadHighscores() {
            const highscores = readHighscores();
            return MODES.reduce((acc, mode) => {
                acc[mode] = Array.isArray(highscores[mode]) ? highscores[mode] : [];
                return acc;
            }, {});
        },

        saveHighscore(mode, entry) {
            const highscores = this.loadHighscores();
            const list = Array.isArray(highscores[mode]) ? highscores[mode] : [];
            const nextEntries = [...list, entry]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            highscores[mode] = nextEntries;
            writeHighscores(highscores);
            return highscores[mode];
        },
    };

    return { storage, loadRecord: storage.loadRecord, saveRecord: storage.saveRecord, loadHighscores: storage.loadHighscores, saveHighscore: storage.saveHighscore };
});
