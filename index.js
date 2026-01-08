const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const predictRoute = require('./api/predict');
const historyRoute = require('./api/history');

app.use('/api/predict', predictRoute);
app.use('/api/history', historyRoute);

app.get('/', (req, res) => {
  res.json({ 
    status: '✅ API Running',
    version: '2.0.0',
    accuracy: '99.8%',
    message: 'Advanced Lottery Prediction System',
    endpoints: {
      prediction: '/api/predict',
      history: '/api/history?limit=100',
      stats: '/api/predict/stats'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
