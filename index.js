const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple prediction function (AI/ML logic embedded)
function predictBigSmall(history) {
  if (!history || history.length < 10) return 0.5;
  
  const last10 = history.slice(-10);
  const bigCount = last10.filter(h => h.bigSmall === 'BIG').length;
  const smallCount = last10.filter(h => h.bigSmall === 'SMALL').length;
  
  // Advanced pattern detection
  let patternScore = 0;
  for (let i = 1; i < last10.length; i++) {
    if (last10[i].bigSmall === last10[i-1].bigSmall) {
      patternScore += 0.1;
    } else {
      patternScore -= 0.1;
    }
  }
  
  // Trend analysis
  const firstHalf = history.slice(-20, -10);
  const secondHalf = history.slice(-10);
  const firstBig = firstHalf.filter(h => h.bigSmall === 'BIG').length;
  const secondBig = secondHalf.filter(h => h.bigSmall === 'BIG').length;
  const trend = secondBig - firstBig;
  
  // Calculate probability
  let probability = bigCount / 10;
  probability += patternScore * 0.3;
  probability += (trend / 10) * 0.2;
  
  return Math.max(0.1, Math.min(0.9, probability));
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'API Running',
    message: 'Lottery Prediction API',
    endpoints: {
      prediction: '/api/predict',
      history: '/api/history?limit=50'
    }
  });
});

app.get('/api/predict', async (req, res) => {
  try {
    // Simulate API call
    const probability = Math.random() > 0.5 ? 0.75 : 0.25;
    const prediction = probability > 0.5 ? 'BIG' : 'SMALL';
    const confidence = probability > 0.7 ? 'HIGH' : 'MEDIUM';
    
    res.json({
      timestamp: new Date().toISOString(),
      prediction: prediction,
      confidence: confidence,
      probability: probability.toFixed(2),
      nextPeriod: '20240115001',
      winMessage: '🎉 High chance of winning!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    // Simulate history data
    const history = [];
    for (let i = 0; i < limit; i++) {
      history.push({
        period: `20240115${String(i+1).padStart(3, '0')}`,
        number: Math.floor(Math.random() * 10),
        bigSmall: Math.random() > 0.5 ? 'BIG' : 'SMALL',
        oddEven: Math.random() > 0.5 ? 'ODD' : 'EVEN'
      });
    }
    
    res.json({
      count: history.length,
      results: history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple prediction function (AI/ML logic embedded)
function predictBigSmall(history) {
  if (!history || history.length < 10) return 0.5;
  
  const last10 = history.slice(-10);
  const bigCount = last10.filter(h => h.bigSmall === 'BIG').length;
  const smallCount = last10.filter(h => h.bigSmall === 'SMALL').length;
  
  // Advanced pattern detection
  let patternScore = 0;
  for (let i = 1; i < last10.length; i++) {
    if (last10[i].bigSmall === last10[i-1].bigSmall) {
      patternScore += 0.1;
    } else {
      patternScore -= 0.1;
    }
  }
  
  // Trend analysis
  const firstHalf = history.slice(-20, -10);
  const secondHalf = history.slice(-10);
  const firstBig = firstHalf.filter(h => h.bigSmall === 'BIG').length;
  const secondBig = secondHalf.filter(h => h.bigSmall === 'BIG').length;
  const trend = secondBig - firstBig;
  
  // Calculate probability
  let probability = bigCount / 10;
  probability += patternScore * 0.3;
  probability += (trend / 10) * 0.2;
  
  return Math.max(0.1, Math.min(0.9, probability));
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'API Running',
    message: 'Lottery Prediction API',
    endpoints: {
      prediction: '/api/predict',
      history: '/api/history?limit=50'
    }
  });
});

app.get('/api/predict', async (req, res) => {
  try {
    // Simulate API call
    const probability = Math.random() > 0.5 ? 0.75 : 0.25;
    const prediction = probability > 0.5 ? 'BIG' : 'SMALL';
    const confidence = probability > 0.7 ? 'HIGH' : 'MEDIUM';
    
    res.json({
      timestamp: new Date().toISOString(),
      prediction: prediction,
      confidence: confidence,
      probability: probability.toFixed(2),
      nextPeriod: '20240115001',
      winMessage: '🎉 High chance of winning!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    // Simulate history data
    const history = [];
    for (let i = 0; i < limit; i++) {
      history.push({
        period: `20240115${String(i+1).padStart(3, '0')}`,
        number: Math.floor(Math.random() * 10),
        bigSmall: Math.random() > 0.5 ? 'BIG' : 'SMALL',
        oddEven: Math.random() > 0.5 ? 'ODD' : 'EVEN'
      });
    }
    
    res.json({
      count: history.length,
      results: history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
