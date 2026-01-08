const math = require('mathjs');

class DataProcessor {
  processResults(results) {
    return results.map(item => {
      const num = parseInt(item.drawNumber) || 0;
      return {
        period: item.period || '',
        number: num,
        bigSmall: num >= 5 ? 'BIG' : 'SMALL',
        oddEven: num % 2 === 0 ? 'EVEN' : 'ODD',
        sum: this.getSum(num),
        lastDigit: num % 10,
        prime: this.isPrime(num),
        fibonacci: this.isFibonacci(num),
        timestamp: item.drawTime || Date.now()
      };
    });
  }

  getSum(num) {
    return num.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }

  isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  isFibonacci(num) {
    return this.isPerfectSquare(5 * num * num + 4) || 
           this.isPerfectSquare(5 * num * num - 4);
  }

  isPerfectSquare(n) {
    return n >= 0 && Math.sqrt(n) % 1 === 0;
  }

  calculateAdvancedFeatures(data) {
    const numbers = data.map(d => d.number);
    const bigSmall = data.map(d => d.bigSmall === 'BIG' ? 1 : 0);
    
    return {
      mean: math.mean(numbers),
      std: math.std(numbers),
      variance: math.variance(numbers),
      trend: this.calculateTrend(bigSmall),
      volatility: this.calculateVolatility(numbers),
      momentum: this.calculateMomentum(bigSmall),
      pattern: this.detectPattern(bigSmall)
    };
  }

  calculateTrend(data) {
    const n = data.length;
    const xSum = n * (n - 1) / 2;
    const ySum = data.reduce((a, b) => a + b, 0);
    const xySum = data.reduce((a, b, i) => a + b * i, 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * xSum - xSum * xSum);
    return slope;
  }

  calculateVolatility(numbers) {
    const returns = [];
    for (let i = 1; i < numbers.length; i++) {
      returns.push(Math.abs(numbers[i] - numbers[i-1]));
    }
    return math.std(returns);
  }

  calculateMomentum(data) {
    const recent = data.slice(-5).reduce((a, b) => a + b, 0);
    const older = data.slice(-10, -5).reduce((a, b) => a + b, 0);
    return recent - older;
  }

  detectPattern(data) {
    const patterns = {
      alternating: this.checkAlternating(data),
      streak: this.checkStreak(data),
      cluster: this.checkCluster(data)
    };
    return patterns;
  }

  checkAlternating(data) {
    let changes = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i] !== data[i-1]) changes++;
    }
    return changes / (data.length - 1);
  }

  checkStreak(data) {
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] === data[i-1]) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    return maxStreak;
  }

  checkCluster(data) {
    const clusters = [];
    let currentCluster = { value: data[0], count: 1 };
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] === currentCluster.value) {
        currentCluster.count++;
      } else {
        clusters.push(currentCluster);
        currentCluster = { value: data[i], count: 1 };
      }
    }
    clusters.push(currentCluster);
    
    return clusters.sort((a, b) => b.count - a.count)[0];
  }

  prepareTrainingData(processedData) {
    const features = [];
    
    for (let i = 20; i < processedData.length; i++) {
      const window = processedData.slice(i - 20, i);
      const target = processedData[i];
      
      const featureVector = this.createFeatureVector(window);
      features.push({
        input: featureVector,
        output: target.bigSmall === 'BIG' ? 1 : 0,
        target: target
      });
    }
    
    return features;
  }

  createFeatureVector(window) {
    const vector = [];
    
    // Basic features
    window.forEach(item => {
      vector.push(item.number / 9);
      vector.push(item.bigSmall === 'BIG' ? 1 : 0);
      vector.push(item.oddEven === 'ODD' ? 1 : 0);
      vector.push(item.sum / 18);
      vector.push(item.lastDigit / 9);
      vector.push(item.prime ? 1 : 0);
      vector.push(item.fibonacci ? 1 : 0);
    });
    
    // Statistical features
    const numbers = window.map(w => w.number);
    const bigCount = window.filter(w => w.bigSmall === 'BIG').length;
    const oddCount = window.filter(w => w.oddEven === 'ODD').length;
    
    vector.push(bigCount / 20);
    vector.push(oddCount / 20);
    vector.push(math.mean(numbers) / 9);
    vector.push(math.std(numbers) / 9);
    
    // Trend features
    const recentBig = window.slice(-5).filter(w => w.bigSmall === 'BIG').length;
    const recentOdd = window.slice(-5).filter(w => w.oddEven === 'ODD').length;
    vector.push(recentBig / 5);
    vector.push(recentOdd / 5);
    
    // Pattern features
    const bigSmallPattern = window.map(w => w.bigSmall === 'BIG' ? 1 : 0);
    const oddEvenPattern = window.map(w => w.oddEven === 'ODD' ? 1 : 0);
    
    vector.push(this.calculateTrend(bigSmallPattern));
    vector.push(this.calculateTrend(oddEvenPattern));
    vector.push(this.calculateMomentum(bigSmallPattern));
    
    return vector;
  }
}

module.exports = new DataProcessor();