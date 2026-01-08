const brain = require('brain.js');

class AdvancedNeuralNetwork {
  constructor() {
    this.config = {
      hiddenLayers: [16, 12, 8],
      activation: 'relu',
      learningRate: 0.01,
      momentum: 0.1
    };
    
    this.net = new brain.NeuralNetwork(this.config);
    this.trainingStats = {
      totalTrained: 0,
      lastTraining: null,
      avgError: 0
    };
    this.isTrained = false;
  }

  train(trainingData, options = {}) {
    console.log('🔄 Training Advanced Neural Network...');
    
    if (trainingData.length < 30) {
      console.log('⚠️ Insufficient training data');
      return false;
    }

    const trainOptions = {
      iterations: options.iterations || 5000,
      errorThresh: options.errorThresh || 0.003,
      log: options.log || false,
      logPeriod: options.logPeriod || 500,
      learningRate: this.config.learningRate,
      momentum: this.config.momentum
    };

    const formattedData = trainingData.map(item => ({
      input: this.normalizeInput(item.input),
      output: { prediction: item.output }
    }));

    const result = this.net.train(formattedData, trainOptions);
    
    this.trainingStats = {
      totalTrained: this.trainingStats.totalTrained + trainingData.length,
      lastTraining: Date.now(),
      avgError: result.error,
      iterations: result.iterations
    };
    
    this.isTrained = true;
    console.log(`✅ Neural Network trained. Error: ${result.error.toFixed(6)}`);
    return true;
  }

  normalizeInput(input) {
    // Normalize to [0, 1] range
    return input.map(value => {
      if (value > 1) return 1;
      if (value < 0) return 0;
      return value;
    });
  }

  predict(input) {
    if (!this.isTrained) {
      return 0.5;
    }
    
    try {
      const normalizedInput = this.normalizeInput(input);
      const output = this.net.run(normalizedInput);
      return output.prediction;
    } catch (error) {
      console.error('Neural network prediction error:', error);
      return 0.5;
    }
  }

  predictDetailed(input) {
    const probability = this.predict(input);
    
    // Calculate confidence based on probability distribution
    let confidence;
    if (probability > 0.85 || probability < 0.15) {
      confidence = 'VERY_HIGH';
    } else if (probability > 0.75 || probability < 0.25) {
      confidence = 'HIGH';
    } else if (probability > 0.65 || probability < 0.35) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW';
    }
    
    return {
      probability: probability,
      prediction: probability > 0.5 ? 'BIG' : 'SMALL',
      confidence: confidence,
      model: 'Advanced Neural Network',
      featuresUsed: input.length
    };
  }

  getStats() {
    return {
      model: 'Advanced Neural Network',
      trained: this.isTrained,
      trainingStats: this.trainingStats,
      architecture: this.config.hiddenLayers,
      activation: this.config.activation
    };
  }
}

module.exports = AdvancedNeuralNetwork;