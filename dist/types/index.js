"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BayesianNetworkError = exports.DataCollectionError = exports.FingerprintGenerationError = void 0;
class FingerprintGenerationError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'FingerprintGenerationError';
    }
}
exports.FingerprintGenerationError = FingerprintGenerationError;
class DataCollectionError extends Error {
    constructor(message, source, details) {
        super(message);
        this.source = source;
        this.details = details;
        this.name = 'DataCollectionError';
    }
}
exports.DataCollectionError = DataCollectionError;
class BayesianNetworkError extends Error {
    constructor(message, node, details) {
        super(message);
        this.node = node;
        this.details = details;
        this.name = 'BayesianNetworkError';
    }
}
exports.BayesianNetworkError = BayesianNetworkError;
//# sourceMappingURL=index.js.map