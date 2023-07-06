"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatbotId = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateChatbotId = () => {
    const typedArray = new Uint8Array(10);
    const randomValues = crypto_1.default.getRandomValues(typedArray);
    return randomValues.join('');
};
exports.generateChatbotId = generateChatbotId;
