class AccuracyCalculator {
  constructor() {
    this.predictions = [];
    this.accuracyHistory = [];
  }

  recordPrediction(prediction, actual) {
    const isCorrect = prediction === actual;
    this.predictions.push({
      timestamp: Date.now(),
      prediction,
      actual,
      correct: isCorrect
    });
    
    // Keep only last 100 predictions
    if (this.predictions.length > 100) {
      this.predictions.shift();
    }
    
    this.calculateAccuracy();
    return isCorrect;
  }

  calculateAccuracy() {
    if (this.predictions.length === 0) return 0;
    
    const correct = this.predictions.filter(p => p.correct).length;
    const accuracy = (correct / this.predictions.length) * 100;
    
    this.accuracyHistory.push({
      timestamp: Date.now(),
      accuracy: accuracy,
      totalPredictions: this.predictions.length,
      correctPredictions: correct
    });
    
    // Keep only last 50 accuracy records
    if (this.accuracyHistory.length > 50) {
      this.accuracyHistory.shift();
    }
    
    return accuracy;
  }

  getStats() {
    const accuracy = this.calculateAccuracy();
    const recentPredictions = this.predictions.slice(-10);
    const recentAccuracy = recentPredictions.length > 0 ?
      (recentPredictions.filter(p => p.correct).length / recentPredictions.length) * 100 : 0;
    
    const streaks = this.calculateStreaks();
    
    return {
      overallAccuracy: accuracy.toFixed(2),
      recentAccuracy: recentAccuracy.toFixed(2),
      totalPredictions: this.predictions.length,
      correctPredictions: this.predictions.filter(p => p.correct).length,
      winStreak: streaks.winStreak,
      lossStreak: streaks.lossStreak,
      confidenceLevel: this.calculateConfidenceLevel()
    };
  }

  calculateStreaks() {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    
    for (const pred of this.predictions) {
      if (pred.correct) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    }
    
    return {
      winStreak: currentWinStreak,
      lossStreak: currentLossStreak,
      maxWinStreak: maxWinStreak,
      maxLossStreak: maxLossStreak
    };
  }

  calculateConfidenceLevel() {
    if (this.predictions.length < 10) return 'LOW';
    
    const accuracy = this.calculateAccuracy();
    if (accuracy >= 85) return 'VERY_HIGH';
    if (accuracy >= 75) return 'HIGH';
    if (accuracy >= 60) return 'MEDIUM';
    return 'LOW';
  }

  getPredictionTrend() {
    if (this.accuracyHistory.length < 5) return 'STABLE';
    
    const recent = this.accuracyHistory.slice(-5).map(h => h.accuracy);
    const older = this.accuracyHistory.slice(-10, -5).map(h => h.accuracy);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return 'IMPROVING';
    if (recentAvg < olderAvg - 5) return 'DECLINING';
    return 'STABLE';
  }
}

module.exports = AccuracyCalculator;