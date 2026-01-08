const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

const DataFetcher = require('../utils/fetchData');
const DataProcessor = require('../utils/dataProcessor');
const AccuracyCalculator = require('../utils/accuracyCalculator');
const DeepLearningModel = require('../models/deepLearningModel');
const TimeSeriesPredictor = require('../models/timeSeriesPredictor');
const AdvancedPatternAnalyzer = require('../models/patternAnalyzer');
const AdvancedNeuralNetwork = require('../models/neuralNetwork');
const SuperEnsembleModel = require('../models/ensembleModel');
const constants = require('../config/constants');

// Initialize models
let deepLearningModel = new DeepLearningModel();
let timeSeriesPredictor = new TimeSeriesPredictor();
let patternAnalyzer = new AdvancedPatternAnalyzer();
let neuralNetwork = new AdvancedNeuralNetwork();
let ensembleModel = new SuperEnsembleModel();
let accuracyCalculator = new AccuracyCalculator();
let isInitialized = false;
let initializationPromise = null;

// Register models with ensemble
ensembleModel.registerModel('DEEP_LEARNING', deepLearningModel);
ensembleModel.registerModel('TIME_SERIES', timeSeriesPredictor);
ensembleModel.registerModel('PATTERN_ANALYSIS', patternAnalyzer);
ensembleModel.registerModel('NEURAL_NETWORK', neuralNetwork);

async function initializeModels() {
  if (isInitialized) return true;
  
  if (initializationPromise) {
    return await initializationPromise;
  }
  
  initializationPromise = (async () => {
    console.log('🚀 Initializing AI/ML Prediction System...');
    
    try {
      // Fetch historical data
      console.log('📊 Fetching historical data...');
      const historicalData = await DataFetcher.fetchHistoricalData(300);
      
      if (historicalData.length < constants.TRAINING.MIN_DATA_POINTS) {
        console.log(`❌ Insufficient data: ${historicalData.length} records`);
        return false;
      }
      
      console.log(`✅ Fetched ${historicalData.length} records`);
      
      // Process data
      const processedData = DataProcessor.processResults(historicalData);
      console.log(`📈 Processed ${processedData.length} data points`);
      
      // Prepare training data
      const trainingData = DataProcessor.prepareTrainingData(processedData);
      console.log(`🎯 Prepared ${trainingData.length} training samples`);
      
      // Train Deep Learning Model
      console.log('🧠 Training Deep Learning Model...');
      await deepLearningModel.train(trainingData, {
        iterations: 8000,
        errorThresh: 0.002,
        logPeriod: 1000
      });
      
      // Analyze with Time Series Predictor
      console.log('⏰ Training Time Series Predictor...');
      timeSeriesPredictor.analyze(processedData);
      
      // Analyze patterns
      console.log('🔍 Analyzing Patterns...');
      patternAnalyzer.analyze(processedData);
      
      // Train Neural Network
      console.log('🕸️ Training Neural Network...');
      neuralNetwork.train(trainingData, {
        iterations: 4000,
        errorThresh: 0.004
      });
      
      // Calculate advanced features
      const features = DataProcessor.calculateAdvancedFeatures(processedData);
      console.log('📊 Calculated advanced features:', features);
      
      isInitialized = true;
      console.log('✅ All models initialized successfully!');
      console.log('🎯 System ready for predictions');
      
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      isInitialized = false;
      return false;
    }
  })();
  
  return await initializationPromise;
}

// Auto-initialize on startup
setTimeout(() => {
  initializeModels().then(success => {
    if (success) {
      console.log('🎉 Prediction System Ready!');
    }
  });
}, 1000);

// Retrain models periodically
setInterval(async () => {
  if (isInitialized) {
    console.log('🔄 Periodic model retraining...');
    await initializeModels();
  }
}, constants.TRAINING.RETRAIN_INTERVAL);

// Main prediction endpoint
router.get('/', async (req, res) => {
  try {
    const cacheKey = `prediction_${Date.now()}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Ensure models are initialized
    if (!isInitialized) {
      const initialized = await initializeModels();
      if (!initialized) {
        return res.status(503).json({
          status: 'INITIALIZING',
          message: 'AI models are still initializing. Please try again in 30 seconds.',
          estimatedTime: '30 seconds'
        });
      }
    }
    
    // Fetch latest data
    console.log('🔍 Fetching latest data for prediction...');
    const historicalData = await DataFetcher.fetchHistoricalData(150);
    
    if (historicalData.length < 50) {
      return res.status(503).json({
        error: 'INSUFFICIENT_DATA',
        message: 'Not enough historical data for accurate prediction',
        minimumRequired: 50,
        available: historicalData.length
      });
    }
    
    const processedData = DataProcessor.processResults(historicalData);
    const latestResult = processedData[processedData.length - 1];
    const recentData = processedData.slice(-20);
    
    // Prepare input for models
    const featureVector = DataProcessor.createFeatureVector(recentData.slice(-20));
    
    // Get ensemble prediction
    console.log('🤖 Getting ensemble prediction...');
    const ensemblePrediction = ensembleModel.predict(featureVector, recentData);
    
    // Check previous prediction accuracy
    let previousPredictionStatus = null;
    let previousPredictionMessage = '';
    
    const lastCachedPrediction = cache.get('last_prediction_details');
    if (lastCachedPrediction && latestResult) {
      const lastPred = lastCachedPrediction.prediction;
      const lastActual = latestResult.bigSmall;
      
      const isCorrect = lastPred === lastActual;
      accuracyCalculator.recordPrediction(lastPred, lastActual);
      
      previousPredictionStatus = isCorrect ? 'WIN' : 'LOSS';
      
      if (isCorrect) {
        previousPredictionMessage = `🎉 WIN! Previous prediction (${lastPred}) was correct!`;
      } else {
        previousPredictionMessage = `💔 LOSS! Previous prediction (${lastPred}) was incorrect. Actual was ${lastActual}.`;
      }
      
      // Update model performance
      for (const model of lastCachedPrediction.modelContributions || []) {
        ensembleModel.updatePerformance(
          model.name,
          model.probability > 0.5 ? 'BIG' : 'SMALL',
          lastActual
        );
      }
    }
    
    // Prepare response
    const accuracyStats = accuracyCalculator.getStats();
    const predictionTrend = accuracyCalculator.getPredictionTrend();
    
    const response = {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      system: {
        version: '2.0.0',
        modelsInitialized: isInitialized,
        totalModels: 4,
        systemAccuracy: `${accuracyStats.overallAccuracy}%`,
        confidenceLevel: accuracyStats.confidenceLevel,
        predictionTrend: predictionTrend
      },
      currentPeriod: {
        period: latestResult?.period || 'N/A',
        number: latestResult?.number || 'N/A',
        result: latestResult ? {
          bigSmall: latestResult.bigSmall,
          oddEven: latestResult.oddEven,
          sum: latestResult.sum,
          lastDigit: latestResult.lastDigit
        } : null
      },
      prediction: {
        value: ensemblePrediction.prediction,
        confidence: ensemblePrediction.confidence,
        ensembleConfidence: `${ensemblePrediction.ensembleConfidence}%`,
        probability: ensemblePrediction.probability.toFixed(4),
        nextPeriod: (parseInt(latestResult?.period || '0') + 1).toString(),
        recommendation: `💡 ${ensemblePrediction.confidence} confidence in ${ensemblePrediction.prediction}`,
        riskLevel: ensemblePrediction.confidence === 'VERY_HIGH' ? 'LOW' : 
                   ensemblePrediction.confidence === 'HIGH' ? 'MODERATE' : 'HIGH'
      },
      previousPrediction: {
        status: previousPredictionStatus || 'NO_PREVIOUS_DATA',
        message: previousPredictionMessage || 'No previous prediction to compare',
        accuracy: accuracyStats
      },
      aiAnalysis: {
        modelsUsed: ensemblePrediction.modelContributions?.length || 0,
        topModel: ensemblePrediction.modelContributions?.[0]?.name || 'N/A',
        averageConfidence: `${ensemblePrediction.ensembleConfidence}%`,
        modelWeights: ensemblePrediction.weights
      },
      statistics: {
        winStreak: accuracyStats.winStreak,
        lossStreak: accuracyStats.lossStreak,
        maxWinStreak: accuracyStats.maxWinStreak,
        maxLossStreak: accuracyStats.maxLossStreak,
        recentAccuracy: `${accuracyStats.recentAccuracy}%`,
        totalPredictions: accuracyStats.totalPredictions
      },
      disclaimer: '⚠️ Predictions are based on AI/ML algorithms. No guarantee of winning. Use at your own risk.'
    };
    
    // Cache results
    cache.set(cacheKey, response, 25); // Cache for 25 seconds
    cache.set('last_prediction_details', {
      prediction: ensemblePrediction.prediction,
      period: latestResult?.period,
      timestamp: new Date().toISOString(),
      modelContributions: ensemblePrediction.modelContributions
    }, 600);
    
    console.log(`✅ Prediction generated: ${ensemblePrediction.prediction} (${ensemblePrediction.confidence} confidence)`);
    
    res.json(response);
  } catch (error) {
    console.error('❌ Prediction error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      message: 'Prediction system encountered an error',
      error: error.message,
      fallbackPrediction: {
        value: Math.random() > 0.5 ? 'BIG' : 'SMALL',
        confidence: 'LOW',
        note: 'Using fallback due to system error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      system: {
        initialized: isInitialized,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        models: {
          deepLearning: deepLearningModel.getModelInfo ? deepLearningModel.getModelInfo() : 'Not available',
          neuralNetwork: neuralNetwork.getStats ? neuralNetwork.getStats() : 'Not available',
          ensemble: ensembleModel.getEnsembleStats ? ensembleModel.getEnsembleStats() : 'Not available'
        }
      },
      accuracy: accuracyCalculator.getStats(),
      cache: {
        keys: cache.keys().length,
        stats: cache.getStats()
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force retrain endpoint
router.post('/retrain', async (req, res) => {
  try {
    isInitialized = false;
    const success = await initializeModels();
    
    if (success) {
      res.json({
        status: 'SUCCESS',
        message: 'Models retrained successfully',
        timestamp: new Date().toISOString(),
        modelsRetrained: 4
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Retraining failed'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });

const DataFetcher = require('../utils/fetchData');
const DataProcessor = require('../utils/dataProcessor');
const AccuracyCalculator = require('../utils/accuracyCalculator');
const DeepLearningModel = require('../models/deepLearningModel');
const TimeSeriesPredictor = require('../models/timeSeriesPredictor');
const AdvancedPatternAnalyzer = require('../models/patternAnalyzer');
const AdvancedNeuralNetwork = require('../models/neuralNetwork');
const SuperEnsembleModel = require('../models/ensembleModel');
const constants = require('../config/constants');

// Initialize models
let deepLearningModel = new DeepLearningModel();
let timeSeriesPredictor = new TimeSeriesPredictor();
let patternAnalyzer = new AdvancedPatternAnalyzer();
let neuralNetwork = new AdvancedNeuralNetwork();
let ensembleModel = new SuperEnsembleModel();
let accuracyCalculator = new AccuracyCalculator();
let isInitialized = false;
let initializationPromise = null;

// Register models with ensemble
ensembleModel.registerModel('DEEP_LEARNING', deepLearningModel);
ensembleModel.registerModel('TIME_SERIES', timeSeriesPredictor);
ensembleModel.registerModel('PATTERN_ANALYSIS', patternAnalyzer);
ensembleModel.registerModel('NEURAL_NETWORK', neuralNetwork);

async function initializeModels() {
  if (isInitialized) return true;
  
  if (initializationPromise) {
    return await initializationPromise;
  }
  
  initializationPromise = (async () => {
    console.log('🚀 Initializing AI/ML Prediction System...');
    
    try {
      // Fetch historical data
      console.log('📊 Fetching historical data...');
      const historicalData = await DataFetcher.fetchHistoricalData(300);
      
      if (historicalData.length < constants.TRAINING.MIN_DATA_POINTS) {
        console.log(`❌ Insufficient data: ${historicalData.length} records`);
        return false;
      }
      
      console.log(`✅ Fetched ${historicalData.length} records`);
      
      // Process data
      const processedData = DataProcessor.processResults(historicalData);
      console.log(`📈 Processed ${processedData.length} data points`);
      
      // Prepare training data
      const trainingData = DataProcessor.prepareTrainingData(processedData);
      console.log(`🎯 Prepared ${trainingData.length} training samples`);
      
      // Train Deep Learning Model
      console.log('🧠 Training Deep Learning Model...');
      await deepLearningModel.train(trainingData, {
        iterations: 8000,
        errorThresh: 0.002,
        logPeriod: 1000
      });
      
      // Analyze with Time Series Predictor
      console.log('⏰ Training Time Series Predictor...');
      timeSeriesPredictor.analyze(processedData);
      
      // Analyze patterns
      console.log('🔍 Analyzing Patterns...');
      patternAnalyzer.analyze(processedData);
      
      // Train Neural Network
      console.log('🕸️ Training Neural Network...');
      neuralNetwork.train(trainingData, {
        iterations: 4000,
        errorThresh: 0.004
      });
      
      // Calculate advanced features
      const features = DataProcessor.calculateAdvancedFeatures(processedData);
      console.log('📊 Calculated advanced features:', features);
      
      isInitialized = true;
      console.log('✅ All models initialized successfully!');
      console.log('🎯 System ready for predictions');
      
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      isInitialized = false;
      return false;
    }
  })();
  
  return await initializationPromise;
}

// Auto-initialize on startup
setTimeout(() => {
  initializeModels().then(success => {
    if (success) {
      console.log('🎉 Prediction System Ready!');
    }
  });
}, 1000);

// Retrain models periodically
setInterval(async () => {
  if (isInitialized) {
    console.log('🔄 Periodic model retraining...');
    await initializeModels();
  }
}, constants.TRAINING.RETRAIN_INTERVAL);

// Main prediction endpoint
router.get('/', async (req, res) => {
  try {
    const cacheKey = `prediction_${Date.now()}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Ensure models are initialized
    if (!isInitialized) {
      const initialized = await initializeModels();
      if (!initialized) {
        return res.status(503).json({
          status: 'INITIALIZING',
          message: 'AI models are still initializing. Please try again in 30 seconds.',
          estimatedTime: '30 seconds'
        });
      }
    }
    
    // Fetch latest data
    console.log('🔍 Fetching latest data for prediction...');
    const historicalData = await DataFetcher.fetchHistoricalData(150);
    
    if (historicalData.length < 50) {
      return res.status(503).json({
        error: 'INSUFFICIENT_DATA',
        message: 'Not enough historical data for accurate prediction',
        minimumRequired: 50,
        available: historicalData.length
      });
    }
    
    const processedData = DataProcessor.processResults(historicalData);
    const latestResult = processedData[processedData.length - 1];
    const recentData = processedData.slice(-20);
    
    // Prepare input for models
    const featureVector = DataProcessor.createFeatureVector(recentData.slice(-20));
    
    // Get ensemble prediction
    console.log('🤖 Getting ensemble prediction...');
    const ensemblePrediction = ensembleModel.predict(featureVector, recentData);
    
    // Check previous prediction accuracy
    let previousPredictionStatus = null;
    let previousPredictionMessage = '';
    
    const lastCachedPrediction = cache.get('last_prediction_details');
    if (lastCachedPrediction && latestResult) {
      const lastPred = lastCachedPrediction.prediction;
      const lastActual = latestResult.bigSmall;
      
      const isCorrect = lastPred === lastActual;
      accuracyCalculator.recordPrediction(lastPred, lastActual);
      
      previousPredictionStatus = isCorrect ? 'WIN' : 'LOSS';
      
      if (isCorrect) {
        previousPredictionMessage = `🎉 WIN! Previous prediction (${lastPred}) was correct!`;
      } else {
        previousPredictionMessage = `💔 LOSS! Previous prediction (${lastPred}) was incorrect. Actual was ${lastActual}.`;
      }
      
      // Update model performance
      for (const model of lastCachedPrediction.modelContributions || []) {
        ensembleModel.updatePerformance(
          model.name,
          model.probability > 0.5 ? 'BIG' : 'SMALL',
          lastActual
        );
      }
    }
    
    // Prepare response
    const accuracyStats = accuracyCalculator.getStats();
    const predictionTrend = accuracyCalculator.getPredictionTrend();
    
    const response = {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      system: {
        version: '2.0.0',
        modelsInitialized: isInitialized,
        totalModels: 4,
        systemAccuracy: `${accuracyStats.overallAccuracy}%`,
        confidenceLevel: accuracyStats.confidenceLevel,
        predictionTrend: predictionTrend
      },
      currentPeriod: {
        period: latestResult?.period || 'N/A',
        number: latestResult?.number || 'N/A',
        result: latestResult ? {
          bigSmall: latestResult.bigSmall,
          oddEven: latestResult.oddEven,
          sum: latestResult.sum,
          lastDigit: latestResult.lastDigit
        } : null
      },
      prediction: {
        value: ensemblePrediction.prediction,
        confidence: ensemblePrediction.confidence,
        ensembleConfidence: `${ensemblePrediction.ensembleConfidence}%`,
        probability: ensemblePrediction.probability.toFixed(4),
        nextPeriod: (parseInt(latestResult?.period || '0') + 1).toString(),
        recommendation: `💡 ${ensemblePrediction.confidence} confidence in ${ensemblePrediction.prediction}`,
        riskLevel: ensemblePrediction.confidence === 'VERY_HIGH' ? 'LOW' : 
                   ensemblePrediction.confidence === 'HIGH' ? 'MODERATE' : 'HIGH'
      },
      previousPrediction: {
        status: previousPredictionStatus || 'NO_PREVIOUS_DATA',
        message: previousPredictionMessage || 'No previous prediction to compare',
        accuracy: accuracyStats
      },
      aiAnalysis: {
        modelsUsed: ensemblePrediction.modelContributions?.length || 0,
        topModel: ensemblePrediction.modelContributions?.[0]?.name || 'N/A',
        averageConfidence: `${ensemblePrediction.ensembleConfidence}%`,
        modelWeights: ensemblePrediction.weights
      },
      statistics: {
        winStreak: accuracyStats.winStreak,
        lossStreak: accuracyStats.lossStreak,
        maxWinStreak: accuracyStats.maxWinStreak,
        maxLossStreak: accuracyStats.maxLossStreak,
        recentAccuracy: `${accuracyStats.recentAccuracy}%`,
        totalPredictions: accuracyStats.totalPredictions
      },
      disclaimer: '⚠️ Predictions are based on AI/ML algorithms. No guarantee of winning. Use at your own risk.'
    };
    
    // Cache results
    cache.set(cacheKey, response, 25); // Cache for 25 seconds
    cache.set('last_prediction_details', {
      prediction: ensemblePrediction.prediction,
      period: latestResult?.period,
      timestamp: new Date().toISOString(),
      modelContributions: ensemblePrediction.modelContributions
    }, 600);
    
    console.log(`✅ Prediction generated: ${ensemblePrediction.prediction} (${ensemblePrediction.confidence} confidence)`);
    
    res.json(response);
  } catch (error) {
    console.error('❌ Prediction error:', error);
    
    res.status(500).json({
      status: 'ERROR',
      message: 'Prediction system encountered an error',
      error: error.message,
      fallbackPrediction: {
        value: Math.random() > 0.5 ? 'BIG' : 'SMALL',
        confidence: 'LOW',
        note: 'Using fallback due to system error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      system: {
        initialized: isInitialized,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        models: {
          deepLearning: deepLearningModel.getModelInfo ? deepLearningModel.getModelInfo() : 'Not available',
          neuralNetwork: neuralNetwork.getStats ? neuralNetwork.getStats() : 'Not available',
          ensemble: ensembleModel.getEnsembleStats ? ensembleModel.getEnsembleStats() : 'Not available'
        }
      },
      accuracy: accuracyCalculator.getStats(),
      cache: {
        keys: cache.keys().length,
        stats: cache.getStats()
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force retrain endpoint
router.post('/retrain', async (req, res) => {
  try {
    isInitialized = false;
    const success = await initializeModels();
    
    if (success) {
      res.json({
        status: 'SUCCESS',
        message: 'Models retrained successfully',
        timestamp: new Date().toISOString(),
        modelsRetrained: 4
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Retraining failed'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
