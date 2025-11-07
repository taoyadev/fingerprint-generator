/**
 * Seeded Random Number Generator
 *
 * A deterministic pseudo-random number generator using Linear Congruential Generator (LCG).
 * Same seed always produces the same sequence of random numbers.
 */
export class SeededRandom {
  private state: number;

  constructor(seed?: number) {
    this.state = seed ?? Date.now();
  }

  /**
   * Generate next random number in the range [0, 1)
   */
  public next(): number {
    this.state = (this.state * 9301 + 49297) % 233280;
    return this.state / 233280;
  }

  /**
   * Generate random integer in the range [min, max] (inclusive)
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  /**
   * Generate random float in the range [min, max)
   */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Pick a random element from an array
   */
  public pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(this.next() * array.length)];
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = array[i];
      const swapVal = array[j];
      if (temp !== undefined && swapVal !== undefined) {
        array[i] = swapVal;
        array[j] = temp;
      }
    }
    return array;
  }

  /**
   * Reset the random seed
   */
  public setSeed(seed: number): void {
    this.state = seed;
  }

  /**
   * Get current seed state
   */
  public getSeed(): number {
    return this.state;
  }
}
