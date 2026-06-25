(function (root, factory) {
    const api = factory();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    root.Reaktionsjaeger = root.Reaktionsjaeger || {};
    root.Reaktionsjaeger.scoring = api.scoring;
    root.Reaktionsjaeger.updateRecord = api.updateRecord;
    root.Reaktionsjaeger.updateDisplay = api.updateDisplay;
    root.Reaktionsjaeger.calculatePoints = api.calculatePoints;
})(typeof window !== "undefined" ? window : globalThis, function () {
    function calculatePoints(currentPoints) {
        const nextPoints = currentPoints + 1;
        const bonusHits = [5, 10, 15];
        const isBonusHit = bonusHits.includes(nextPoints);
        return nextPoints + (isBonusHit ? 1 : 0);
    }

    const scoring = {
        points: 0,
        record: 0,

        reset() {
            this.points = 0;
        },

        increase() {
            this.points = calculatePoints(this.points);
            return this.points;
        },

        decrease() {
            this.points = Math.max(0, this.points - 1);
            return this.points;
        },

        finishRound() {
            if (this.points > this.record) {
                this.record = this.points;
                return { isNewRecord: true, points: this.points, record: this.record };
            }

            return { isNewRecord: false, points: this.points, record: this.record };
        },

        snapshot() {
            return { points: this.points, record: this.record };
        },
    };

    function updateRecord(points, record) {
        return points > record ? points : record;
    }

    function updateDisplay({ pointsDisplay, timeDisplay, recordDisplay, points, remainingTime, record }) {
        if (pointsDisplay) {
            pointsDisplay.textContent = points;
        }
        if (timeDisplay) {
            timeDisplay.textContent = remainingTime === null ? "∞" : remainingTime;
        }
        if (recordDisplay) {
            recordDisplay.textContent = record;
        }
    }

    return { scoring, updateRecord, updateDisplay, calculatePoints };
});
