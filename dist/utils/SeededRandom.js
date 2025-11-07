"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeededRandom = void 0;
class SeededRandom {
    constructor(seed) {
        this.state = seed ?? Date.now();
    }
    next() {
        this.state = (this.state * 9301 + 49297) % 233280;
        return this.state / 233280;
    }
    nextInt(min, max) {
        return Math.floor(min + this.next() * (max - min + 1));
    }
    nextFloat(min, max) {
        return min + this.next() * (max - min);
    }
    pick(array) {
        if (array.length === 0)
            return undefined;
        return array[Math.floor(this.next() * array.length)];
    }
    shuffle(array) {
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
    setSeed(seed) {
        this.state = seed;
    }
    getSeed() {
        return this.state;
    }
}
exports.SeededRandom = SeededRandom;
//# sourceMappingURL=SeededRandom.js.map