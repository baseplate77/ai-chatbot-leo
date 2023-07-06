"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamUrlCrawler = exports.urlCrawler = void 0;
const puppeteer_helper_1 = require("./puppeteer_helper");
// focus of this crawler is to give as many url as fast as possible, no need to give all url just give it fast
const urlCrawler = (url, limit = 99, requestLimit = 4) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("limit :", limit, requestLimit);
        let urls = yield (0, puppeteer_helper_1.puppeteerClusterCrwaler)(url, limit, requestLimit);
        return urls;
    }
    catch (error) {
        console.log("error in urlCrawler, unable to crallwer due to :", error);
        throw `error in urlCrawler, fail to crawler due to : ${error}`;
    }
});
exports.urlCrawler = urlCrawler;
const streamUrlCrawler = (url, res, limit = 99, requestLimit = 4) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let urls = yield (0, puppeteer_helper_1.puppeteerClusterCrwaler)(url, limit, requestLimit, (newUrl) => {
            // console.log("newUrl :", newUrl);
            res.write(`data: ${newUrl}\n\n`);
        });
        return urls;
    }
    catch (error) {
        console.log("error in streamUrlCrawler, unable to crallwer due to :", error);
        throw `error in streamUrlCrawler, fail to crawler due to : ${error}`;
    }
});
exports.streamUrlCrawler = streamUrlCrawler;
