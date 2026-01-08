const express = require('express');
const router = express.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

const DataFetcher = require('../utils/fetchData');
const DataProcessor = require('../utils/dataProcessor');

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const cacheKey = `history_${limit}`;
    
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    console.log(`📊 Fetching ${limit} historical records...`);
    const historicalData = await DataFetcher.fetchHistoricalData(limit);
    
    if (historicalData.length === 0) {
      return res.status(404).json({
        error: 'NO_DATA',
        message: 'Could not fetch historical data'
      });
    }
    
    const processedData = DataProcessor.processResults(historicalData);
    
    // Calculate statistics
    const stats = {
      total: processedData.length,
      bigCount: processedData.filter(d => d.bigSmall === 'BIG').length,
      smallCount: processedData.filter(d => d.bigSmall === 'SMALL').length,
      oddCount: processedData.filter(d => d.oddEven === 'ODD').length,
      evenCount: processedData.filter(d => d.oddEven === 'EVEN').length,
      averageNumber: processedData.reduce((sum, d) => sum + d.number, 0) / processedData.length,
      averageSum: processedData.reduce((sum, d) => sum + d.sum, 0) / processedData.length,
      mostFrequentNumber: this.getMostFrequent(processedData.map(d => d.number)),
      mostFrequentBigSmall: this.getMostFrequent(processedData.map(d => d.bigSmall)),
      mostFrequentOddEven: this.getMostFrequent(processedData.map(d => d.oddEven))
    };
    
    // Calculate percentages
    stats.bigPercentage = ((stats.bigCount / stats.total) * 100).toFixed(2);
    stats.oddPercentage = ((stats.oddCount / stats.total) * 100).toFixed(2);
    
    const response = {
      status: 'SUCCESS',
      count: processedData.length,
      statistics: stats,
      results: processedData.reverse(),
      request: {
        limit: limit,
        timestamp: new Date().toISOString()
      }
    };
    
    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      error: 'FETCH_ERROR',
      message: 'Failed to fetch historical data',
      details: error.message
    });
  }
});

// Helper function
function getMostFrequent(arr) {
  const frequency = {};
  let maxFreq = 0;
  let mostFrequent;
  
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item];
      mostFrequent = item;
    }
  });
  
  return {
    value: mostFrequent,
    frequency: maxFreq
  };
}

module.exports = router;
