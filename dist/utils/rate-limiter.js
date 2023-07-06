"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterMiddleware = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const redisClient_1 = require("./redisClient");
const MAX_REQUEST_LIMIT = 20;
const MAX_REQUEST_WINDOW = 15 * 60; // Per 15 minutes by IP
const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests';
const options = {
    duration: MAX_REQUEST_WINDOW,
    points: MAX_REQUEST_LIMIT,
    storeClient: redisClient_1.rateLimiterRedisClient
};
const cralwerRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient_1.rateLimiterRedisClient,
    points: 4,
    duration: 2 * 60,
    keyPrefix: "UrlScraper"
});
const chatRateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redisClient_1.rateLimiterRedisClient,
    points: 100,
    duration: 1 * 60,
    keyPrefix: "ChatQuery"
});
const rateLimiterMiddleware = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log("ip : ", ip);
    console.log("req url :", req.url, req.url.includes("/get-all-urls") || req.url.includes("/s-get-all-urls"));
    if (req.url.includes("/get-all-urls") || req.url.includes("/s-get-all-urls"))
        cralwerRateLimiter
            .consume(ip)
            .then(() => {
            next();
        })
            .catch(() => {
            res.status(429).json({ message: TOO_MANY_REQUESTS_MESSAGE });
        });
    else
        next();
};
exports.rateLimiterMiddleware = rateLimiterMiddleware;
