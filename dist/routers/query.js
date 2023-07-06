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
const chatbot_1 = __importDefault(require("../utils/chatbot"));
const delay_1 = __importDefault(require("../utils/delay"));
const queryRouter = express_1.default.Router();
queryRouter.get("/test-query", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let resText = "Flutter is an open-source mobile application development framework created by Google. It allows developers to build high-quality native interfaces for both Android and iOS platforms using a single codebase. Flutter uses the Dart programming language and has a rich set of pre-built widgets and tools to simplify the development process.";
    const { query, id } = req.query;
    // let query = "what is flutter"
    // let collectionName = "flutter-ui-dev"
    res.writeHead(200, {
        'Cache-Control': 'no-cache',
        "Connection": 'keep-alive',
        'Content-Type': 'text/event-stream',
        "Access-Control-Allow-Origin": "*",
    });
    // await chatbot(query, id, res)
    let token = resText.split(" ");
    for (let index = 0; index < token.length; index++) {
        const element = token[index];
        yield (0, delay_1.default)(200);
        res.write(`data: ${element}\n\n`);
    }
    res.end();
    console.log("ended");
}));
queryRouter.get("/query", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, id, sessionId } = req.query;
    // let query = "what in the complete one+"
    let chatbotId = id;
    const s = req.query;
    try {
        res.writeHead(200, {
            'Cache-Control': 'no-cache',
            "Connection": 'keep-alive',
            'Content-Type': 'text/event-stream',
            "Access-Control-Allow-Origin": "*",
        });
        yield (0, chatbot_1.default)(query, chatbotId, res, sessionId);
    }
    catch (error) {
        console.log("unable to query due to :", error);
        res.write(`error: unable to query due to ${error}`);
        // res.status(500).send(`unable to query due to : ${error}`)
    }
    finally {
        res.end();
    }
    console.log("ended");
}));
exports.default = queryRouter;
