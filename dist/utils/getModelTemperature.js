"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelTemperature = void 0;
const getModelTemperature = (botCreativity = 'conservative') => {
    if (botCreativity === "restricted")
        return 0;
    else if (botCreativity === "conservative")
        return 0.4;
    else if (botCreativity === 'creative')
        return 1;
    // default
    return 0;
};
exports.getModelTemperature = getModelTemperature;
