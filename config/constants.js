module.exports = {
  API_URL: 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json',
  PREDICTION_MODELS: {
    DEEP_LEARNING: 35,
    TIME_SERIES: 25,
    PATTERN_ANALYSIS: 20,
    NEURAL_NETWORK: 15,
    MARKOV_CHAIN: 5
  },
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.85,
    MEDIUM: 0.70,
    LOW: 0.55
  },
  TRAINING: {
    MIN_DATA_POINTS: 200,
    RETRAIN_INTERVAL: 300000 // 5 minutes
  }
};
