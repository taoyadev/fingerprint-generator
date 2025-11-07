export declare class SeededRandom {
    private state;
    constructor(seed?: number);
    next(): number;
    nextInt(min: number, max: number): number;
    nextFloat(min: number, max: number): number;
    pick<T>(array: T[]): T | undefined;
    shuffle<T>(array: T[]): T[];
    setSeed(seed: number): void;
    getSeed(): number;
}
//# sourceMappingURL=SeededRandom.d.ts.map