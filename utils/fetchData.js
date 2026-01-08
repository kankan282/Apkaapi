const axios = require('axios');
const constants = require('../config/constants');

class DataFetcher {
  async fetchHistoricalData(limit = 500) {
    try {
      const response = await axios.get(constants.API_URL, {
        params: { 
          pageSize: limit,
          pageNo: 1,
          _: Date.now()
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.list) {
        const data = response.data.list.reverse();
        console.log(`✅ Fetched ${data.length} records`);
        return data;
      }
      return [];
    } catch (error) {
      console.error('❌ Fetch error:', error.message);
      return [];
    }
  }

  async fetchLatest() {
    const data = await this.fetchHistoricalData(1);
    return data[0] || null;
  }
}

module.exports = new DataFetcher();
