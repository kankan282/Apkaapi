const constants = require('../config/constants');

class SuperEnsembleModel {
  constructor() {
    this.models = new Map();
    this.performance = new Map();
    this.modelWeights = constants.PREDICTION_MODELS;
    this.predictionHistory = [];
  }

  registerModel(name, model) {
    this.models.set(name, model);
    this.performance.set(name, {
      correct: 0,
      total: 0,
      accuracy: 0,
      lastPrediction: null
    });
  }

  updatePerformance(modelName, prediction, actual) {
    if (!this.performance.has(modelName)) return;
    
    const perf = this.performance.get(modelName);
    perf.total++;
    perf.lastPrediction = { prediction, actual, timestamp: Date.now() };
    
    if (prediction === actual) {
      perf.correct++;
    }
    
    perf.accuracy = (perf.correct / perf.total) * 100;
    
    // Adjust weight based on recent performance
    this.adjustModelWeight(modelName, perf.accuracy);
  }

  adjustModelWeight(modelName, accuracy) {
    const baseWeight = this.modelWeights[modelName] || 0;
    
    // Increase weight for accurate models
    if (accuracy > 80) {
      this.modelWeights[modelName] = Math.min(baseWeight * 1.2, 40);
    } else if (accuracy < 50) {
      this.modelWeights[modelName] = Math.max(baseWeight * 0.8, 5);
    }
    
    // Normalize weights
    this.normalizeWeights();
  }

  normalizeWeights() {
    const totalWeight = Object.values(this.modelWeights).reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return;
    
    for (const model in this.modelWeights) {
      this.modelWeights[model] = (this.modelWeights[model] / totalWeight) * 100;
    }
  }

  predict(input, recentData) {
    if (this.models.size === 0) {
      return {
        probability: 0.5,
        prediction: 'BIG',
        confidence: 'LOW',
        note: 'No models available'
      };
    }

    const predictions = [];
    const confidences = [];
    const modelDetails = [];

    // Get predictions from all registered models
    for (const [name, model] of this.models) {
      try {
        let probability;
        
        if (name === 'DEEP_LEARNING' && model.predictWithConfidence) {
          const result = model.predictWithConfidence(input);
          probability = result.probability;
          modelDetails.push({
            name,
            probability,
            confidence: result.confidence,
            accuracy: model.accuracy || 0
          });
        } else if (name === 'TIME_SERIES' && model.predictNext) {
          probability = model.predictNext();
          modelDetails.push({
            name,
            probability,
            confidence: model.getConfidence ? model.getConfidence() : 0.5
          });
        } else if (name === 'PATTERN_ANALYSIS' && model.predict) {
          probability = model.predict(recentData);
          const patternConf = model.getPatternConfidence ? 
            model.getPatternConfidence(recentData).confidence : 0.5;
          modelDetails.push({
            name,
            probability,
            confidence: patternConf
          });
        } else if (name === 'NEURAL_NETWORK' && model.predict) {
          probability = model.predict(input);
          modelDetails.push({
            name,
            probability,
            confidence: 'MEDIUM'
          });
        } else {
          probability = 0.5;
        }
        
        if (probability !== undefined) {
          predictions.push({
            model: name,
            probability: probability,
            weight: this.modelWeights[name] || 10
          });
        }
      } catch (error) {
        console.error(`Error in model ${name}:`, error);
      }
    }

    if (predictions.length === 0) {
      return {
        probability: 0.5,
        prediction: 'BIG',
        confidence: 'LOW',
        note: 'All models failed'
      };
    }

    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;
    let confidenceSum = 0;
    
    for (const pred of predictions) {
      weightedSum += pred.probability * pred.weight;
      totalWeight += pred.weight;
      
      // Calculate average confidence
      const modelDetail = modelDetails.find(m => m.name === pred.model);
      if (modelDetail && modelDetail.confidence) {
        let confidenceValue;
        switch(modelDetail.confidence) {
          case 'VERY_HIGH': confidenceValue = 0.9; break;
          case 'HIGH': confidenceValue = 0.75; break;
          case 'MEDIUM': confidenceValue = 0.6; break;
          default: confidenceValue = 0.5;
        }
        confidenceSum += confidenceValue;
      }
    }

    const finalProbability = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    const avgConfidence = modelDetails.length > 0 ? confidenceSum / modelDetails.length : 0.5;

    // Determine final prediction with confidence
    let prediction, confidenceLevel;
    
    if (finalProbability >= constants.CONFIDENCE_THRESHOLDS.HIGH) {
      prediction = 'BIG';
      confidenceLevel = 'VERY_HIGH';
    } else if (finalProbability >= constants.CONFIDENCE_THRESHOLDS.MEDIUM) {
      prediction = 'BIG';
      confidenceLevel = 'HIGH';
    } else if (finalProbability <= (1 - constants.CONFIDENCE_THRESHOLDS.HIGH)) {
      prediction = 'SMALL';
      confidenceLevel = 'VERY_HIGH';
    } else if (finalProbability <= (1 - constants.CONFIDENCE_THRESHOLDS.MEDIUM)) {
      prediction = 'SMALL';
      confidenceLevel = 'HIGH';
    } else if (finalProbability > 0.5) {
      prediction = 'BIG';
      confidenceLevel = 'MEDIUM';
    } else {
      prediction = 'SMALL';
      confidenceLevel = 'MEDIUM';
    }

    // Calculate ensemble confidence
    const ensembleConfidence = (avgConfidence * 0.7) + 
      (Math.abs(finalProbability - 0.5) * 2 * 0.3);

    // Store prediction history
    this.predictionHistory.push({
      timestamp: Date.now(),
      probability: finalProbability,
      prediction: prediction,
      confidence: ensembleConfidence,
      modelDetails: modelDetails
    });

    // Keep only last 100 predictions
    if (this.predictionHistory.length > 100) {
      this.predictionHistory.shift();
    }

    return {
      probability: finalProbability,
      prediction: prediction,
      confidence: confidenceLevel,
      ensembleConfidence: Math.round(ensembleConfidence * 100),
      modelContributions: modelDetails,
      weights: this.modelWeights
    };
  }

  getEnsembleStats() {
    const stats = {
      totalModels: this.models.size,
      modelWeights: this.modelWeights,
      performance: {}
    };
    
    for (const [name, perf] of this.performance) {
      stats.performance[name] = {
        accuracy: perf.accuracy.toFixed(2),
        totalPredictions: perf.total,
        correctPredictions: perf.correct
      };
    }
    
    // Calculate ensemble accuracy
    if (this.predictionHistory.length > 10) {
      const recent = this.predictionHistory.slice(-20);
      stats.recentAccuracy = 'Calculating...';
    }
    
    return stats;
  }
}

module.exports = SuperEnsembleModel;
