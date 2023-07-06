import { NextFunction, Request, Response } from 'express';
import { IRateLimiterRedisOptions, RateLimiterRedis } from 'rate-limiter-flexible';
import { rateLimiterRedisClient } from './redisClient';

const MAX_REQUEST_LIMIT = 20;
const MAX_REQUEST_WINDOW = 15 * 60; // Per 15 minutes by IP
const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests';

const options: IRateLimiterRedisOptions = {
    duration: MAX_REQUEST_WINDOW,
    points: MAX_REQUEST_LIMIT,
    storeClient: rateLimiterRedisClient

};

const cralwerRateLimiter = new RateLimiterRedis({
    storeClient: rateLimiterRedisClient,
    points: 4,
    duration: 2 * 60,
    keyPrefix: "UrlScraper"
});

const chatRateLimiter = new RateLimiterRedis({
    storeClient: rateLimiterRedisClient,
    points: 100,
    duration: 1 * 60,
    keyPrefix: "ChatQuery"
})

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip: any = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
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

    else next()
};