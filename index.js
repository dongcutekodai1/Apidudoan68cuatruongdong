// HUYDAIXU.SITE
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

const API_URL = 'https://api50.onrender.com/history';

let lastPhien = 0;
let cachedResult = null;

let modelPredictions = {}; 

class UltraDicePredictionSystem {
    constructor() {
        this.history = [];
        this.models = {};
        this.weights = {};
        this.performance = {};
        this.patternDatabase = {};
        this.advancedPatterns = {};
        this.sessionStats = {
            streaks: { T: 0, X: 0, maxT: 0, maxX: 0 },
            transitions: { TtoT: 0, TtoX: 0, XtoT: 0, XtoX: 0 },
            volatility: 0.5,
            patternConfidence: {},
            recentAccuracy: 0,
            bias: { T: 0, X: 0 }
        };
        this.marketState = {
            trend: 'neutral',
            momentum: 0,
            stability: 0.5,
            regime: 'normal'
        };
        this.adaptiveParameters = {
            patternMinLength: 3,
            patternMaxLength: 8,
            volatilityThreshold: 0.7,
            trendStrengthThreshold: 0.6,
            patternConfidenceDecay: 0.95,
            patternConfidenceGrowth: 1.05
        };
        this.initAllModels();
    }

    initAllModels() {
        for (let i = 1; i <= 21; i++) {
            this.models[`model${i}`] = this[`model${i}`]?.bind(this);
        }
    }

    addResult(result) {
        this.history.push(result);
        if (this.history.length > 200) this.history.shift();
    }

    getAllPredictions() {
        const results = {};
        for (const [name, model] of Object.entries(this.models)) {
            if (!model) continue;
            try {
                const pred = model();
                if (pred) results[name] = pred;
            } catch {}
        }
        return results;
    }

    // MODEL 68: VIP - chỉ cho 1 dự đoán duy nhất, không random
    model68() {
        const predictions = this.getAllPredictions();
        let totalT = 0, totalX = 0, countT = 0, countX = 0;

        for (const pred of Object.values(predictions)) {
            if (!pred || !pred.prediction) continue;
            if (pred.prediction === 'T') {
                totalT += pred.confidence || 0.5;
                countT++;
            } else if (pred.prediction === 'X') {
                totalX += pred.confidence || 0.5;
                countX++;
            }
        }

        const avgT = countT > 0 ? totalT / countT : 0;
        const avgX = countX > 0 ? totalX / countX : 0;

        let prediction, confidence, reason;

        if (avgT > avgX) {
            prediction = 'T';
            confidence = avgT;
            reason = `VIP chọn T (trung bình ${(avgT*100).toFixed(1)}% tin cậy)`;
        } else if (avgX > avgT) {
            prediction = 'X';
            confidence = avgX;
            reason = `VIP chọn X (trung bình ${(avgX*100).toFixed(1)}% tin cậy)`;
        } else {
            prediction = 'T';
            confidence = 0.6;
            reason = `VIP cân bằng, fallback theo T`;
        }

        return {
            prediction,
            confidence: Math.min(0.99, confidence),
            reason
        };
    }

    generatePrediction(isVIP = false) {
        if (isVIP) {
            return this.model68();
        }
        const results = [];
        for (const [name, model] of Object.entries(this.models)) {
            try {
                const pred = model();
                if (pred) results.push(pred);
            } catch {}
        }
        if (results.length === 0) return null;
        return results.reduce((best, cur) => cur.confidence > best.confidence ? cur : best);
    }
}

// ================= API Express =================
const predictor = new UltraDicePredictionSystem();

app.get('/predict', async (req, res) => {
    try {
        const { data } = await axios.get(API_URL);
        if (!data || !Array.isArray(data)) return res.json({ error: 'No data' });

        const latest = data[data.length - 1];
        if (latest && latest.phien !== lastPhien) {
            lastPhien = latest.phien;
            predictor.addResult(latest.result);
            cachedResult = predictor.generatePrediction(true); // VIP mode
        }
        res.json(cachedResult);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
