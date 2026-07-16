/**
 * Deterministic Seeded Random Number Generator
 * Allows full reproducibility of daily cards and buyers.
 */
export class SeedRandom {
  constructor(seed = "data-privacy-hack-default") {
    this.seed = seed;
    this.state = this.hash(seed);
  }

  /**
   * Generates a simple 32-bit hash from seed string
   */
  hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return (h >>> 0);
  }

  /**
   * Generates next pseudo-random number between 0 and 1
   */
  next() {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  /**
   * Generates a random float in range [min, max)
   */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Generates a random integer in range [min, max] (inclusive)
   */
  rangeInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Randomly picks an element from an array
   */
  pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[this.rangeInt(0, arr.length - 1)];
  }

  /**
   * Deterministically shuffles an array in-place
   */
  shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.rangeInt(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  /**
   * Get current state of the RNG for save game
   */
  getState() {
    return this.state;
  }

  /**
   * Restore the state of the RNG from load game
   */
  setState(state) {
    this.state = Number(state) || 0;
  }
}
