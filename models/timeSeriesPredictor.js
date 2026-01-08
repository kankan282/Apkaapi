const regression = require('regression');
const math = require('mathjs');

class TimeSeriesPredictor {
  constructor() {
    this.history = [];
    this.patterns = new Map();
    this.seasonality = 10; // Assume seasonality of 10 periods
  }

  analyze(history) {
    if (history.length < 20) return;
    
    this.history = history;
    
    // Analyze multiple time series
    this.analyzeBigSmallPatterns();
    this.analyzeOddEvenPatterns();
    this.analyzeNumberPatterns();
    this.analyzeSumPatterns();
    
    this.calculateSeasonalEffects();
    this.calculateCycles();
  }

  analyzeBigSmallPatterns() {
    const series = this.history.map(h => h.bigSmall === 'BIG' ? 1 : 0);
    this.bigSmallTrend = this.calculateRegression(series);
    this.bigSmallSeasonal = this.calculateSeasonality(series);
  }

  analyzeOddEvenPatterns() {
    const series = this.history.map(h => h.oddEven === 'ODD' ? 1 : 0);
    this.oddEvenTrend = this.calculateRegression(series);
    this.oddEvenSeasonal = this.calculateSeasonality(series);
  }

  analyzeNumberPatterns() {
    const series = this.history.map(h => h.number);
    this.numberTrend = this.calculateRegression(series);
    this.numberSeasonal = this.calculateSeasonality(series);
  }

  analyzeSumPatterns() {
    const series = this.history.map(h => h.sum);
    this.sumTrend = this.calculateRegression(series);
    this.sumSeasonal = this.calculateSeasonality(series);
  }

  calculateRegression(series) {
    const data = series.map((value, index) => [index, value]);
    return regression.linear(data, { precision: 6 });
  }

  calculateSeasonality(series) {
    if (series.length < this.seasonality * 2) return [];
    
    const seasonal = new Array(this.seasonality).fill(0);
    let count = new Array(this.seasonality).fill(0);
    
    for (let i = 0; i < series.length; i++) {
      const seasonIndex = i % this.seasonality;
      seasonal[seasonIndex] += series[i];
      count[seasonIndex]++;
    }
    
    return seasonal.map((sum, i) => count[i] > 0 ? sum / count[i] : 0);
  }

  calculateSeasonalEffects() {
    const recent = this.history.slice(-this.seasonality);
    const seasonalEffects = {
      bigInSeason: recent.filter(h => h.bigSmall === 'BIG').length / this.seasonality,
      oddInSeason: recent.filter(h => h.oddEven === 'ODD').length / this.seasonality,
      avgNumber: recent.reduce((sum, h) => sum + h.number, 0) / this.seasonality,
      avgSum: recent.reduce((sum, h) => sum + h.sum, 0) / this.seasonality
    };
    
    this.seasonalEffects = seasonalEffects;
  }

  calculateCycles() {
    const bigSmallSeries = this.history.map(h => h.bigSmall === 'BIG' ? 1 : 0);
    const autocorrelation = this.calculateAutocorrelation(bigSmallSeries, 20);
    
    this.cycles = {
      autocorrelation: autocorrelation,
      dominantFrequency: this.findDominantFrequency(autocorrelation)
    };
  }

  calculateAutocorrelation(series, maxLag) {
    const mean = math.mean(series);
    const variance = math.variance(series);
    const correlations = [];
    
    for (let lag = 0; lag <= maxLag; lag++) {
      let covariance = 0;
      for (let i = lag; i < series.length; i++) {
        covariance += (series[i] - mean) * (series[i - lag] - mean);
      }
      correlations[lag] = covariance / ((series.length - lag) * variance);
    }
    
    return correlations;
  }

  findDominantFrequency(autocorrelation) {
    const peaks = [];
    for (let i = 1; i < autocorrelation.length - 1; i++) {
      if (autocorrelation[i] > autocorrelation[i-1] && 
          autocorrelation[i] > autocorrelation[i+1]) {
        peaks.push({ lag: i, correlation: autocorrelation[i] });
      }
    }
    
    return peaks.sort((a, b) => b.correlation - a.correlation)[0];
  }

  predictNext() {
    if (this.history.length < 30) return 0.5;
    
    const nextIndex = this.history.length;
    const seasonIndex = nextIndex % this.seasonality;
    
    // Combine multiple predictions
    const predictions = [];
    
    // Trend-based prediction
    const bigSmallTrendPred = this.bigSmallTrend.predict([nextIndex])[1];
    predictions.push(bigSmallTrendPred);
    
    // Seasonal prediction
    if (this.bigSmallSeasonal.length > seasonIndex) {
      predictions.push(this.bigSmallSeasonal[seasonIndex]);
    }
    
    // Cyclical prediction
    if (this.cycles.dominantFrequency) {
      const cyclePhase = nextIndex % this.cycles.dominantFrequency.lag;
      const cycleEffect = this.cycles.autocorrelation[cyclePhase] || 0;
      predictions.push(0.5 + cycleEffect * 0.5);
    }
    
    // Recent pattern prediction
    const recent = this.history.slice(-10);
    const recentBig = recent.filter(h => h.bigSmall === 'BIG').length;
    predictions.push(recentBig / 10);
    
    // Moving average prediction
    const window = this.history.slice(-20);
    const windowBig = window.filter(h => h.bigSmall === 'BIG').length;
    predictions.push(windowBig / 20);
    
    // Weighted average of predictions
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
    let weightedSum = 0;
    for (let i = 0; i < Math.min(predictions.length, weights.length); i++) {
      weightedSum += predictions[i] * weights[i];
    }
    
    return weightedSum;
  }

  getConfidence() {
    if (this.history.length < 50) return 0.5;
    
    // Calculate prediction consistency
    const recentPredictions = [];
    for (let i = 10; i < this.history.length; i++) {
      const predicted = this.predictNextForIndex(i);
      const actual = this.history[i].bigSmall === 'BIG' ? 1 : 0;
      recentPredictions.push(Math.abs(predicted - actual));
    }
    
    const mae = math.mean(recentPredictions);
    return 1 - mae; // Higher confidence for lower error
  }

  predictNextForIndex(index) {
    // Similar logic but for historical index
    const seasonIndex = index % this.seasonality;
    const predictions = [];
    
    if (this.bigSmallTrend) {
      predictions.push(this.bigSmallTrend.predict([index])[1]);
    }
    
    if (this.bigSmallSeasonal && this.bigSmallSeasonal.length > seasonIndex) {
      predictions.push(this.bigSmallSeasonal[seasonIndex]);
    }
    
    return predictions.length > 0 ? math.mean(predictions) : 0.5;
  }
}

module.exports = TimeSeriesPredictor;