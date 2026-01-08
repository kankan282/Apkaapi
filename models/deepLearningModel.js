const brain = require('brain.js');
const math = require('mathjs');

class DeepLearningModel {
  constructor() {
    this.config = {
      hiddenLayers: [32, 24, 16, 8],
      activation: 'leaky-relu',
      learningRate: 0.001,
      decayRate: 0.999
    };
    
    this.net = new brain.NeuralNetwork(this.config);
    this.trainingHistory = [];
    this.isTrained = false;
    this.accuracy = 0;
  }

  async train(trainingData, options = {}) {
    console.log('🔄 Training Deep Learning Model...');
    
    const trainOptions = {
      iterations: options.iterations || 10000,
      errorThresh: options.errorThresh || 0.001,
      log: options.log || false,
      logPeriod: options.logPeriod || 1000,
      learningRate: this.config.learningRate
    };

    const formattedData = trainingData.map(item => ({
      input: item.input,
      output: { prediction: item.output }
    }));

    const result = this.net.train(formattedData, trainOptions);
    
    this.trainingHistory.push({
      timestamp: Date.now(),
      error: result.error,
      iterations: result.iterations,
      trainingSize: trainingData.length
    });
    
    this.isTrained = true;
    
    // Calculate training accuracy
    this.calculateAccuracy(trainingData);
    
    console.log(`✅ Deep Learning Model trained. Error: ${result.error.toFixed(6)}`);
    return result;
  }

  calculateAccuracy(trainingData) {
    if (trainingData.length < 10) {
      this.accuracy = 0;
      return;
    }
    
    let correct = 0;
    const testSize = Math.min(50, Math.floor(trainingData.length * 0.2));
    const testData = trainingData.slice(-testSize);
    
    for (const item of testData) {
      const prediction = this.predict(item.input);
      const predictedClass = prediction > 0.5 ? 1 : 0;
      if (predictedClass === item.output) correct++;
    }
    
    this.accuracy = (correct / testData.length) * 100;
  }

  predict(input) {
    if (!this.isTrained) {
      console.warn('⚠️ Model not trained, returning default prediction');
      return 0.5;
    }
    
    try {
      const output = this.net.run(input);
      return output.prediction;
    } catch (error) {
      console.error('❌ Prediction error:', error);
      return 0.5;
    }
  }

  predictWithConfidence(input) {
    const probability = this.predict(input);
    
    let confidence;
    if (probability > 0.8 || probability < 0.2) {
      confidence = 'VERY_HIGH';
    } else if (probability > 0.7 || probability < 0.3) {
      confidence = 'HIGH';
    } else if (probability > 0.6 || probability < 0.4) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW';
    }
    
    return {
      probability: probability,
      prediction: probability > 0.5 ? 'BIG' : 'SMALL',
      confidence: confidence,
      modelAccuracy: this.accuracy
    };
  }

  getModelInfo() {
    return {
      type: 'Deep Neural Network',
      layers: this.config.hiddenLayers.length + 2,
      neurons: this.config.hiddenLayers.reduce((a, b) => a + b, 0) + this.config.hiddenLayers[0],
      activation: this.config.activation,
      trained: this.isTrained,
      accuracy: this.accuracy.toFixed(2),
      lastTraining: this.trainingHistory.length > 0 ? 
        new Date(this.trainingHistory[this.trainingHistory.length - 1].timestamp).toISOString() : 'Never'
    };
  }

  saveModel() {
    // For Vercel, we'll keep it in memory
    return this.net.toJSON();
  }

  loadModel(json) {
    this.net.fromJSON(json);
    this.isTrained = true;
  }
}

module.exports = DeepLearningModel;