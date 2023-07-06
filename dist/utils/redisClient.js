"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterRedisClient = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.redisClient = new ioredis_1.default(`redis://default:${process.env.REDIS_TOKEN}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
exports.rateLimiterRedisClient = new ioredis_1.default(`redis://default:${process.env.RATE_LIMITER_REDIS_TOKEN}@${process.env.RRATE_LIMITER_EDIS_HOST}:${process.env.RATE_LIMITER_REDIS_PORT}`, {
    enableOfflineQueue: false,
});
