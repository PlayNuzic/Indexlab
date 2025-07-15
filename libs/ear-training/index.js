class EarTrainingGame {
  constructor(options = {}) {
    this.randInt = options.randInt || ((a, b) => Math.floor(Math.random() * (b - a + 1)) + a);
    this.requiredToLevelUp = 10;
    this.intervals = {
      1: [0, 1, -1, 2, -2, 10, -10, 11, -11],
      2: [0, 5, -5, 6, -6, 7, -7],
      3: [0, 3, -3, 4, -4, 8, -8, 9, -9]
    };
    this.intervals[4] = [...new Set([0, ...this.intervals[1].slice(1), ...this.intervals[3].slice(1)])];
    this.intervals[5] = [...new Set([0, ...this.intervals[4].slice(1), ...this.intervals[2].slice(1)])];
    this.start('iS', 1);
  }

  start(mode = 'iS', level = 1) {
    this.mode = mode;
    this.level = level;
    this.question = 0;
    this.correctLevel = 0;
    this.wrongLevel = 0;
    this.correctTotal = 0;
    this.wrongTotal = 0;
    this.repeat = false;
  }

  generateQuestion() {
    this.question += 1;
    let opts = this.intervals[this.level];
    if (this.mode === 'iA') opts = opts.filter(n => n >= 0);
    this.currentInterval = opts[this.randInt(0, opts.length - 1)];
    this.note1 = 60 + this.randInt(0, 11);
    this.note2 = this.note1 + this.currentInterval;
  }

  next() {
    if (!this.repeat) {
      this.generateQuestion();
    }
    return {
      note1: this.note1,
      note2: this.note2,
      currentInterval: this.currentInterval,
      question: this.question,
      level: this.level
    };
  }

  answer(value) {
    const expected = this.currentInterval;
    if (value === expected) {
      this.correctLevel++;
      this.correctTotal++;
      const levelUp = this.correctLevel >= this.requiredToLevelUp;
      this.repeat = false;
      return { correct: true, levelUp };
    }
    this.wrongLevel++;
    this.wrongTotal++;
    if (!this.repeat) {
      this.repeat = true;
      return { correct: false, retry: true };
    }
    this.repeat = false;
    return { correct: false, retry: false };
  }
}

export default EarTrainingGame;
