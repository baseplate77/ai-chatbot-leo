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
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const embedding_1 = __importDefault(require("./routers/embedding"));
const query_1 = __importDefault(require("./routers/query"));
const get_urls_1 = __importDefault(require("./routers/get_urls"));
const chat_1 = __importDefault(require("./routers/chat"));
const dns_1 = __importDefault(require("dns"));
const train_full_bot_1 = __importDefault(require("./routers/train-full-bot"));
const rate_limiter_1 = require("./utils/rate-limiter");
// import aiService from './services/ai_model';
dotenv_1.default.config();
dns_1.default.setDefaultResultOrder("ipv4first");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*'
}));
app.use(rate_limiter_1.rateLimiterMiddleware);
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(express_1.default.json());
const port = process.env.PORT || 3000;
app.use(query_1.default);
app.use(embedding_1.default);
app.use(get_urls_1.default);
app.use(chat_1.default);
app.use(train_full_bot_1.default);
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // await chatbot("query", "flutter-ui-dev")
    // try {
    //   let d = await fetch("https://db.webbotify.com")
    //   console.log("got a resonspe :", d);
    // } catch (error) {
    //   console.log("erorr :", error);
    // }
    // await loadModel()
    // await aiService.runQuery("", [])
    res.send('Express + TypeScript Server');
}));
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`⚡️[server]: Server with https is running at http://localhost:${port} ⚡`);
}));
