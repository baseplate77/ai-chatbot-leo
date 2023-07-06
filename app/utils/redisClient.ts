import Redis from "ioredis"
import dotenv from 'dotenv';

dotenv.config();


export const redisClient = new Redis(`redis://default:${process.env.REDIS_TOKEN}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

export const rateLimiterRedisClient = new Redis(`redis://default:${process.env.RATE_LIMITER_REDIS_TOKEN}@${process.env.RRATE_LIMITER_EDIS_HOST}:${process.env.RATE_LIMITER_REDIS_PORT}`, {
    enableOfflineQueue: false,
})