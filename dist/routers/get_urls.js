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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scrapy_1 = require("../utils/scrapy");
const getUrlsRouter = express_1.default.Router();
getUrlsRouter.post("/get-all-urls", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const pageHTML = await axios.get("https://www.flutteruidev.tech/")
    // pageHTML.data
    let { url, requestLimit } = req.body;
    try {
        let urls = yield (0, scrapy_1.urlCrawler)(url, undefined, requestLimit);
        res.send(urls);
    }
    catch (error) {
        console.log("error in fetch the url", url, " due to ", error);
        res.status(500).send([]);
    }
}));
getUrlsRouter.get("/s-get-all-urls", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, requestLimit } = req.query;
    res.writeHead(200, {
        'Cache-Control': 'no-cache',
        "Connection": 'keep-alive',
        'Content-Type': 'text/event-stream',
        "Access-Control-Allow-Origin": "*",
    });
    try {
        let urls = yield (0, scrapy_1.streamUrlCrawler)(url, res, undefined, requestLimit);
    }
    catch (error) {
        console.log("unable to crawle the url due to :", error);
        res.write(`error: unable to crawle the url due to : ${error}`);
    }
    finally {
        res.end();
    }
}));
exports.default = getUrlsRouter;
