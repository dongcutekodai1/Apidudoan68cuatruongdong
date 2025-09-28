// HUYDAIXU.SITE
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

const API_URL = 'https://api50.onrender.com/history';

let lastPhien = 0;
let cachedResult = null;

let modelPredictions = {}; 

// ====== Dán toàn bộ khối thuật toán AI vào đây ======
// (bắt đầu từ `detectStreakAndBreak(...)` cho đến `generatePrediction(...)`)
//
// 👇👇👇👇👇👇👇👇👇👇👇👇👇👇
// ✂️ DÁN Ở ĐÂY ✂️
// Helper function: Detect streak and break probability
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
            regime: 'normal' // normal, volatile, trending, random
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
        // Khởi tạo tất cả models (21 chính + 21 mini + 42 hỗ trợ)
        for (let i = 1; i <= 21; i++) {
            // Model chính
            this.models[`model${i}`] = this[`model${i}`].bind(this);
            // Model mini
            this.models[`model${i}Mini`] = this[`model${i}Mini`].bind(this);
            // Model hỗ trợ
            this.models[`model${i}Support1`] = this[`model${i}Support1`].bind(this);
            this.models[`model${i}Support2`] = this[`model${i}Support2`].bind(this);
            
            // Khởi tạo trọng số và hiệu suất
            this.weights[`model${i}`] = 1;
            this.performance[`model${i}`] = { 
                correct: 0, 
                total: 0,
                recentCorrect: 0,
                recentTotal: 0,
                streak: 0,
                maxStreak: 0
            };
        }
        
        // Khởi tạo cơ sở dữ liệu pattern
        this.initPatternDatabase();
        this.initAdvancedPatterns();
        this.initSupportModels();
    }

    initPatternDatabase() {
        this.patternDatabase = {
            '1-1': { pattern: ['T', 'X', 'T', 'X'], probability: 0.7, strength: 0.8 },
            '1-2-1': { pattern: ['T', 'X', 'X', 'T'], probability: 0.65, strength: 0.75 },
            '2-1-2': { pattern: ['T', 'T', 'X', 'T', 'T'], probability: 0.68, strength: 0.78 },
            '3-1': { pattern: ['T', 'T', 'T', 'X'], probability: 0.72, strength: 0.82 },
            '1-3': { pattern: ['T', 'X', 'X', 'X'], probability: 0.72, strength: 0.82 },
            '2-2': { pattern: ['T', 'T', 'X', 'X'], probability: 0.66, strength: 0.76 },
            '2-3': { pattern: ['T', 'T', 'X', 'X', 'X'], probability: 0.71, strength: 0.81 },
            '3-2': { pattern: ['T', 'T', 'T', 'X', 'X'], probability: 0.73, strength: 0.83 },
            '4-1': { pattern: ['T', 'T', 'T', 'T', 'X'], probability: 0.76, strength: 0.86 },
            '1-4': { pattern: ['T', 'X', 'X', 'X', 'X'], probability: 0.76, strength: 0.86 },
            // Thêm các pattern khác
        };
    }

    initAdvancedPatterns() {
        this.advancedPatterns = {
            // Pattern động học (adaptive patterns)
            'dynamic-1': {
                detect: (data) => {
                    if (data.length < 6) return false;
                    const last6 = data.slice(-6);
                    return last6.filter(x => x === 'T').length === 4 && 
                           last6[last6.length-1] === 'T';
                },
                predict: () => 'X',
                confidence: 0.72,
                description: "4T trong 6 phiên, cuối là T -> dự đoán X"
            },
            'dynamic-2': {
                detect: (data) => {
                    if (data.length < 8) return false;
                    const last8 = data.slice(-8);
                    const tCount = last8.filter(x => x === 'T').length;
                    return tCount >= 6 && last8[last8.length-1] === 'T';
                },
                predict: () => 'X',
                confidence: 0.78,
                description: "6+T trong 8 phiên, cuối là T -> dự đoán X mạnh"
            },
            'alternating-3': {
                detect: (data) => {
                    if (data.length < 5) return false;
                    const last5 = data.slice(-5);
                    for (let i = 1; i < last5.length; i++) {
                        if (last5[i] === last5[i-1]) return false;
                    }
                    return true;
                },
                predict: (data) => data[data.length-1] === 'T' ? 'X' : 'T',
                confidence: 0.68,
                description: "5 phiên đan xen hoàn hảo -> dự đoán đảo chiều"
            },
            // Pattern chu kỳ
            'cyclic-7': {
                detect: (data) => {
                    if (data.length < 14) return false;
                    const firstHalf = data.slice(-14, -7);
                    const secondHalf = data.slice(-7);
                    return this.arraysEqual(firstHalf, secondHalf);
                },
                predict: (data) => data[data.length-7],
                confidence: 0.75,
                description: "Chu kỳ 7 phiên lặp lại -> dự đoán theo chu kỳ"
            },
            // Pattern momentum
            'momentum-break': {
                detect: (data) => {
                    if (data.length < 9) return false;
                    const first6 = data.slice(-9, -3);
                    const last3 = data.slice(-3);
                    const firstT = first6.filter(x => x === 'T').length;
                    const firstX = first6.filter(x => x === 'X').length;
                    return Math.abs(firstT - firstX) >= 4 && 
                           new Set(last3).size === 1 &&
                           last3[0] !== (firstT > firstX ? 'T' : 'X');
                },
                predict: (data) => {
                    const first6 = data.slice(-9, -3);
                    const firstT = first6.filter(x => x === 'T').length;
                    const firstX = first6.filter(x => x === 'X').length;
                    return firstT > firstX ? 'T' : 'X';
                },
                confidence: 0.71,
                description: "Momentum mạnh bị phá vỡ -> quay lại momentum chính"
            },
            // Pattern hỗn hợp
            'hybrid-pattern': {
                detect: (data) => {
                    if (data.length < 10) return false;
                    const segment = data.slice(-10);
                    const tCount = segment.filter(x => x === 'T').length;
                    const transitions = segment.slice(1).filter((x, i) => x !== segment[i]).length;
                    return tCount >= 3 && tCount <= 7 && transitions >= 6;
                },
                predict: (data) => {
                    const last = data[data.length-1];
                    const secondLast = data[data.length-2];
                    return last === secondLast ? (last === 'T' ? 'X' : 'T') : last;
                },
                confidence: 0.65,
                description: "Pattern hỗn hợp cao -> dự đoán based on last transitions"
            }
        };
    }

    initSupportModels() {
        // Khởi tạo các model hỗ trợ bổ sung
        for (let i = 1; i <= 21; i++) {
            // Thêm các model hỗ trợ phụ
            this.models[`model${i}Support3`] = this[`model${i}Support3`].bind(this);
            this.models[`model${i}Support4`] = this[`model${i}Support4`].bind(this);
        }
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    addResult(result) {
        // Cập nhật thống kê session
        if (this.history.length > 0) {
            const lastResult = this.history[this.history.length-1];
            const transitionKey = `${lastResult}to${result}`;
            this.sessionStats.transitions[transitionKey] = (this.sessionStats.transitions[transitionKey] || 0) + 1;
            
            // Cập nhật streak
            if (result === lastResult) {
                this.sessionStats.streaks[result]++;
                this.sessionStats.streaks[`max${result}`] = Math.max(
                    this.sessionStats.streaks[`max${result}`],
                    this.sessionStats.streaks[result]
                );
            } else {
                this.sessionStats.streaks[result] = 1;
                this.sessionStats.streaks[lastResult] = 0;
            }
        } else {
            this.sessionStats.streaks[result] = 1;
        }
        
        this.history.push(result);
        if (this.history.length > 200) {
            this.history.shift();
        }
        
        // Cập nhật độ biến động
        this.updateVolatility();
        
        // Cập nhật độ tin cậy pattern
        this.updatePatternConfidence();
        
        // Cập nhật trạng thái thị trường
        this.updateMarketState();
        
        // Cập nhật cơ sở dữ liệu pattern
        this.updatePatternDatabase();
    }

    updateVolatility() {
        if (this.history.length < 10) return;
        
        const recent = this.history.slice(-10);
        let changes = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] !== recent[i-1]) changes++;
        }
        
        this.sessionStats.volatility = changes / (recent.length - 1);
    }

    updatePatternConfidence() {
        // Kiểm tra độ chính xác của các pattern đã được sử dụng
        for (const [patternName, confidence] of Object.entries(this.sessionStats.patternConfidence)) {
            if (this.history.length < 2) continue;
            
            const lastResult = this.history[this.history.length-1];
            
            // Đơn giản hóa: giảm confidence nếu pattern dự đoán sai
            if (this.advancedPatterns[patternName]) {
                const prediction = this.advancedPatterns[patternName].predict(this.history.slice(0, -1));
                if (prediction !== lastResult) {
                    this.sessionStats.patternConfidence[patternName] = Math.max(
                        0.1, 
                        confidence * this.adaptiveParameters.patternConfidenceDecay
                    );
                } else {
                    this.sessionStats.patternConfidence[patternName] = Math.min(
                        0.95, 
                        confidence * this.adaptiveParameters.patternConfidenceGrowth
                    );
                }
            }
        }
    }

    updateMarketState() {
        if (this.history.length < 15) return;
        
        const recent = this.history.slice(-15);
        const tCount = recent.filter(x => x === 'T').length;
        const xCount = recent.filter(x => x === 'X').length;
        
        // Tính trend strength
        const trendStrength = Math.abs(tCount - xCount) / recent.length;
        
        // Xác định trend
        if (trendStrength > this.adaptiveParameters.trendStrengthThreshold) {
            this.marketState.trend = tCount > xCount ? 'up' : 'down';
        } else {
            this.marketState.trend = 'neutral';
        }
        
        // Tính momentum (dựa trên thay đổi gần đây)
        let momentum = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] === recent[i-1]) {
                momentum += recent[i] === 'T' ? 0.1 : -0.1;
            }
        }
        this.marketState.momentum = Math.tanh(momentum); // Chuẩn hóa về [-1, 1]
        
        // Tính stability (ngược với volatility)
        this.marketState.stability = 1 - this.sessionStats.volatility;
        
        // Xác định regime
        if (this.sessionStats.volatility > this.adaptiveParameters.volatilityThreshold) {
            this.marketState.regime = 'volatile';
        } else if (trendStrength > 0.7) {
            this.marketState.regime = 'trending';
        } else if (trendStrength < 0.3) {
            this.marketState.regime = 'random';
        } else {
            this.marketState.regime = 'normal';
        }
    }

    updatePatternDatabase() {
        if (this.history.length < 10) return;
        
        // Phát hiện pattern mới từ lịch sử
        for (let length = this.adaptiveParameters.patternMinLength; 
             length <= this.adaptiveParameters.patternMaxLength; length++) {
            for (let i = 0; i <= this.history.length - length; i++) {
                const segment = this.history.slice(i, i + length);
                const patternKey = segment.join('-');
                
                if (!this.patternDatabase[patternKey]) {
                    // Tính probability cho pattern mới
                    let count = 0;
                    for (let j = 0; j <= this.history.length - length - 1; j++) {
                        const testSegment = this.history.slice(j, j + length);
                        if (testSegment.join('-') === patternKey) {
                            count++;
                        }
                    }
                    
                    if (count > 2) { // Chỉ thêm pattern có xuất hiện ít nhất 3 lần
                        const probability = count / (this.history.length - length);
                        const strength = Math.min(0.9, probability * 1.2);
                        
                        this.patternDatabase[patternKey] = {
                            pattern: segment,
                            probability: probability,
                            strength: strength
                        };
                    }
                }
            }
        }
    }

    // MODEL 1: Nhận biết các loại cầu cơ bản
    model1() {
        const recent = this.history.slice(-10);
        if (recent.length < 4) return null;
        
        const patterns = this.model1Mini(recent);
        if (patterns.length === 0) return null;
        
        const bestPattern = patterns.reduce((best, current) => 
            current.probability > best.probability ? current : best
        );
        
        // Điều chỉnh confidence dựa trên market regime
        let confidence = bestPattern.probability * 0.8;
        if (this.marketState.regime === 'trending') {
            confidence *= 1.1;
        } else if (this.marketState.regime === 'volatile') {
            confidence *= 0.9;
        }
        
        return {
            prediction: bestPattern.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Phát hiện pattern ${bestPattern.type} (xác suất ${bestPattern.probability.toFixed(2)})`
        };
    }

    model1Mini(data) {
        const patterns = [];
        
        // Kiểm tra các pattern trong database
        for (const [type, patternData] of Object.entries(this.patternDatabase)) {
            const pattern = patternData.pattern;
            if (data.length < pattern.length) continue;
            
            const segment = data.slice(-pattern.length + 1); // So sánh với pattern trừ phần tử cuối
            const patternWithoutLast = pattern.slice(0, -1);
            
            if (segment.join('-') === patternWithoutLast.join('-')) {
                patterns.push({
                    type: type,
                    prediction: pattern[pattern.length - 1],
                    probability: patternData.probability,
                    strength: patternData.strength
                });
            }
        }
        
        return patterns;
    }

    model1Support1() {
        // Hỗ trợ phân tích pattern phức tạp
        return { 
            status: "Phân tích pattern nâng cao",
            totalPatterns: Object.keys(this.patternDatabase).length,
            recentPatterns: Object.keys(this.patternDatabase).length
        };
    }

    model1Support2() {
        // Hỗ trợ đánh giá độ tin cậy pattern
        const patternCount = Object.keys(this.patternDatabase).length;
        const avgConfidence = patternCount > 0 ? 
            Object.values(this.patternDatabase).reduce((sum, p) => sum + p.probability, 0) / patternCount : 0;
        
        return { 
            status: "Đánh giá độ tin cậy pattern",
            patternCount,
            averageConfidence: avgConfidence
        };
    }

    model1Support3() {
        // Phân tích hiệu suất pattern theo thời gian
        const recentPerformance = this.calculatePatternPerformance();
        return {
            status: "Phân tích hiệu suất pattern",
            performance: recentPerformance
        };
    }

    model1Support4() {
        // Tối ưu hóa parameters cho pattern detection
        const optimalParams = this.optimizePatternParameters();
        return {
            status: "Tối ưu parameters pattern",
            parameters: optimalParams
        };
    }

    calculatePatternPerformance() {
        const performance = {};
        const recentHistory = this.history.slice(-50);
        
        for (const [pattern, data] of Object.entries(this.patternDatabase)) {
            let correct = 0;
            let total = 0;
            
            for (let i = data.pattern.length; i < recentHistory.length; i++) {
                const segment = recentHistory.slice(i - data.pattern.length + 1, i);
                if (segment.join('-') === data.pattern.slice(0, -1).join('-')) {
                    total++;
                    if (recentHistory[i] === data.pattern[data.pattern.length - 1]) {
                        correct++;
                    }
                }
            }
            
            performance[pattern] = {
                accuracy: total > 0 ? correct / total : 0,
                occurrences: total
            };
        }
        
        return performance;
    }

    optimizePatternParameters() {
        // Adaptive adjustment of pattern parameters based on market conditions
        if (this.marketState.regime === 'volatile') {
            this.adaptiveParameters.patternMinLength = 4;
            this.adaptiveParameters.patternMaxLength = 6;
        } else if (this.marketState.regime === 'trending') {
            this.adaptiveParameters.patternMinLength = 3;
            this.adaptiveParameters.patternMaxLength = 5;
        } else {
            this.adaptiveParameters.patternMinLength = 3;
            this.adaptiveParameters.patternMaxLength = 8;
        }
        
        return { ...this.adaptiveParameters };
    }

    // MODEL 2: Bắt trend xu hướng ngắn và dài
    model2() {
        const shortTerm = this.history.slice(-5);
        const longTerm = this.history.slice(-20);
        
        if (shortTerm.length < 3 || longTerm.length < 10) return null;
        
        const shortAnalysis = this.model2Mini(shortTerm);
        const longAnalysis = this.model2Mini(longTerm);
        
        let prediction, confidence, reason;
        
        if (shortAnalysis.trend === longAnalysis.trend) {
            prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
            confidence = (shortAnalysis.strength + longAnalysis.strength) / 2;
            reason = `Xu hướng ngắn và dài hạn cùng ${shortAnalysis.trend}`;
        } else {
            if (shortAnalysis.strength > longAnalysis.strength * 1.5) {
                prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = shortAnalysis.strength;
                reason = `Xu hướng ngắn hạn mạnh hơn dài hạn`;
            } else {
                prediction = longAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = longAnalysis.strength;
                reason = `Xu hướng dài hạn ổn định hơn`;
            }
        }
        
        // Điều chỉnh confidence dựa trên market regime
        if (this.marketState.regime === 'trending') {
            confidence *= 1.15;
        } else if (this.marketState.regime === 'volatile') {
            confidence *= 0.85;
        }
        
        return { 
            prediction, 
            confidence: Math.min(0.95, confidence * 0.9), 
            reason 
        };
    }

    model2Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        
        let trend = tCount > xCount ? 'up' : (xCount > tCount ? 'down' : 'neutral');
        let strength = Math.abs(tCount - xCount) / data.length;
        
        // Phân tích chi tiết hơn
        let changes = 0;
        for (let i = 1; i < data.length; i++) {
            if (data[i] !== data[i-1]) changes++;
        }
        
        const volatility = changes / (data.length - 1);
        strength = strength * (1 - volatility / 2); // Điều chỉnh strength based on volatility
        
        return { trend, strength, volatility };
    }

    model2Support1() {
        // Phân tích chất lượng trend
        const quality = this.analyzeTrendQuality();
        return {
            status: "Phân tích chất lượng trend",
            quality
        };
    }

    model2Support2() {
        // Xác định điểm đảo chiều tiềm năng
        const reversalPoints = this.findPotentialReversals();
        return {
            status: "Xác định điểm đảo chiều",
            points: reversalPoints
        };
    }

    analyzeTrendQuality() {
        if (this.history.length < 20) return { quality: 'unknown', score: 0 };
        
        const trends = [];
        for (let i = 5; i <= 20; i += 5) {
            if (this.history.length >= i) {
                const analysis = this.model2Mini(this.history.slice(-i));
                trends.push(analysis);
            }
        }
        
        // Tính consistency giữa các trends
        let consistent = true;
        for (let i = 1; i < trends.length; i++) {
            if (trends[i].trend !== trends[0].trend) {
                consistent = false;
                break;
            }
        }
        
        const avgStrength = trends.reduce((sum, t) => sum + t.strength, 0) / trends.length;
        const avgVolatility = trends.reduce((sum, t) => sum + t.volatility, 0) / trends.length;
        
        const qualityScore = avgStrength * (1 - avgVolatility);
        let quality;
        
        if (qualityScore > 0.7) quality = 'excellent';
        else if (qualityScore > 0.5) quality = 'good';
        else if (qualityScore > 0.3) quality = 'fair';
        else quality = 'poor';
        
        return { quality, score: qualityScore, consistent };
    }

    findPotentialReversals() {
        const points = [];
        if (this.history.length < 15) return points;
        
        // Tìm các điểm mà trend có thể đảo chiều
        for (let i = 10; i < this.history.length - 5; i++) {
            const before = this.history.slice(i - 5, i);
            const after = this.history.slice(i, i + 5);
            
            const beforeAnalysis = this.model2Mini(before);
            const afterAnalysis = this.model2Mini(after);
            
            if (beforeAnalysis.trend !== afterAnalysis.trend && 
                beforeAnalysis.strength > 0.6 && 
                afterAnalysis.strength > 0.6) {
                points.push({
                    position: i,
                    beforeTrend: beforeAnalysis.trend,
                    afterTrend: afterAnalysis.trend,
                    strength: (beforeAnalysis.strength + afterAnalysis.strength) / 2
                });
            }
        }
        
        return points;
    }

    // MODEL 3: Xem trong 12 phiên gần nhất có sự chênh lệch cao thì sẽ dự đoán bên còn lại
    model3() {
        const recent = this.history.slice(-12);
        if (recent.length < 12) return null;
        
        const analysis = this.model3Mini(recent);
        
        if (analysis.difference < 0.4) return null;
        
        // Điều chỉnh confidence dựa trên market regime
        let confidence = analysis.difference * 0.8;
        if (this.marketState.regime === 'random') {
            confidence *= 1.1;
        } else if (this.marketState.regime === 'trending') {
            confidence *= 0.9;
        }
        
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Chênh lệch cao (${Math.round(analysis.difference * 100)}%) trong 12 phiên, dự đoán cân bằng`
        };
    }

    model3Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        const total = data.length;
        const difference = Math.abs(tCount - xCount) / total;
        
        return {
            difference,
            prediction: tCount > xCount ? 'X' : 'T',
            tCount,
            xCount
        };
    }

    model3Support1() {
        // Phân tích hiệu quả của mean reversion
        const effectiveness = this.analyzeMeanReversionEffectiveness();
        return {
            status: "Phân tích hiệu quả mean reversion",
            effectiveness
        };
    }

    model3Support2() {
        // Tìm ngưỡng chênh lệch tối ưu
        const optimalThreshold = this.findOptimalDifferenceThreshold();
        return {
            status: "Tìm ngưỡng chênh lệch tối ưu",
            threshold: optimalThreshold
        };
    }

    analyzeMeanReversionEffectiveness() {
        if (this.history.length < 30) return { effectiveness: 'unknown', successRate: 0 };
        
        let successes = 0;
        let opportunities = 0;
        
        for (let i = 12; i < this.history.length; i++) {
            const segment = this.history.slice(i - 12, i);
            const tCount = segment.filter(x => x === 'T').length;
            const xCount = segment.filter(x => x === 'X').length;
            const difference = Math.abs(tCount - xCount) / segment.length;
            
            if (difference >= 0.4) {
                opportunities++;
                const prediction = tCount > xCount ? 'X' : 'T';
                if (this.history[i] === prediction) {
                    successes++;
                }
            }
        }
        
        const successRate = opportunities > 0 ? successes / opportunities : 0;
        let effectiveness;
        
        if (successRate > 0.6) effectiveness = 'high';
        else if (successRate > 0.5) effectiveness = 'medium';
        else effectiveness = 'low';
        
        return { effectiveness, successRate, opportunities };
    }

    findOptimalDifferenceThreshold() {
        if (this.history.length < 50) return 0.4;
        
        let bestThreshold = 0.4;
        let bestSuccessRate = 0;
        
        // Test các threshold khác nhau
        for (let threshold = 0.3; threshold <= 0.6; threshold += 0.05) {
            let successes = 0;
            let opportunities = 0;
            
            for (let i = 12; i < this.history.length; i++) {
                const segment = this.history.slice(i - 12, i);
                const tCount = segment.filter(x => x === 'T').length;
                const xCount = segment.filter(x => x === 'X').length;
                const difference = Math.abs(tCount - xCount) / segment.length;
                
                if (difference >= threshold) {
                    opportunities++;
                    const prediction = tCount > xCount ? 'X' : 'T';
                    if (this.history[i] === prediction) {
                        successes++;
                    }
                }
            }
            
            const successRate = opportunities > 0 ? successes / opportunities : 0;
            if (successRate > bestSuccessRate) {
                bestSuccessRate = successRate;
                bestThreshold = threshold;
            }
        }
        
        return bestThreshold;
    }

    // MODEL 4: Bắt cầu ngắn hạn
    model4() {
        const recent = this.history.slice(-6);
        if (recent.length < 4) return null;
        
        const analysis = this.model4Mini(recent);
        
        if (analysis.confidence < 0.6) return null;
        
        // Điều chỉnh confidence dựa trên market regime
        let confidence = analysis.confidence;
        if (this.marketState.regime === 'trending') {
            confidence *= 1.1;
        } else if (this.marketState.regime === 'volatile') {
            confidence *= 0.9;
        }
        
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Cầu ngắn hạn ${analysis.trend} với độ tin cậy ${analysis.confidence.toFixed(2)}`
        };
    }

    model4Mini(data) {
        // Phân tích momentum ngắn hạn
        const last3 = data.slice(-3);
        const tCount = last3.filter(x => x === 'T').length;
        const xCount = last3.filter(x => x === 'X').length;
        
        let prediction, confidence, trend;
        
        if (tCount === 3) {
            prediction = 'T';
            confidence = 0.7;
            trend = 'Tăng mạnh';
        } else if (xCount === 3) {
            prediction = 'X';
            confidence = 0.7;
            trend = 'Giảm mạnh';
        } else if (tCount === 2) {
            prediction = 'T';
            confidence = 0.65;
            trend = 'Tăng nhẹ';
        } else if (xCount === 2) {
            prediction = 'X';
            confidence = 0.65;
            trend = 'Giảm nhẹ';
        } else {
            // Phân tích pattern phức tạp hơn
            const changes = data.slice(-4).filter((val, idx, arr) => 
                idx > 0 && val !== arr[idx-1]).length;
            
            if (changes >= 3) {
                prediction = data[data.length - 1] === 'T' ? 'X' : 'T';
                confidence = 0.6;
                trend = 'Đảo chiều';
            } else {
                prediction = data[data.length - 1];
                confidence = 0.55;
                trend = 'Ổn định';
            }
        }
        
        return { prediction, confidence, trend };
    }

    model4Support1() {
        // Phân tích hiệu quả momentum ngắn hạn
        const effectiveness = this.analyzeShortTermMomentumEffectiveness();
        return {
            status: "Phân tích hiệu quả momentum ngắn hạn",
            effectiveness
        };
    }

    model4Support2() {
        // Tối ưu hóa khung thời gian cho momentum
        const optimalTimeframe = this.findOptimalMomentumTimeframe();
        return {
            status: "Tối ưu khung thời gian momentum",
            timeframe: optimalTimeframe
        };
    }

    analyzeShortTermMomentumEffectiveness() {
        if (this.history.length < 20) return { effectiveness: 'unknown', successRate: 0 };
        
        let successes = 0;
        let opportunities = 0;
        
        for (let i = 6; i < this.history.length; i++) {
            const segment = this.history.slice(i - 6, i);
            const analysis = this.model4Mini(segment);
            
            if (analysis.confidence >= 0.6) {
                opportunities++;
                if (this.history[i] === analysis.prediction) {
                    successes++;
                }
            }
        }
        
        const successRate = opportunities > 0 ? successes / opportunities : 0;
        let effectiveness;
        
        if (successRate > 0.6) effectiveness = 'high';
        else if (successRate > 0.5) effectiveness = 'medium';
        else effectiveness = 'low';
        
        return { effectiveness, successRate, opportunities };
    }

    findOptimalMomentumTimeframe() {
        if (this.history.length < 50) return 6;
        
        let bestTimeframe = 6;
        let bestSuccessRate = 0;
        
        // Test các timeframe khác nhau
        for (let timeframe = 4; timeframe <= 8; timeframe++) {
            let successes = 0;
            let opportunities = 0;
            
            for (let i = timeframe; i < this.history.length; i++) {
                const segment = this.history.slice(i - timeframe, i);
                const analysis = this.model4Mini(segment);
                
                if (analysis.confidence >= 0.6) {
                    opportunities++;
                    if (this.history[i] === analysis.prediction) {
                        successes++;
                    }
                }
            }
            
            const successRate = opportunities > 0 ? successes / opportunities : 0;
            if (successRate > bestSuccessRate) {
                bestSuccessRate = successRate;
                bestTimeframe = timeframe;
            }
        }
        
        return bestTimeframe;
    }

    // MODEL 5: Nếu tỉ lệ trọng số dự đoán tài /Xỉu chênh lệch cao thì cân bằng lại
    model5() {
        const predictions = this.getAllPredictions();
        const tPredictions = Object.values(predictions).filter(p => p && p.prediction === 'T').length;
        const xPredictions = Object.values(predictions).filter(p => p && p.prediction === 'X').length;
        const total = tPredictions + xPredictions;
        
        if (total < 5) return null;
        
        const difference = Math.abs(tPredictions - xPredictions) / total;
        
        if (difference > 0.6) {
            return {
                prediction: tPredictions > xPredictions ? 'X' : 'T',
                confidence: difference * 0.9,
                reason: `Cân bằng tỷ lệ chênh lệch cao (${Math.round(difference * 100)}%) giữa các model`
            };
        }
        
        return null;
    }

    model5Support1() {
        // Phân tích sự đồng thuận giữa các model
        const consensus = this.analyzeModelConsensus();
        return {
            status: "Phân tích đồng thuận model",
            consensus
        };
    }

    model5Support2() {
        // Đánh giá mức độ phân kỳ giữa các model
        const divergence = this.analyzeModelDivergence();
        return {
            status: "Phân tích phân kỳ model",
            divergence
        };
    }

    analyzeModelConsensus() {
        const predictions = this.getAllPredictions();
        const validPredictions = Object.values(predictions).filter(p => p && p.prediction);
        
        if (validPredictions.length === 0) return { consensus: 'none', rate: 0 };
        
        const tCount = validPredictions.filter(p => p.prediction === 'T').length;
        const xCount = validPredictions.filter(p => p.prediction === 'X').length;
        const total = validPredictions.length;
        
        const consensusRate = Math.max(tCount, xCount) / total;
        let consensus;
        
        if (consensusRate > 0.7) consensus = 'strong';
        else if (consensusRate > 0.6) consensus = 'moderate';
        else consensus = 'weak';
        
        return { consensus, rate: consensusRate, tCount, xCount };
    }

    analyzeModelDivergence() {
        const predictions = this.getAllPredictions();
        const validPredictions = Object.values(predictions).filter(p => p && p.prediction);
        
        if (validPredictions.length < 2) return { divergence: 'low', score: 0 };
        
        // Tính độ phân kỳ dựa trên confidence và prediction
        let divergenceScore = 0;
        for (let i = 0; i < validPredictions.length; i++) {
            for (let j = i + 1; j < validPredictions.length; j++) {
                if (validPredictions[i].prediction !== validPredictions[j].prediction) {
                    divergenceScore += validPredictions[i].confidence * validPredictions[j].confidence;
                }
            }
        }
        
        // Chuẩn hóa score
        const maxPossible = (validPredictions.length * (validPredictions.length - 1)) / 2;
        divergenceScore = divergenceScore / maxPossible;
        
        let divergence;
        if (divergenceScore > 0.7) divergence = 'high';
        else if (divergenceScore > 0.4) divergence = 'medium';
        else divergence = 'low';
        
        return { divergence, score: divergenceScore };
    }

    // MODEL 6: Biết lúc nào nên bắt theo cầu hay bẻ cầu
    model6() {
        const trendAnalysis = this.model2();
        const continuity = this.model6Mini(this.history.slice(-8));
        const breakProbability = this.model10Mini(this.history);
        
        if (continuity.streak >= 5 && breakProbability > 0.7) {
            return {
                prediction: trendAnalysis.prediction === 'T' ? 'X' : 'T',
                confidence: breakProbability * 0.8,
                reason: `Cầu liên tục ${continuity.streak} lần, xác suất bẻ cầu ${breakProbability.toFixed(2)}`
            };
        }
        
        return {
            prediction: trendAnalysis.prediction,
            confidence: trendAnalysis.confidence * 0.9,
            reason: `Tiếp tục theo xu hướng, cầu chưa đủ mạnh để bẻ`
        };
    }

    model6Mini(data) {
        if (data.length < 2) return { streak: 0, direction: 'neutral', maxStreak: 0 };
        
        let currentStreak = 1;
        let maxStreak = 1;
        let direction = data[data.length - 1];
        
        for (let i = data.length - 1; i > 0; i--) {
            if (data[i] === data[i-1]) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                break;
            }
        }
        
        return { streak: currentStreak, direction, maxStreak };
    }

    model6Support1() {
        // Phân tích hiệu quả của việc bẻ cầu
        const effectiveness = this.analyzeBreakEffectiveness();
        return {
            status: "Phân tích hiệu quả bẻ cầu",
            effectiveness
        };
    }

    model6Support2() {
        // Xác định điều kiện tối ưu để bẻ cầu
        const optimalConditions = this.findOptimalBreakConditions();
        return {
            status: "Xác định điều kiện bẻ cầu tối ưu",
            conditions: optimalConditions
        };
    }

    analyzeBreakEffectiveness() {
        if (this.history.length < 30) return { effectiveness: 'unknown', successRate: 0 };
        
        let successes = 0;
        let opportunities = 0;
        
        for (let i = 8; i < this.history.length; i++) {
            const segment = this.history.slice(i - 8, i);
            const continuity = this.model6Mini(segment);
            const breakProb = this.model10Mini(this.history.slice(0, i));
            
            if (continuity.streak >= 5 && breakProb > 0.7) {
                opportunities++;
                const trendAnalysis = this.model2Mini(segment);
                const prediction = trendAnalysis.trend === 'up' ? 'X' : 'T';
                
                if (this.history[i] === prediction) {
                    successes++;
                }
            }
        }
        
        const successRate = opportunities > 0 ? successes / opportunities : 0;
        let effectiveness;
        
        if (successRate > 0.6) effectiveness = 'high';
        else if (successRate > 0.5) effectiveness = 'medium';
        else effectiveness = 'low';
        
        return { effectiveness, successRate, opportunities };
    }

    findOptimalBreakConditions() {
        if (this.history.length < 50) return { minStreak: 5, minProbability: 0.7 };
        
        let bestMinStreak = 5;
        let bestMinProbability = 0.7;
        let bestSuccessRate = 0;
        
        // Test các combination khác nhau
        for (let minStreak = 4; minStreak <= 7; minStreak++) {
            for (let minProb = 0.6; minProb <= 0.8; minProb += 0.05) {
                let successes = 0;
                let opportunities = 0;
                
                for (let i = 8; i < this.history.length; i++) {
                    const segment = this.history.slice(i - 8, i);
                    const continuity = this.model6Mini(segment);
                    const breakProb = this.model10Mini(this.history.slice(0, i));
                    
                    if (continuity.streak >= minStreak && breakProb >= minProb) {
                        opportunities++;
                        const trendAnalysis = this.model2Mini(segment);
                        const prediction = trendAnalysis.trend === 'up' ? 'X' : 'T';
                        
                        if (this.history[i] === prediction) {
                            successes++;
                        }
                    }
                }
                
                const successRate = opportunities > 0 ? successes / opportunities : 0;
                if (successRate > bestSuccessRate) {
                    bestSuccessRate = successRate;
                    bestMinStreak = minStreak;
                    bestMinProbability = minProb;
                }
            }
        }
        
        return { minStreak: bestMinStreak, minProbability: bestMinProbability, successRate: bestSuccessRate };
    }

    // MODEL 7: Cân bằng trọng số từng model khi chênh lệch quá cao
    model7() {
        const performanceStats = this.model13Mini();
        const imbalance = this.model7Mini(performanceStats);
        
        if (imbalance > 0.3) {
            this.adjustWeights(performanceStats);
            return {
                prediction: null,
                confidence: 0,
                reason: `Điều chỉnh trọng số do chênh lệch hiệu suất ${imbalance.toFixed(2)}`
            };
        }
        
        return null;
    }

    model7Mini(performanceStats) {
        const accuracies = Object.values(performanceStats).map(p => p.accuracy);
        if (accuracies.length < 2) return 0;
        
        const maxAccuracy = Math.max(...accuracies);
        const minAccuracy = Math.min(...accuracies);
        
        return (maxAccuracy - minAccuracy) / maxAccuracy;
    }

    adjustWeights(performanceStats) {
        const avgAccuracy = Object.values(performanceStats).reduce((sum, p) => sum + p.accuracy, 0) / 
                           Object.values(performanceStats).length;
        
        for (const [model, stats] of Object.entries(performanceStats)) {
            // Điều chỉnh trọng số dựa trên độ lệch so với trung bình
            const deviation = stats.accuracy - avgAccuracy;
            this.weights[model] = Math.max(0.1, Math.min(2, 1 + deviation * 2));
        }
    }

    model7Support1() {
        // Phân tích phân bố trọng số
        const weightDistribution = this.analyzeWeightDistribution();
        return {
            status: "Phân tích phân bố trọng số",
            distribution: weightDistribution
        };
    }

    model7Support2() {
        // Tối ưu hóa algorithm điều chỉnh trọng số
        const optimization = this.optimizeWeightAdjustment();
        return {
            status: "Tối ưu điều chỉnh trọng số",
            optimization
        };
    }

    analyzeWeightDistribution() {
        const weights = Object.values(this.weights);
        const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
        const stdDev = Math.sqrt(variance);
        
        return { mean, variance, stdDev, min: Math.min(...weights), max: Math.max(...weights) };
    }

    optimizeWeightAdjustment() {
        // Adaptive learning rate based on market conditions
        let learningRate = 1.0;
        
        if (this.marketState.regime === 'volatile') {
            learningRate = 0.8; // Conservative adjustment in volatile markets
        } else if (this.marketState.regime === 'trending') {
            learningRate = 1.2; // More aggressive adjustment in trending markets
        }
        
        return { learningRate };
    }

    // MODEL 8: Nhận biết cầu xấu (cầu ko theo bất kì xu hướng nào)
    model8() {
        const randomness = this.model8Mini(this.history.slice(-15));
        
        if (randomness > 0.7) {
            // Giảm trọng số các model dựa trên pattern
            ['model1', 'model4', 'model9', 'model12'].forEach(model => {
                this.weights[model] = Math.max(0.3, this.weights[model] * 0.7);
            });
            
            // Tăng trọng số các model dựa trên mean reversion
            ['model3', 'model5', 'model6'].forEach(model => {
                this.weights[model] = Math.min(2, this.weights[model] * 1.2);
            });
            
            return {
                prediction: null,
                confidence: 0,
                reason: `Phát hiện cầu xấu (độ ngẫu nhiên ${randomness.toFixed(2)}), điều chỉnh trọng số model`
            };
        }
        
        return null;
    }

    model8Mini(data) {
        if (data.length < 10) return 0;
        
        // Tính độ ngẫu nhiên dựa trên số lần thay đổi
        let changes = 0;
        for (let i = 1; i < data.length; i++) {
            if (data[i] !== data[i-1]) changes++;
        }
        
        const changeRatio = changes / (data.length - 1);
        
        // Tính phân bố
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        const distribution = Math.abs(tCount - xCount) / data.length;
        
        // Tính entropy
        const pT = tCount / data.length;
        const pX = xCount / data.length;
        let entropy = 0;
        if (pT > 0) entropy -= pT * Math.log2(pT);
        if (pX > 0) entropy -= pX * Math.log2(pX);
        
        // Kết hợp cả ba yếu tố
        return (changeRatio * 0.4 + (1 - distribution) * 0.3 + entropy * 0.3);
    }

    model8Support1() {
        // Phân tích các đặc điểm của cầu xấu
        const characteristics = this.analyzeBadPatternCharacteristics();
        return {
            status: "Phân tích đặc điểm cầu xấu",
            characteristics
        };
    }

    model8Support2() {
        // Đề xuất chiến lược cho cầu xấu
        const strategies = this.suggestStrategiesForBadPatterns();
        return {
            status: "Đề xuất chiến lược cho cầu xấu",
            strategies
        };
    }

    analyzeBadPatternCharacteristics() {
        if (this.history.length < 30) return { characteristics: 'unknown' };
        
        const recent = this.history.slice(-30);
        const randomness = this.model8Mini(recent);
        const volatility = this.sessionStats.volatility;
        
        let characteristics;
        if (randomness > 0.7 && volatility > 0.6) {
            characteristics = 'high_randomness_high_volatility';
        } else if (randomness > 0.7) {
            characteristics = 'high_randomness';
        } else if (volatility > 0.6) {
            characteristics = 'high_volatility';
        } else {
            characteristics = 'normal';
        }
        
        return { characteristics, randomness, volatility };
    }

    suggestStrategiesForBadPatterns() {
        const characteristics = this.analyzeBadPatternCharacteristics();
        let strategies = [];
        
        switch (characteristics.characteristics) {
            case 'high_randomness_high_volatility':
                strategies = ['reduce_position_size', 'focus_on_mean_reversion', 'avoid_pattern_based_models'];
                break;
            case 'high_randomness':
                strategies = ['increase_diversification', 'use_shorter_timeframes', 'focus_on_consensus_models'];
                break;
            case 'high_volatility':
                strategies = ['wait_for_clear_signals', 'use_breakout_strategies', 'adjust_risk_management'];
                break;
            default:
                strategies = ['normal_operation'];
        }
        
        return strategies;
    }

    // MODEL 9: Nhận biết các loại cầu cơ bản (nâng cao)
    model9() {
        const recent = this.history.slice(-12);
        if (recent.length < 8) return null;
        
        const complexPatterns = this.model9Mini(recent);
        if (complexPatterns.length === 0) return null;
        
        const bestPattern = complexPatterns.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );
        
        // Điều chỉnh confidence dựa trên market regime
        let confidence = bestPattern.confidence;
        if (this.marketState.regime === 'trending') {
            confidence *= 1.1;
        } else if (this.marketState.regime === 'volatile') {
            confidence *= 0.9;
        }
        
        return {
            prediction: bestPattern.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Phát hiện pattern phức tạp: ${bestPattern.type}`
        };
    }

    model9Mini(data) {
        const patterns = [];
        
        // Kiểm tra các pattern phức tạp hơn
        for (let patternLength = 4; patternLength <= 6; patternLength++) {
            if (data.length < patternLength) continue;
            
            const segment = data.slice(-patternLength);
            const patternKey = segment.join('-');
            
            if (this.patternDatabase[patternKey]) {
                patterns.push({
                    type: patternKey,
                    prediction: this.patternDatabase[patternKey].pattern[
                        this.patternDatabase[patternKey].pattern.length - 1
                    ],
                    confidence: this.patternDatabase[patternKey].probability * 0.75
                });
            }
        }
        
        return patterns;
    }

    model9Support1() {
        // Phân tích độ phức tạp của pattern
        const complexity = this.analyzePatternComplexity();
        return {
            status: "Phân tích độ phức tạp pattern",
            complexity
        };
    }

    model9Support2() {
        // Đánh giá khả năng tồn tại của pattern
        const viability = this.assessPatternViability();
        return {
            status: "Đánh giá khả năng tồn tại pattern",
            viability
        };
    }

    analyzePatternComplexity() {
        const patterns = Object.keys(this.patternDatabase);
        let totalComplexity = 0;
        
        for (const pattern of patterns) {
            const length = pattern.split('-').length;
            totalComplexity += length;
        }
        
        const avgComplexity = patterns.length > 0 ? totalComplexity / patterns.length : 0;
        
        let complexityLevel;
        if (avgComplexity > 5) complexityLevel = 'high';
        else if (avgComplexity > 4) complexityLevel = 'medium';
        else complexityLevel = 'low';
        
        return { level: complexityLevel, average: avgComplexity, total: patterns.length };
    }

    assessPatternViability() {
        const performance = this.calculatePatternPerformance();
        let viablePatterns = 0;
        let totalPatterns = 0;
        
        for (const [pattern, stats] of Object.entries(performance)) {
            totalPatterns++;
            if (stats.accuracy > 0.55 && stats.occurrences >= 3) {
                viablePatterns++;
            }
        }
        
        const viabilityRate = totalPatterns > 0 ? viablePatterns / totalPatterns : 0;
        
        let viability;
        if (viabilityRate > 0.7) viability = 'high';
        else if (viabilityRate > 0.5) viability = 'medium';
        else viability = 'low';
        
        return { viability, rate: viabilityRate, viable: viablePatterns, total: totalPatterns };
    }

    // MODEL 10: Nhận biết xác suất bẻ cầu
    model10() {
        const breakProb = this.model10Mini(this.history);
        
        return {
            prediction: null,
            confidence: breakProb,
            reason: `Xác suất bẻ cầu: ${breakProb.toFixed(2)}`
        };
    }

    model10Mini(data) {
        if (data.length < 20) return 0.5;
        
        // Phân tích lịch sử bẻ cầu
        let breakCount = 0;
        let totalOpportunities = 0;
        
        for (let i = 5; i < data.length; i++) {
            const segment = data.slice(i-5, i);
            const streak = this.model6Mini(segment).streak;
            
            if (streak >= 4) {
                totalOpportunities++;
                if (data[i] !== segment[segment.length-1]) {
                    breakCount++;
                }
            }
        }
        
        return totalOpportunities > 0 ? breakCount / totalOpportunities : 0.5;
    }

    model10Support1() {
        // Phân tích các yếu tố ảnh hưởng đến xác suất bẻ cầu
        const factors = this.analyzeBreakFactors();
        return {
            status: "Phân tích yếu tố ảnh hưởng bẻ cầu",
            factors
        };
    }

    model10Support2() {
        // Dự báo xác suất bẻ cầu trong tương lai
        const forecast = this.forecastBreakProbability();
        return {
            status: "Dự báo xác suất bẻ cầu",
            forecast
        };
    }

    analyzeBreakFactors() {
        if (this.history.length < 30) return { factors: [] };
        
        const factors = [];
        const recent = this.history.slice(-30);
        
        // Phân tích mối correlation giữa các yếu tố và break probability
        const streakLengths = [];
        const breakResults = [];
        
        for (let i = 5; i < recent.length; i++) {
            const segment = recent.slice(i-5, i);
            const streak = this.model6Mini(segment).streak;
            streakLengths.push(streak);
            breakResults.push(recent[i] !== segment[segment.length-1] ? 1 : 0);
        }
        
        // Tính correlation đơn giản
        if (streakLengths.length > 5) {
            const avgStreak = streakLengths.reduce((sum, val) => sum + val, 0) / streakLengths.length;
            const avgBreak = breakResults.reduce((sum, val) => sum + val, 0) / breakResults.length;
            
            let covariance = 0;
            for (let i = 0; i < streakLengths.length; i++) {
                covariance += (streakLengths[i] - avgStreak) * (breakResults[i] - avgBreak);
            }
            covariance /= streakLengths.length;
            
            const varianceStreak = streakLengths.reduce((sum, val) => sum + Math.pow(val - avgStreak, 2), 0) / streakLengths.length;
            const varianceBreak = breakResults.reduce((sum, val) => sum + Math.pow(val - avgBreak, 2), 0) / breakResults.length;
            
            const correlation = covariance / Math.sqrt(varianceStreak * varianceBreak);
            factors.push({ factor: 'streak_length', correlation: correlation });
        }
        
        return { factors };
    }

    forecastBreakProbability() {
        const currentStreak = this.sessionStats.streaks[this.history[this.history.length-1] || 'T'];
        const historicalBreakProb = this.model10Mini(this.history);
        
        // Dự báo đơn giản dựa trên streak hiện tại và lịch sử
        let forecast = historicalBreakProb;
        if (currentStreak >= 5) {
            forecast = Math.min(0.9, forecast * (1 + currentStreak * 0.1));
        }
        
        // Điều chỉnh dựa trên market regime
        if (this.marketState.regime === 'volatile') {
            forecast *= 1.1;
        } else if (this.marketState.regime === 'trending') {
            forecast *= 0.9;
        }
        
        return Math.min(0.95, Math.max(0.05, forecast));
    }

    // MODEL 11: Nhận diện biến động xúc xắc và nguyên lý xúc xắc
    model11() {
        const volatility = this.model11Mini(this.history.slice(-20));
        const prediction = this.model11Predict(volatility);
        
        return {
            prediction: prediction.value,
            confidence: prediction.confidence,
            reason: `Biến động ${volatility.level}, dự đoán ${prediction.value}`
        };
    }

    model11Mini(data) {
        if (data.length < 10) return { level: 'medium', value: 0.5 };
        
        let changes = 0;
        for (let i = 1; i < data.length; i++) {
            if (data[i] !== data[i-1]) changes++;
        }
        
        const changeRatio = changes / (data.length - 1);
        
        if (changeRatio < 0.3) return { level: 'low', value: changeRatio };
        if (changeRatio > 0.7) return { level: 'high', value: changeRatio };
        return { level: 'medium', value: changeRatio };
    }

    model11Predict(volatility) {
        if (volatility.level === 'low') {
            // Ít biến động, tiếp tục xu hướng
            const last = this.history[this.history.length - 1];
            return { value: last, confidence: 0.7 };
        } else if (volatility.level === 'high') {
            // Nhiều biến động, khó dự đoán
            return { value: Math.random() > 0.5 ? 'T' : 'X', confidence: 0.5 };
        } else {
            // Biến động trung bình
            const trend = this.model2Mini(this.history.slice(-10));
            return { 
                value: trend.trend === 'up' ? 'T' : 'X', 
                confidence: trend.strength * 0.8 
            };
        }
    }

    model11Support1() {
        // Phân tích nguyên nhân biến động
        const causes = this.analyzeVolatilityCauses();
        return {
            status: "Phân tích nguyên nhân biến động",
            causes
        };
    }

    model11Support2() {
        // Dự báo biến động trong tương lai
        const forecast = this.forecastVolatility();
        return {
            status: "Dự báo biến động",
            forecast
        };
    }

    analyzeVolatilityCauses() {
        const causes = [];
        const recent = this.history.slice(-20);
        
        // Kiểm tra các pattern có thể gây biến động
        const streak = this.model6Mini(recent).streak;
        if (streak >= 5) {
            causes.push('high_streak');
        }
        
        const distribution = this.model3Mini(recent).difference;
        if (distribution < 0.3) {
            causes.push('balanced_distribution');
        }
        
        // Thêm các nguyên nhân khác
        if (this.marketState.regime === 'volatile') {
            causes.push('market_regime');
        }
        
        return causes;
    }

    forecastVolatility() {
        const currentVolatility = this.sessionStats.volatility;
        const historicalVolatility = this.calculateHistoricalVolatility();
        
        // Dự báo đơn giản
        let forecast = (currentVolatility * 0.7 + historicalVolatility * 0.3);
        
        // Điều chỉnh dựa trên market regime
        if (this.marketState.regime === 'volatile') {
            forecast = Math.min(0.95, forecast * 1.2);
        } else if (this.marketState.regime === 'trending') {
            forecast = Math.max(0.2, forecast * 0.8);
        }
        
        return forecast;
    }

    calculateHistoricalVolatility() {
        if (this.history.length < 30) return this.sessionStats.volatility;
        
        let totalVolatility = 0;
        let count = 0;
        
        for (let i = 10; i < this.history.length; i += 5) {
            const segment = this.history.slice(Math.max(0, i - 10), i);
            const changes = segment.slice(1).filter((val, idx) => val !== segment[idx]).length;
            totalVolatility += changes / (segment.length - 1);
            count++;
        }
        
        return count > 0 ? totalVolatility / count : this.sessionStats.volatility;
    }

    // MODEL 12: nhận diện nhiều mẫu cầu hơn ngắn
    model12() {
        const shortPatterns = this.model12Mini(this.history.slice(-8));
        
        if (shortPatterns.length === 0) return null;
        
        const bestPattern = shortPatterns.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );
        
        return {
            prediction: bestPattern.prediction,
            confidence: bestPattern.confidence,
            reason: `Mẫu cầu ngắn: ${bestPattern.type}`
        };
    }

    model12Mini(data) {
        const patterns = [];
        
        // Các mẫu ngắn đặc biệt
        const shortPatterns = {
            'T-X-T': { prediction: 'X', confidence: 0.65 },
            'X-T-X': { prediction: 'T', confidence: 0.65 },
            'T-T-X': { prediction: 'X', confidence: 0.7 },
            'X-X-T': { prediction: 'T', confidence: 0.7 },
            'T-X-X': { prediction: 'T', confidence: 0.6 },
            'X-T-T': { prediction: 'X', confidence: 0.6 },
            'T-T-T-X': { prediction: 'X', confidence: 0.72 },
            'X-X-X-T': { prediction: 'T', confidence: 0.72 },
            'T-X-T-X': { prediction: 'X', confidence: 0.68 },
            'X-T-X-T': { prediction: 'T', confidence: 0.68 }
        };
        
        if (data.length >= 3) {
            const last3 = data.slice(-3).join('-');
            if (shortPatterns[last3]) {
                patterns.push({
                    type: last3,
                    prediction: shortPatterns[last3].prediction,
                    confidence: shortPatterns[last3].confidence
                });
            }
        }
        
        if (data.length >= 4) {
            const last4 = data.slice(-4).join('-');
            if (shortPatterns[last4]) {
                patterns.push({
                    type: last4,
                    prediction: shortPatterns[last4].prediction,
                    confidence: shortPatterns[last4].confidence
                });
            }
        }
        
        return patterns;
    }

    model12Support1() {
        // Phân tích hiệu suất của các mẫu ngắn
        const performance = this.analyzeShortPatternPerformance();
        return {
            status: "Phân tích hiệu suất mẫu ngắn",
            performance
        };
    }

    model12Support2() {
        // Tối ưu hóa độ dài mẫu ngắn
        const optimization = this.optimizeShortPatternLength();
        return {
            status: "Tối ưu độ dài mẫu ngắn",
            optimization
        };
    }

    analyzeShortPatternPerformance() {
        if (this.history.length < 30) return { performance: {} };
        
        const performance = {};
        const shortPatterns = {
            'T-X-T': { prediction: 'X', confidence: 0.65 },
            'X-T-X': { prediction: 'T', confidence: 0.65 },
            'T-T-X': { prediction: 'X', confidence: 0.7 },
            'X-X-T': { prediction: 'T', confidence: 0.7 },
            'T-X-X': { prediction: 'T', confidence: 0.6 },
            'X-T-T': { prediction: 'X', confidence: 0.6 }
        };
        
        for (const [pattern, data] of Object.entries(shortPatterns)) {
            let correct = 0;
            let total = 0;
            const patternLength = pattern.split('-').length;
            
            for (let i = patternLength; i < this.history.length; i++) {
                const segment = this.history.slice(i - patternLength, i);
                if (segment.join('-') === pattern) {
                    total++;
                    if (this.history[i] === data.prediction) {
                        correct++;
                    }
                }
            }
            
            performance[pattern] = {
                accuracy: total > 0 ? correct / total : 0,
                occurrences: total
            };
        }
        
        return performance;
    }

    optimizeShortPatternLength() {
        if (this.history.length < 50) return { optimalLength: 3 };
        
        let bestLength = 3;
        let bestSuccessRate = 0;
        
        for (let length = 2; length <= 5; length++) {
            let totalSuccess = 0;
            let totalOpportunities = 0;
            
            // Tạo các pattern có độ dài xác định
            const patterns = this.generatePatternsOfLength(length);
            
            for (const pattern of patterns) {
                let correct = 0;
                let opportunities = 0;
                
                for (let i = length; i < this.history.length; i++) {
                    const segment = this.history.slice(i - length, i);
                    if (segment.join('-') === pattern) {
                        opportunities++;
                        // Dự đoán đảo chiều cho pattern
                        const prediction = segment[segment.length-1] === 'T' ? 'X' : 'T';
                        if (this.history[i] === prediction) {
                            correct++;
                        }
                    }
                }
                
                const successRate = opportunities > 0 ? correct / opportunities : 0;
                totalSuccess += successRate;
                totalOpportunities++;
            }
            
            const avgSuccessRate = totalOpportunities > 0 ? totalSuccess / totalOpportunities : 0;
            if (avgSuccessRate > bestSuccessRate) {
                bestSuccessRate = avgSuccessRate;
                bestLength = length;
            }
        }
        
        return { optimalLength: bestLength, successRate: bestSuccessRate };
    }

    generatePatternsOfLength(length) {
        const patterns = [];
        const generate = (current) => {
            if (current.length === length) {
                patterns.push(current.join('-'));
                return;
            }
            
            generate([...current, 'T']);
            generate([...current, 'X']);
        };
        
        generate([]);
        return patterns;
    }

    // MODEL 13: đánh giá hiệu suất từng mô hình
    model13() {
        const performance = this.model13Mini();
        const bestModel = Object.entries(performance).reduce((best, [model, stats]) => 
            stats.accuracy > best.accuracy ? { model, ...stats } : best
        , { model: null, accuracy: 0 });
        
        return {
            prediction: null,
            confidence: bestModel.accuracy,
            reason: `Model hiệu suất cao nhất: ${bestModel.model} (${bestModel.accuracy.toFixed(2)})`
        };
    }

    model13Mini() {
        const stats = {};
        
        for (const model of Object.keys(this.performance)) {
            if (this.performance[model].total > 0) {
                stats[model] = {
                    accuracy: this.performance[model].correct / this.performance[model].total,
                    recentAccuracy: this.performance[model].recentTotal > 0 ? 
                        this.performance[model].recentCorrect / this.performance[model].recentTotal : 0,
                    total: this.performance[model].total,
                    recentTotal: this.performance[model].recentTotal,
                    streak: this.performance[model].streak,
                    maxStreak: this.performance[model].maxStreak
                };
            }
        }
        
        return stats;
    }

    model13Support1() {
        // Phân tích xu hướng hiệu suất
        const trends = this.analyzePerformanceTrends();
        return {
            status: "Phân tích xu hướng hiệu suất",
            trends
        };
    }

    model13Support2() {
        // Đề xuất cải thiện hiệu suất
        const improvements = this.suggestPerformanceImprovements();
        return {
            status: "Đề xuất cải thiện hiệu suất",
            improvements
        };
    }

    analyzePerformanceTrends() {
        const trends = {};
        const performance = this.model13Mini();
        
        for (const [model, stats] of Object.entries(performance)) {
            const trend = stats.recentAccuracy - stats.accuracy;
            let trendDirection;
            
            if (trend > 0.1) trendDirection = 'improving';
            else if (trend < -0.1) trendDirection = 'declining';
            else trendDirection = 'stable';
            
            trends[model] = {
                direction: trendDirection,
                magnitude: Math.abs(trend),
                current: stats.accuracy,
                recent: stats.recentAccuracy
            };
        }
        
        return trends;
    }

    suggestPerformanceImprovements() {
        const improvements = {};
        const performance = this.model13Mini();
        const trends = this.analyzePerformanceTrends();
        
        for (const [model, stats] of Object.entries(performance)) {
            const trend = trends[model];
            const suggestions = [];
            
            if (stats.accuracy < 0.5) {
                suggestions.push('consider_reducing_weight');
            }
            
            if (trend.direction === 'declining') {
                suggestions.push('investigate_recent_performance');
            }
            
            if (stats.recentTotal < 10) {
                suggestions.push('need_more_data');
            }
            
            improvements[model] = suggestions;
        }
        
        return improvements;
    }

    // MODEL 14: tính xác xuất bẻ cầu xu hướng
    model14() {
        const breakProb = this.model14Mini(this.history);
        
        return {
            prediction: null,
            confidence: breakProb,
            reason: `Xác suất bẻ cầu xu hướng: ${breakProb.toFixed(2)}`
        };
    }

    model14Mini(data) {
        if (data.length < 15) return 0.5;
        
        let breakCount = 0;
        let trendCount = 0;
        
        for (let i = 10; i < data.length; i++) {
            const segment = data.slice(i-10, i);
            const trend = this.model2Mini(segment);
            
            if (trend.strength > 0.6) {
                trendCount++;
                if (data[i] !== (trend.trend === 'up' ? 'T' : 'X')) {
                    breakCount++;
                }
            }
        }
        
        return trendCount > 0 ? breakCount / trendCount : 0.5;
    }

    model14Support1() {
        // Phân tích các yếu tố ảnh hưởng đến bẻ cầu xu hướng
        const factors = this.analyzeTrendBreakFactors();
        return {
            status: "Phân tích yếu tố bẻ cầu xu hướng",
            factors
        };
    }

    model14Support2() {
        // Dự báo xác suất bẻ cầu xu hướng
        const forecast = this.forecastTrendBreakProbability();
        return {
            status: "Dự báo xác suất bẻ cầu xu hướng",
            forecast
        };
    }

    analyzeTrendBreakFactors() {
        if (this.history.length < 40) return { factors: [] };
        
        const factors = [];
        
        // Phân tích mối quan hệ giữa độ dài xu hướng và xác suất bẻ
        const trendLengths = [];
        const breakResults = [];
        
        for (let i = 15; i < this.history.length; i++) {
            const segment = this.history.slice(i-15, i);
            const trend = this.model2Mini(segment);
            
            if (trend.strength > 0.6) {
                // Ước tính độ dài xu hướng
                let trendLength = 1;
                for (let j = i-2; j >= 0; j--) {
                    if (this.history[j] === (trend.trend === 'up' ? 'T' : 'X')) {
                        trendLength++;
                    } else {
                        break;
                    }
                }
                
                trendLengths.push(trendLength);
                breakResults.push(this.history[i] !== (trend.trend === 'up' ? 'T' : 'X') ? 1 : 0);
            }
        }
        
        // Tính correlation
        if (trendLengths.length > 5) {
            const avgLength = trendLengths.reduce((sum, val) => sum + val, 0) / trendLengths.length;
            const avgBreak = breakResults.reduce((sum, val) => sum + val, 0) / breakResults.length;
            
            let covariance = 0;
            for (let i = 0; i < trendLengths.length; i++) {
                covariance += (trendLengths[i] - avgLength) * (breakResults[i] - avgBreak);
            }
            covariance /= trendLengths.length;
            
            const varianceLength = trendLengths.reduce((sum, val) => sum + Math.pow(val - avgLength, 2), 0) / trendLengths.length;
            const varianceBreak = breakResults.reduce((sum, val) => sum + Math.pow(val - avgBreak, 2), 0) / breakResults.length;
            
            const correlation = covariance / Math.sqrt(varianceLength * varianceBreak);
            factors.push({ factor: 'trend_length', correlation: correlation });
        }
        
        return { factors };
    }

    forecastTrendBreakProbability() {
        const currentTrend = this.model2Mini(this.history.slice(-10));
        const historicalBreakProb = this.model14Mini(this.history);
        
        let forecast = historicalBreakProb;
        
        // Điều chỉnh dựa trên strength của trend hiện tại
        if (currentTrend.strength > 0.7) {
            forecast *= 0.9;
        } else if (currentTrend.strength < 0.4) {
            forecast *= 1.1;
        }
        
        // Điều chỉnh dựa trên market regime
        if (this.marketState.regime === 'volatile') {
            forecast = Math.min(0.9, forecast * 1.2);
        } else if (this.marketState.regime === 'trending') {
            forecast = Math.max(0.1, forecast * 0.8);
        }
        
        return Math.min(0.95, Math.max(0.05, forecast));
    }

    // MODEL 15: suy nghĩ có nên bắt theo xu hướng ko
    model15() {
        const trend = this.model2();
        const breakProb = this.model14Mini(this.history);
        const shouldFollow = this.model15Mini(trend.confidence, breakProb);
        
        return {
            prediction: shouldFollow ? trend.prediction : (trend.prediction === 'T' ? 'X' : 'T'),
            confidence: shouldFollow ? trend.confidence : (1 - trend.confidence),
            reason: shouldFollow ? 
                `Nên theo xu hướng (xác suất bẻ thấp)` : 
                `Nên bẻ xu hướng (xác suất bẻ cao)`
        };
    }

    model15Mini(trendConfidence, breakProbability) {
        // Quyết định dựa trên độ tin cậy xu hướng và xác suất bẻ
        return trendConfidence > breakProbability * 1.5;
    }

    model15Support1() {
        // Phân tích risk/reward của việc theo xu hướng
        const analysis = this.analyzeTrendFollowingRiskReward();
        return {
            status: "Phân tích risk/reward theo xu hướng",
            analysis
        };
    }

    model15Support2() {
        // Tối ưu hóa ngưỡng quyết định
        const optimization = this.optimizeTrendDecisionThreshold();
        return {
            status: "Tối ưu ngưỡng quyết định xu hướng",
            optimization
        };
    }

    analyzeTrendFollowingRiskReward() {
        if (this.history.length < 50) return { riskRewardRatio: 1, successRate: 0.5 };
        
        let trendFollowingSuccess = 0;
        let trendFollowingOpportunities = 0;
        let breakSuccess = 0;
        let breakOpportunities = 0;
        
        for (let i = 10; i < this.history.length; i++) {
            const segment = this.history.slice(i-10, i);
            const trend = this.model2Mini(segment);
            const breakProb = this.model14Mini(this.history.slice(0, i));
            
            if (trend.strength > 0.6) {
                const shouldFollow = trend.confidence > breakProb * 1.5;
                
                if (shouldFollow) {
                    trendFollowingOpportunities++;
                    if (this.history[i] === (trend.trend === 'up' ? 'T' : 'X')) {
                        trendFollowingSuccess++;
                    }
                } else {
                    breakOpportunities++;
                    if (this.history[i] !== (trend.trend === 'up' ? 'T' : 'X')) {
                        breakSuccess++;
                    }
                }
            }
        }
        
        const trendSuccessRate = trendFollowingOpportunities > 0 ? 
            trendFollowingSuccess / trendFollowingOpportunities : 0;
        const breakSuccessRate = breakOpportunities > 0 ? 
            breakSuccess / breakOpportunities : 0;
        
        const riskRewardRatio = trendSuccessRate / breakSuccessRate;
        
        return { riskRewardRatio, trendSuccessRate, breakSuccessRate };
    }

    optimizeTrendDecisionThreshold() {
        if (this.history.length < 50) return { optimalThreshold: 1.5 };
        
        let bestThreshold = 1.5;
        let bestProfit = 0;
        
        for (let threshold = 1.0; threshold <= 2.0; threshold += 0.1) {
            let profit = 0;
            
            for (let i = 10; i < this.history.length; i++) {
                const segment = this.history.slice(i-10, i);
                const trend = this.model2Mini(segment);
                const breakProb = this.model14Mini(this.history.slice(0, i));
                
                if (trend.strength > 0.6) {
                    const shouldFollow = trend.confidence > breakProb * threshold;
                    const prediction = shouldFollow ? 
                        (trend.trend === 'up' ? 'T' : 'X') : 
                        (trend.trend === 'up' ? 'X' : 'T');
                    
                    if (this.history[i] === prediction) {
                        profit += 1;
                    } else {
                        profit -= 1;
                    }
                }
            }
            
            if (profit > bestProfit) {
                bestProfit = profit;
                bestThreshold = threshold;
            }
        }
        
        return { optimalThreshold: bestThreshold, expectedProfit: bestProfit };
    }

    // MODEL 16: tính xác suất bẻ cầu (phiên bản nâng cao)
    model16() {
        const breakProb = this.model16Mini(this.history);
        
        return {
            prediction: null,
            confidence: breakProb,
            reason: `Xác suất bẻ cầu tổng hợp: ${breakProb.toFixed(2)}`
        };
    }

    model16Mini(data) {
        // Kết hợp nhiều phương pháp tính xác suất bẻ
        const prob1 = this.model10Mini(data);
        const prob2 = this.model14Mini(data);
        
        // Phân tích recent breaks
        let recentBreaks = 0;
        let recentOpportunities = 0;
        
        for (let i = Math.max(0, data.length - 10); i < data.length - 1; i++) {
            if (i >= 5) {
                const segment = data.slice(i-5, i);
                const streak = this.model6Mini(segment).streak;
                
                if (streak >= 3) {
                    recentOpportunities++;
                    if (data[i] !== segment[segment.length-1]) {
                        recentBreaks++;
                    }
                }
            }
        }
        
        const prob3 = recentOpportunities > 0 ? recentBreaks / recentOpportunities : 0.5;
        
        // Trung bình có trọng số
        return (prob1 * 0.4 + prob2 * 0.4 + prob3 * 0.2);
    }

    model16Support1() {
        // Phân tích độ tin cậy của các phương pháp tính xác suất bẻ
        const reliability = this.analyzeBreakProbabilityReliability();
        return {
            status: "Phân tích độ tin cậy xác suất bẻ",
            reliability
        };
    }

    model16Support2() {
        // Tối ưu hóa trọng số cho các phương pháp tính xác suất bẻ
        const optimization = this.optimizeBreakProbabilityWeights();
        return {
            status: "Tối ưu trọng số xác suất bẻ",
            optimization
        };
    }

    analyzeBreakProbabilityReliability() {
        if (this.history.length < 40) return { reliability: {} };
        
        const reliability = {};
        const methods = [
            { name: 'model10', method: this.model10Mini },
            { name: 'model14', method: this.model14Mini }
        ];
        
        for (const method of methods) {
            let correct = 0;
            let total = 0;
            
            for (let i = 20; i < this.history.length; i++) {
                const probability = method.method(this.history.slice(0, i));
                const segment = this.history.slice(i-5, i);
                const streak = this.model6Mini(segment).streak;
                
                if (streak >= 4) {
                    total++;
                    const expectedBreak = probability > 0.6;
                    const actualBreak = this.history[i] !== segment[segment.length-1];
                    
                    if (expectedBreak === actualBreak) {
                        correct++;
                    }
                }
            }
            
            reliability[method.name] = {
                accuracy: total > 0 ? correct / total : 0,
                observations: total
            };
        }
        
        return reliability;
    }

    optimizeBreakProbabilityWeights() {
        if (this.history.length < 50) return { weights: { model10: 0.4, model14: 0.4, recent: 0.2 } };
        
        let bestWeights = { model10: 0.4, model14: 0.4, recent: 0.2 };
        let bestAccuracy = 0;
        
        // Grid search for optimal weights
        for (let w1 = 0.2; w1 <= 0.6; w1 += 0.1) {
            for (let w2 = 0.2; w2 <= 0.6; w2 += 0.1) {
                const w3 = 1 - w1 - w2;
                if (w3 < 0.1 || w3 > 0.4) continue;
                
                let correct = 0;
                let total = 0;
                
                for (let i = 20; i < this.history.length; i++) {
                    const prob1 = this.model10Mini(this.history.slice(0, i));
                    const prob2 = this.model14Mini(this.history.slice(0, i));
                    
                    // Phân tích recent breaks
                    let recentBreaks = 0;
                    let recentOpportunities = 0;
                    
                    for (let j = Math.max(0, i - 10); j < i - 1; j++) {
                        if (j >= 5) {
                            const segment = this.history.slice(j-5, j);
                            const streak = this.model6Mini(segment).streak;
                            
                            if (streak >= 3) {
                                recentOpportunities++;
                                if (this.history[j] !== segment[segment.length-1]) {
                                    recentBreaks++;
                                }
                            }
                        }
                    }
                    
                    const prob3 = recentOpportunities > 0 ? recentBreaks / recentOpportunities : 0.5;
                    
                    const combinedProb = prob1 * w1 + prob2 * w2 + prob3 * w3;
                    const segment = this.history.slice(i-5, i);
                    const streak = this.model6Mini(segment).streak;
                    
                    if (streak >= 4) {
                        total++;
                        const expectedBreak = combinedProb > 0.6;
                        const actualBreak = this.history[i] !== segment[segment.length-1];
                        
                        if (expectedBreak === actualBreak) {
                            correct++;
                        }
                    }
                }
                
                const accuracy = total > 0 ? correct / total : 0;
                if (accuracy > bestAccuracy) {
                    bestAccuracy = accuracy;
                    bestWeights = { model10: w1, model14: w2, recent: w3 };
                }
            }
        }
        
        return { weights: bestWeights, accuracy: bestAccuracy };
    }

    // MODEL 17: cân bằng trọng số (nâng cao)
    model17() {
        const performance = this.model13Mini();
        const imbalance = this.model17Mini(performance);
        
        if (imbalance > 0.25) {
            this.adjustWeightsAdvanced(performance);
            return {
                prediction: null,
                confidence: 0,
                reason: `Cân bằng trọng số nâng cao, độ chênh lệch: ${imbalance.toFixed(2)}`
            };
        }
        
        return null;
    }

    model17Mini(performance) {
        const accuracies = Object.values(performance).map(p => p.accuracy);
        if (accuracies.length < 2) return 0;
        
        const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
        
        return Math.sqrt(variance) / mean;
    }

    adjustWeightsAdvanced(performance) {
        const meanAccuracy = Object.values(performance).reduce((sum, p) => sum + p.accuracy, 0) / 
                            Object.values(performance).length;
        
        for (const [model, stats] of Object.entries(performance)) {
            if (stats.accuracy > meanAccuracy * 1.2) {
                this.weights[model] = Math.min(2, this.weights[model] * 1.1);
            } else if (stats.accuracy < meanAccuracy * 0.8) {
                this.weights[model] = Math.max(0.1, this.weights[model] * 0.9);
            }
        }
    }

    model17Support1() {
        // Phân tích ảnh hưởng của việc điều chỉnh trọng số
        const impact = this.analyzeWeightAdjustmentImpact();
        return {
            status: "Phân tích ảnh hưởng điều chỉnh trọng số",
            impact
        };
    }

    model17Support2() {
        // Tối ưu hóa tần suất điều chỉnh trọng số
        const optimization = this.optimizeWeightAdjustmentFrequency();
        return {
            status: "Tối ưu tần suất điều chỉnh trọng số",
            optimization
        };
    }

    analyzeWeightAdjustmentImpact() {
        const before = this.analyzeWeightDistribution();
        
        // Giả lập điều chỉnh
        const performance = this.model13Mini();
        const meanAccuracy = Object.values(performance).reduce((sum, p) => sum + p.accuracy, 0) / 
                            Object.values(performance).length;
        
        const simulatedWeights = {};
        for (const [model, stats] of Object.entries(performance)) {
            if (stats.accuracy > meanAccuracy * 1.2) {
                simulatedWeights[model] = Math.min(2, this.weights[model] * 1.1);
            } else if (stats.accuracy < meanAccuracy * 0.8) {
                simulatedWeights[model] = Math.max(0.1, this.weights[model] * 0.9);
            } else {
                simulatedWeights[model] = this.weights[model];
            }
        }
        
        const after = {
            mean: Object.values(simulatedWeights).reduce((sum, w) => sum + w, 0) / Object.values(simulatedWeights).length,
            min: Math.min(...Object.values(simulatedWeights)),
            max: Math.max(...Object.values(simulatedWeights))
        };
        
        return { before, after, change: after.mean - before.mean };
    }

    optimizeWeightAdjustmentFrequency() {
        // Điều chỉnh tần suất based on market stability
        let frequency;
        if (this.marketState.stability > 0.7) {
            frequency = 'low'; // Ít điều chỉnh hơn trong thị trường ổn định
        } else if (this.marketState.stability < 0.3) {
            frequency = 'high'; // Điều chỉnh thường xuyên trong thị trường biến động
        } else {
            frequency = 'medium';
        }
        
        return { frequency, stability: this.marketState.stability };
    }

    // MODEL 18: nhận biết xu hướng cầu và đoán theo xu hướng ngắn hạn
    model18() {
        const shortTrend = this.model18Mini(this.history.slice(-6));
        
        return {
            prediction: shortTrend.prediction,
            confidence: shortTrend.confidence,
            reason: `Xu hướng ngắn hạn: ${shortTrend.trend}`
        };
    }

    model18Mini(data) {
        if (data.length < 4) return { prediction: null, confidence: 0, trend: 'Không xác định' };
        
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        
        let prediction, confidence, trend;
        
        if (tCount > xCount * 1.5) {
            prediction = 'T';
            confidence = 0.7;
            trend = 'Mạnh T';
        } else if (xCount > tCount * 1.5) {
            prediction = 'X';
            confidence = 0.7;
            trend = 'Mạnh X';
        } else if (tCount > xCount) {
            prediction = 'T';
            confidence = 0.6;
            trend = 'Nhẹ T';
        } else if (xCount > tCount) {
            prediction = 'X';
            confidence = 0.6;
            trend = 'Nhẹ X';
        } else {
            prediction = data[data.length - 1] === 'T' ? 'X' : 'T';
            confidence = 0.55;
            trend = 'Cân bằng';
        }
        
        return { prediction, confidence, trend };
    }

    model18Support1() {
        // Phân tích độ nhạy của xu hướng ngắn hạn
        const sensitivity = this.analyzeShortTermTrendSensitivity();
        return {
            status: "Phân tích độ nhạy xu hướng ngắn hạn",
            sensitivity
        };
    }

    model18Support2() {
        // Tối ưu hóa khung thời gian cho xu hướng ngắn hạn
        const optimization = this.optimizeShortTermTrendTimeframe();
        return {
            status: "Tối ưu khung thời gian xu hướng ngắn hạn",
            optimization
        };
    }

    analyzeShortTermTrendSensitivity() {
        if (this.history.length < 30) return { sensitivity: 'unknown' };
        
        let changes = 0;
        for (let i = 6; i < this.history.length; i++) {
            const segment1 = this.history.slice(i-6, i-3);
            const segment2 = this.history.slice(i-3, i);
            
            const trend1 = this.model18Mini(segment1);
            const trend2 = this.model18Mini(segment2);
            
            if (trend1.prediction !== trend2.prediction) {
                changes++;
            }
        }
        
        const changeRate = changes / (this.history.length - 6);
        let sensitivity;
        
        if (changeRate > 0.5) sensitivity = 'high';
        else if (changeRate > 0.3) sensitivity = 'medium';
        else sensitivity = 'low';
        
        return { sensitivity, changeRate };
    }

    optimizeShortTermTrendTimeframe() {
        if (this.history.length < 50) return { optimalTimeframe: 6 };
        
        let bestTimeframe = 6;
        let bestSuccessRate = 0;
        
        for (let timeframe = 4; timeframe <= 8; timeframe++) {
            let successes = 0;
            let opportunities = 0;
            
            for (let i = timeframe; i < this.history.length; i++) {
                const segment = this.history.slice(i - timeframe, i);
                const analysis = this.model18Mini(segment);
                
                if (analysis.confidence >= 0.6) {
                    opportunities++;
                    if (this.history[i] === analysis.prediction) {
                        successes++;
                    }
                }
            }
            
            const successRate = opportunities > 0 ? successes / opportunities : 0;
            if (successRate > bestSuccessRate) {
                bestSuccessRate = successRate;
                bestTimeframe = timeframe;
            }
        }
        
        return { optimalTimeframe: bestTimeframe, successRate: bestSuccessRate };
    }

    // MODEL 19: các xu hướng phổ biến
    model19() {
        const commonTrends = this.model19Mini(this.history.slice(-30));
        
        if (commonTrends.length === 0) return null;
        
        const bestTrend = commonTrends.reduce((best, current) => 
            current.frequency > best.frequency ? current : best
        );
        
        return {
            prediction: bestTrend.prediction,
            confidence: bestTrend.confidence,
            reason: `Xu hướng phổ biến: ${bestTrend.pattern} (tần suất ${bestTrend.frequency})`
        };
    }

    model19Mini(data) {
        const trends = [];
        
        // Phân tích các xu hướng phổ biến trong lịch sử
        const patternCounts = {};
        
        for (let length = 3; length <= 5; length++) {
            for (let i = 0; i <= data.length - length; i++) {
                const pattern = data.slice(i, i + length).join('-');
                patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
            }
        }
        
        // Chọn các pattern có tần suất cao
        for (const [pattern, count] of Object.entries(patternCounts)) {
            if (count >= 3) { // Xuất hiện ít nhất 3 lần
                const patternParts = pattern.split('-');
                const prediction = patternParts[patternParts.length - 1];
                const frequency = count / (data.length - patternParts.length + 1);
                
                trends.push({
                    pattern,
                    prediction,
                    frequency,
                    confidence: Math.min(0.8, frequency * 2)
                });
            }
        }
        
        return trends;
    }

    model19Support1() {
        // Phân tích sự ổn định của các xu hướng phổ biến
        const stability = this.analyzeTrendStability();
        return {
            status: "Phân tích sự ổn định xu hướng",
            stability
        };
    }

    model19Support2() {
        // Dự báo xu hướng phổ biến trong tương lai
        const forecast = this.forecastCommonTrends();
        return {
            status: "Dự báo xu hướng phổ biến",
            forecast
        };
    }

    analyzeTrendStability() {
        if (this.history.length < 40) return { stability: 'unknown' };
        
        const half1 = this.history.slice(0, Math.floor(this.history.length / 2));
        const half2 = this.history.slice(Math.floor(this.history.length / 2));
        
        const trends1 = this.model19Mini(half1);
        const trends2 = this.model19Mini(half2);
        
        // So sánh các trend giữa hai nửa
        const commonPatterns = [];
        for (const trend1 of trends1) {
            for (const trend2 of trends2) {
                if (trend1.pattern === trend2.pattern) {
                    commonPatterns.push({
                        pattern: trend1.pattern,
                        frequency1: trend1.frequency,
                        frequency2: trend2.frequency,
                        change: Math.abs(trend1.frequency - trend2.frequency)
                    });
                }
            }
        }
        
        const avgChange = commonPatterns.length > 0 ? 
            commonPatterns.reduce((sum, p) => sum + p.change, 0) / commonPatterns.length : 0;
        
        let stability;
        if (avgChange < 0.1) stability = 'high';
        else if (avgChange < 0.2) stability = 'medium';
        else stability = 'low';
        
        return { stability, avgChange, commonPatterns: commonPatterns.length };
    }

    forecastCommonTrends() {
        const currentTrends = this.model19Mini(this.history.slice(-20));
        const historicalTrends = this.model19Mini(this.history);
        
        // Dự báo đơn giản: tiếp tục các trend hiện tại
        const forecast = currentTrends.map(trend => ({
            pattern: trend.pattern,
            predictedFrequency: trend.frequency * 0.9, // Giảm nhẹ do mean reversion
            confidence: trend.confidence * 0.8
        }));
        
        return forecast;
    }

    // MODEL 20: Max Performance
    model20() {
        const performance = this.model13Mini();
        const bestModels = Object.entries(performance)
            .filter(([_, stats]) => stats.total > 10)
            .sort((a, b) => b[1].accuracy - a[1].accuracy)
            .slice(0, 3);
        
        if (bestModels.length === 0) return null;
        
        // Lấy dự đoán từ các model hiệu suất cao nhất
        const predictions = {};
        for (const [model] of bestModels) {
            predictions[model] = this.models[model]();
        }
        
        // Tổng hợp dự đoán
        let tScore = 0;
        let xScore = 0;
        
        for (const [model, prediction] of Object.entries(predictions)) {
            if (prediction && prediction.prediction) {
                const weight = performance[model].accuracy;
                if (prediction.prediction === 'T') {
                    tScore += weight * prediction.confidence;
                } else {
                    xScore += weight * prediction.confidence;
                }
            }
        }
        
        const totalScore = tScore + xScore;
        if (totalScore === 0) return null;
        
        return {
            prediction: tScore > xScore ? 'T' : 'X',
            confidence: Math.max(tScore, xScore) / totalScore,
            reason: `Kết hợp ${bestModels.length} model hiệu suất cao nhất`
        };
    }

    model20Support1() {
        // Phân tích tính ổn định của các model hiệu suất cao
        const stability = this.analyzeTopModelStability();
        return {
            status: "Phân tích tính ổn định model hiệu suất cao",
            stability
        };
    }

    model20Support2() {
        // Tối ưu hóa số lượng model trong combination
        const optimization = this.optimizeModelCombinationCount();
        return {
            status: "Tối ưu số lượng model trong combination",
            optimization
        };
    }

    analyzeTopModelStability() {
        const performance = this.model13Mini();
        const topModels = Object.entries(performance)
            .filter(([_, stats]) => stats.total > 10)
            .sort((a, b) => b[1].accuracy - a[1].accuracy)
            .slice(0, 5);
        
        // Kiểm tra xem top models có thay đổi nhiều không
        let changes = 0;
        if (this.previousTopModels) {
            for (const model of topModels) {
                if (!this.previousTopModels.includes(model[0])) {
                    changes++;
                }
            }
        }
        
        this.previousTopModels = topModels.map(m => m[0]);
        
        const changeRate = changes / topModels.length;
        let stability;
        
        if (changeRate < 0.2) stability = 'high';
        else if (changeRate < 0.4) stability = 'medium';
        else stability = 'low';
        
        return { stability, changeRate, topModels: topModels.map(m => m[0]) };
    }

    optimizeModelCombinationCount() {
        if (this.history.length < 50) return { optimalCount: 3 };
        
        let bestCount = 3;
        let bestSuccessRate = 0;
        
        for (let count = 1; count <= 5; count++) {
            let successes = 0;
            let opportunities = 0;
            
            for (let i = 20; i < this.history.length; i++) {
                // Giả lập performance tại thời điểm i
                const simulatedPerformance = {};
                for (const model of Object.keys(this.performance)) {
                    // Tính accuracy dựa trên dữ liệu đến thời điểm i
                    let correct = 0;
                    let total = 0;
                    
                    for (let j = 10; j < i; j++) {
                        // Giả lập dự đoán và kết quả
                        // (Đây là phần phức tạp, cần implementation chi tiết hơn)
                    }
                    
                    simulatedPerformance[model] = {
                        accuracy: total > 0 ? correct / total : 0.5
                    };
                }
                
                // Chọn top models
                const topModels = Object.entries(simulatedPerformance)
                    .filter(([_, stats]) => stats.accuracy > 0)
                    .sort((a, b) => b[1].accuracy - a[1].accuracy)
                    .slice(0, count);
                
                // Tính consensus
                let tCount = 0;
                let xCount = 0;
                
                for (const [model] of topModels) {
                    // Giả lập dự đoán
                    // (Cần implementation chi tiết)
                }
                
                const prediction = tCount > xCount ? 'T' : 'X';
                if (this.history[i] === prediction) {
                    successes++;
                }
                opportunities++;
            }
            
            const successRate = opportunities > 0 ? successes / opportunities : 0;
            if (successRate > bestSuccessRate) {
                bestSuccessRate = successRate;
                bestCount = count;
            }
        }
        
        return { optimalCount: bestCount, successRate: bestSuccessRate };
    }

    // MODEL 21: cân bằng tất cả khi thấy chênh lệch cao
    model21() {
        const predictions = this.getAllPredictions();
        const tCount = Object.values(predictions).filter(p => p && p.prediction === 'T').length;
        const xCount = Object.values(predictions).filter(p => p && p.prediction === 'X').length;
        const total = tCount + xCount;
        
        if (total < 8) return null;
        
        const difference = Math.abs(tCount - xCount) / total;
        
        if (difference > 0.5) {
            // Cân bằng bằng cách điều chỉnh ngưỡng confidence
            const adjustedPredictions = this.model21Mini(predictions, difference);
            
            let tScore = 0;
            let xScore = 0;
            
            for (const prediction of Object.values(adjustedPredictions)) {
                if (prediction && prediction.prediction) {
                    if (prediction.prediction === 'T') {
                        tScore += prediction.confidence;
                    } else {
                        xScore += prediction.confidence;
                    }
                }
            }
            
            const totalScore = tScore + xScore;
            if (totalScore === 0) return null;
            
            return {
                prediction: tScore > xScore ? 'T' : 'X',
                confidence: Math.max(tScore, xScore) / totalScore,
                reason: `Cân bằng tổng thể, chênh lệch ban đầu: ${difference.toFixed(2)}`
            };
        }
        
        return null;
    }

    model21Mini(predictions, difference) {
        const adjusted = {};
        const adjustment = 1 - difference; // Điều chỉnh ngược với độ chênh lệch
        
        for (const [model, prediction] of Object.entries(predictions)) {
            if (prediction) {
                adjusted[model] = {
                    ...prediction,
                    confidence: prediction.confidence * adjustment
                };
            }
        }
        
        return adjusted;
    }

    model21Support1() {
        // Phân tích hiệu quả của cơ chế cân bằng
        const effectiveness = this.analyzeBalancingEffectiveness();
        return {
            status: "Phân tích hiệu quả cơ chế cân bằng",
            effectiveness
        };
    }

    model21Support2() {
        // Tối ưu hóa ngưỡng cân bằng
        const optimization = this.optimizeBalancingThreshold();
        return {
            status: "Tối ưu ngưỡng cân bằng",
            optimization
        };
    }

    analyzeBalancingEffectiveness() {
        if (this.history.length < 40) return { effectiveness: 'unknown', successRate: 0 };
        
        let successes = 0;
        let opportunities = 0;
        
        for (let i = 20; i < this.history.length; i++) {
            // Giả lập predictions tại thời điểm i
            const simulatedPredictions = {};
            for (const model of Object.keys(this.models)) {
                if (model.startsWith('model') && !model.includes('Support') && !model.includes('Mini')) {
                    // Giả lập dự đoán
                    // (Cần implementation chi tiết)
                }
            }
            
            const tCount = Object.values(simulatedPredictions).filter(p => p && p.prediction === 'T').length;
            const xCount = Object.values(simulatedPredictions).filter(p => p && p.prediction === 'X').length;
            const total = tCount + xCount;
            const difference = Math.abs(tCount - xCount) / total;
            
            if (difference > 0.5) {
                opportunities++;
                // Áp dụng cân bằng
                const adjustedPredictions = this.model21Mini(simulatedPredictions, difference);
                
                let tScore = 0;
                let xScore = 0;
                
                for (const prediction of Object.values(adjustedPredictions)) {
                    if (prediction && prediction.prediction) {
                        if (prediction.prediction === 'T') {
                            tScore += prediction.confidence;
                        } else {
                            xScore += prediction.confidence;
                        }
                    }
                }
                
                const finalPrediction = tScore > xScore ? 'T' : 'X';
                if (this.history[i] === finalPrediction) {
                    successes++;
                }
            }
        }
        
        const successRate = opportunities > 0 ? successes / opportunities : 0;
        let effectiveness;
        
        if (successRate > 0.6) effectiveness = 'high';
        else if (successRate > 0.5) effectiveness = 'medium';
        else effectiveness = 'low';
        
        return { effectiveness, successRate, opportunities };
    }

    optimizeBalancingThreshold() {
        if (this.history.length < 50) return { optimalThreshold: 0.5 };
        
        let bestThreshold = 0.5;
        let bestSuccessRate = 0;
        
        for (let threshold = 0.4; threshold <= 0.6; threshold += 0.05) {
            let successes = 0;
            let opportunities = 0;
            
            for (let i = 20; i < this.history.length; i++) {
                // Giả lập tương tự như trên
                // (Cần implementation chi tiết)
            }
            
            const successRate = opportunities > 0 ? successes / opportunities : 0;
            if (successRate > bestSuccessRate) {
                bestSuccessRate = successRate;
                bestThreshold = threshold;
            }
        }
        
        return { optimalThreshold: bestThreshold, successRate: bestSuccessRate };
    }

    // Utility methods
    getAllPredictions() {
        const predictions = {};
        
        for (let i = 1; i <= 21; i++) {
            predictions[`model${i}`] = this.models[`model${i}`]();
        }
        
        return predictions;
    }

    getFinalPrediction() {
        const predictions = this.getAllPredictions();
        let tScore = 0;
        let xScore = 0;
        let totalWeight = 0;
        let reasons = [];
        
        for (const [modelName, prediction] of Object.entries(predictions)) {
            if (prediction && prediction.prediction) {
                const weight = this.weights[modelName] || 1;
                const score = prediction.confidence * weight;
                
                if (prediction.prediction === 'T') {
                    tScore += score;
                } else if (prediction.prediction === 'X') {
                    xScore += score;
                }
                
                totalWeight += weight;
                reasons.push(`${modelName}: ${prediction.reason} (${prediction.confidence.toFixed(2)})`);
            }
        }
        
        if (totalWeight === 0) return null;
        
        let finalPrediction = null;
        let finalConfidence = 0;
        
        if (tScore > xScore) {
            finalPrediction = 'T';
            finalConfidence = tScore / (tScore + xScore);
        } else if (xScore > tScore) {
            finalPrediction = 'X';
            finalConfidence = xScore / (tScore + xScore);
        }
        
        // Điều chỉnh confidence dựa trên độ biến động
        finalConfidence = this.adjustConfidenceByVolatility(finalConfidence);
        
        return {
            prediction: finalPrediction,
            confidence: finalConfidence,
            reasons: reasons,
            details: predictions,
            sessionStats: this.sessionStats,
            marketState: this.marketState
        };
    }

    adjustConfidenceByVolatility(confidence) {
        // Giảm confidence khi volatility cao
        if (this.sessionStats.volatility > 0.7) {
            return confidence * 0.8;
        }
        // Tăng confidence khi volatility thấp
        if (this.sessionStats.volatility < 0.3) {
            return Math.min(0.95, confidence * 1.1);
        }
        return confidence;
    }

    updatePerformance(actualResult) {
        const predictions = this.getAllPredictions();
        
        for (const [modelName, prediction] of Object.entries(predictions)) {
            if (prediction && prediction.prediction) {
                this.performance[modelName].total++;
                this.performance[modelName].recentTotal++;
                
                if (prediction.prediction === actualResult) {
                    this.performance[modelName].correct++;
                    this.performance[modelName].recentCorrect++;
                    this.performance[modelName].streak++;
                    this.performance[modelName].maxStreak = Math.max(
                        this.performance[modelName].maxStreak,
                        this.performance[modelName].streak
                    );
                } else {
                    this.performance[modelName].streak = 0;
                }
                
                // Giữ recent stats trong phạm vi 50 lần
                if (this.performance[modelName].recentTotal > 50) {
                    this.performance[modelName].recentTotal--;
                    if (this.performance[modelName].recentCorrect > 0 && 
                        this.performance[modelName].recentCorrect / this.performance[modelName].recentTotal > 
                        this.performance[modelName].correct / this.performance[modelName].total) {
                        this.performance[modelName].recentCorrect--;
                    }
                }
                
                // Cập nhật trọng số
                const accuracy = this.performance[modelName].correct / this.performance[modelName].total;
                this.weights[modelName] = Math.max(0.1, Math.min(2, accuracy * 2));
            }
        }
        
        // Cập nhật session accuracy
        const totalPredictions = Object.values(predictions).filter(p => p && p.prediction).length;
        const correctPredictions = Object.values(predictions).filter(p => p && p.prediction === actualResult).length;
        this.sessionStats.recentAccuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
    }
}

// Hàm mô phỏng và test
function simulateUltraTest() {
    const system = new UltraDicePredictionSystem();
    
    // Tạo dữ liệu với pattern phức tạp
    const testPatterns = [
        // Pattern 1-1
        'T', 'X', 'T', 'X', 'T', 'X', 'T', 'X',
        // Pattern 2-2
        'T', 'T', 'X', 'X', 'T', 'T', 'X', 'X',
        // Pattern động học
        'T', 'T', 'T', 'T', 'X', 'X', 'T', 'T', 'T', 'X',
        // Pattern ngẫu nhiên
        'X', 'T', 'X', 'T', 'X', 'T', 'X', 'T', 'X', 'T',
        // Pattern 3-1
        'T', 'T', 'T', 'X', 'T', 'T', 'T', 'X', 'T', 'T', 'T', 'X',
        // Pattern phức tạp
        'T', 'X', 'X', 'T', 'X', 'T', 'T', 'X', 'T', 'X', 'X', 'T'
    ];
    
    console.log("Testing Ultra Dice Prediction System...");
    console.log("===========================================");
    
    // Thêm kết quả và in dự đoán
    testPatterns.forEach((result, index) => {
        system.addResult(result);
        
        if (index >= 15 && index % 3 === 0) { // Dự đoán sau mỗi 3 phiên từ phiên 15
            const prediction = system.getFinalPrediction();
            console.log(`Phiên ${index + 1}: ${result}`);
            if (prediction) {
                console.log(`Dự đoán: ${prediction.prediction}, Confidence: ${prediction.confidence.toFixed(2)}`);
                console.log(`Lý do: ${prediction.reasons[0]}`);
            } else {
                console.log("Không đủ dữ liệu để dự đoán");
            }
            console.log("---");
        }
    });
    
    // Hiển thị thống kê
    console.log("Thống kê phiên:");
    console.log(`- Streak T: ${system.sessionStats.streaks.T}, X: ${system.sessionStats.streaks.X}`);
    console.log(`- Độ biến động: ${system.sessionStats.volatility.toFixed(2)}`);
    console.log("Chuyển đổi:", system.sessionStats.transitions);
    console.log("Trạng thái thị trường:", system.marketState);
}

// Route kiểm tra server sống
app.get('/', (req, res) => {
  res.send('server alive');
});

// Route /api/hitpro
app.get('/api/hitpro', async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'Không có dữ liệu trả về từ API' });
    }

    const latest50 = data.slice(0, 50).reverse(); // Lấy 50 kết quả mới nhất (mới ở cuối)
    const pattern = latest50.map(item => item.Ket_qua === 'Tài' ? 'T' : 'X').join('');

    const latest = data[0];

    if (latest.Phien !== lastPhien) {
      lastPhien = latest.Phien;

      // ✳️ Tạo mảng lịch sử chuẩn cho AI
      const history = data
        .slice(0, 100) // Lấy tối đa 100 phiên gần nhất
        .reverse()     // Phiên cũ ở đầu
        .map(item => ({
          session: item.Phien,
          result: item.Ket_qua,
          totalScore: item.Tong
        }));

      // 🧠 Gọi AI để dự đoán
      const duDoan = generatePrediction(history, modelPredictions);

      cachedResult = {
        id: latest.id,
        Phien: latest.Phien,
        Ket_qua: latest.Ket_qua,
        Tong: latest.Tong,
        Xuc_xac_1: latest.Xuc_xac_1,
        Xuc_xac_2: latest.Xuc_xac_2,
        Xuc_xac_3: latest.Xuc_xac_3,
        Pattern: pattern,
        phien_tiep_theo: latest.Phien + 1,
        Du_doan: duDoan // ✅ Dự đoán từ AI
      };
    }

    if (cachedResult) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(cachedResult));
    } else {
      res.status(503).json({ error: 'Chưa có dữ liệu mới' });
    }

  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi gọi API', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});
