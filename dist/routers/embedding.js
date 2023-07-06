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
const embedingHelper_1 = require("../utils/embedingHelper");
const checkToken_1 = require("../utils/checkToken");
const embeddingRoute = express_1.default.Router();
embeddingRoute.post("/embedding", checkToken_1.checkToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { urls, chatbotId } = req.body;
    console.log("embedding is called :", urls, chatbotId);
    try {
        let urlData = yield (0, embedingHelper_1.addUrlsToDb)(urls, chatbotId);
        res.send(urlData);
        console.log("embedding started");
        let { docs } = yield (0, embedingHelper_1.createEmbedding)(urls, chatbotId, req.user);
        console.log("finish embedding :");
    }
    catch (error) {
        console.log("error in creating embedding due to :", error);
        res.status(500).send("unable to create embedding due to " + error);
    }
    // let result = await embeddingData(docs, collectionName)
}));
embeddingRoute.post("/custom-knowledge-embedding", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, chatbotId } = req.body;
    try {
        yield (0, embedingHelper_1.customKnwoledgeEmbed)(data, chatbotId);
        res.send("done");
    }
    catch (error) {
        console.log("error in custom knowledge embedding due to :", error);
        res.status(500).send("unable to custom knowledge embedding due to " + error);
    }
}));
embeddingRoute.delete("/embedding", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { urls, chatbotId } = req.body;
    console.log(urls, chatbotId);
    try {
        yield (0, embedingHelper_1.deleteEmbedding)(urls, chatbotId);
        res.send({ sucess: true, error: false });
    }
    catch (error) {
        console.log("error in deleting Embedding :", error);
        res.status(500).send({ sucess: false, error: true });
    }
}));
exports.default = embeddingRoute;
