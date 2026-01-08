class AdvancedPatternAnalyzer {
  constructor() {
    this.patterns = new Map();
    this.sequenceMemory = new Map();
    this.transitionMatrix = {
      BB: { count: 0, nextB: 0, nextS: 0 },
      BS: { count: 0, nextB: 0, nextS: 0 },
      SB: { count: 0, nextB: 0, nextS: 0 },
      SS: { count: 0, nextB: 0, nextS: 0 }
    };
    this.patternLengths = [3, 4, 5, 6];
  }

  analyze(history) {
    if (history.length < 50) return;
    
    this.buildTransitionMatrix(history);
    this.extractPatterns(history);
    this.learnSequences(history);
    this.calculateProbabilities();
  }

  buildTransitionMatrix(history) {
    for (let i = 1; i < history.length; i++) {
      const prev = history[i-1].bigSmall;
      const current = history[i].bigSmall;
      const transition = prev.charAt(0) + current.charAt(0);
      
      if (!this.transitionMatrix[transition]) {
        this.transitionMatrix[transition] = { count: 0, nextB: 0, nextS: 0 };
      }
      
      this.transitionMatrix[transition].count++;
      
      if (i < history.length - 1) {
        const next = history[i+1].bigSmall;
        if (next === 'BIG') {
          this.transitionMatrix[transition].nextB++;
        } else {
          this.transitionMatrix[transition].nextS++;
        }
      }
    }
  }

  extractPatterns(history) {
    for (const length of this.patternLengths) {
      for (let i = 0; i < history.length - length; i++) {
        const pattern = this.getPattern(history.slice(i, i + length));
        const next = history[i + length];
        
        if (!this.patterns.has(pattern)) {
          this.patterns.set(pattern, { count: 0, big: 0, small: 0 });
        }
        
        const data = this.patterns.get(pattern);
        data.count++;
        
        if (next.bigSmall === 'BIG') {
          data.big++;
        } else {
          data.small++;
        }
      }
    }
  }

  learnSequences(history) {
    const bigSmallSequence = history.map(h => h.bigSmall === 'BIG' ? 'B' : 'S');
    
    for (let i = 0; i < bigSmallSequence.length - 2; i++) {
      const seq = bigSmallSequence.slice(i, i + 3).join('');
      const next = bigSmallSequence[i + 3] || '';
      
      if (!this.sequenceMemory.has(seq)) {
        this.sequenceMemory.set(seq, { count: 0, nextB: 0, nextS: 0 });
      }
      
      const data = this.sequenceMemory.get(seq);
      data.count++;
      
      if (next === 'B') data.nextB++;
      if (next === 'S') data.nextS++;
    }
  }

  calculateProbabilities() {
    // Calculate transition probabilities
    for (const transition in this.transitionMatrix) {
      const data = this.transitionMatrix[transition];
      const total = data.nextB + data.nextS;
      if (total > 0) {
        data.probB = data.nextB / total;
        data.probS = data.nextS / total;
      }
    }
    
    // Calculate pattern probabilities
    for (const [pattern, data] of this.patterns) {
      const total = data.big + data.small;
      if (total > 0) {
        data.probability = data.big / total;
        data.confidence = Math.abs(data.probability - 0.5) * 2;
      }
    }
  }

  getPattern(window) {
    return window.map(w => w.bigSmall === 'BIG' ? 'B' : 'S').join('');
  }

  predict(currentWindow) {
    const predictions = [];
    const weights = [];
    
    // 1. Pattern-based prediction
    for (const length of this.patternLengths) {
      if (currentWindow.length >= length) {
        const recent = currentWindow.slice(-length);
        const pattern = this.getPattern(recent);
        const patternData = this.patterns.get(pattern);
        
        if (patternData && patternData.count >= 3) {
          predictions.push(patternData.probability);
          weights.push(0.4 * (patternData.confidence || 0.5));
        }
      }
    }
    
    // 2. Transition-based prediction
    if (currentWindow.length >= 2) {
      const lastTwo = currentWindow.slice(-2);
      const transition = this.getPattern(lastTwo);
      const transitionData = this.transitionMatrix[transition];
      
      if (transitionData && transitionData.count >= 5) {
        predictions.push(transitionData.probB || 0.5);
        weights.push(0.3);
      }
    }
    
    // 3. Sequence-based prediction
    if (currentWindow.length >= 3) {
      const seq = this.getPattern(currentWindow.slice(-3));
      const seqData = this.sequenceMemory.get(seq);
      
      if (seqData && seqData.count >= 3) {
        const total = seqData.nextB + seqData.nextS;
        if (total > 0) {
          predictions.push(seqData.nextB / total);
          weights.push(0.3);
        }
      }
    }
    
    // Default prediction if no patterns found
    if (predictions.length === 0) {
      return 0.5;
    }
    
    // Weighted average
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      weightedSum += predictions[i] * weights[i];
      totalWeight += weights[i];
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  getPatternConfidence(currentWindow) {
    const predictions = [];
    const confidences = [];
    
    for (const length of this.patternLengths) {
      if (currentWindow.length >= length) {
        const recent = currentWindow.slice(-length);
        const pattern = this.getPattern(recent);
        const patternData = this.patterns.get(pattern);
        
        if (patternData) {
          predictions.push(patternData.probability);
          confidences.push(patternData.confidence || 0.5);
        }
      }
    }
    
    if (predictions.length === 0) return { confidence: 0, prediction: 0.5 };
    
    // Use the most confident pattern
    let maxConfidence = 0;
    let bestPrediction = 0.5;
    
    for (let i = 0; i < confidences.length; i++) {
      if (confidences[i] > maxConfidence) {
        maxConfidence = confidences[i];
        bestPrediction = predictions[i];
      }
    }
    
    return {
      confidence: maxConfidence,
      prediction: bestPrediction
    };
  }
}

module.exports = AdvancedPatternAnalyzer;