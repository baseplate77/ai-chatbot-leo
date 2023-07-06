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
const openai_1 = require("langchain/llms/openai");
const chains_1 = require("langchain/chains");
const chroma_1 = require("langchain/vectorstores/chroma");
const openai_2 = require("langchain/embeddings/openai");
const customCallbackHandler_1 = require("./customCallbackHandler");
const prompt_1 = require("./prompt");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../services/firebase");
const getModelTemperature_1 = require("./getModelTemperature");
const redisClient_1 = require("./redisClient");
const chatbot = (query, chatbotId, send, sessionId, chatInHistory = 3) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("connection to db");
    let chromadb, botSetting, chatbotDetails;
    try {
        chromadb = new chroma_1.Chroma(new openai_2.OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }), {
            collectionName: chatbotId,
            url: process.env.DB_URL,
        });
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error;
    }
    let chatHistory = [];
    try {
        let startTime = new Date().getTime();
        let chatHistoryString = yield redisClient_1.redisClient.get(sessionId);
        if (chatHistoryString !== null)
            chatHistory = JSON.parse(chatHistoryString);
        console.log(chatHistory[0]);
        let endTime = new Date().getTime();
        console.log(`time taken ${(endTime - startTime) / 1000} seconds`);
    }
    catch (error) {
        console.log("failed to set entry in redis :", error);
    }
    let chat_history = "";
    chatHistory.forEach((chat) => {
        chat_history += `human:${chat['human']},\nAIMessage: ${chat['AIMessage']},\n`;
    });
    console.log("Connected to db");
    try {
        const docRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}`);
        chatbotDetails = (yield (0, firestore_1.getDoc)(docRef)).data();
        botSetting = chatbotDetails !== undefined && chatbotDetails.setting;
    }
    catch (error) {
        console.log("error in chatbot unble to fetch user define prompts so using default prompt due to :", error);
    }
    console.log("temperature :", (0, getModelTemperature_1.getModelTemperature)(botSetting !== undefined ? botSetting.botCreativity : "conservative"));
    const model = new openai_1.OpenAIChat({ openAIApiKey: process.env.OPENAI_API_KEY, streaming: true, temperature: (0, getModelTemperature_1.getModelTemperature)(botSetting !== undefined ? botSetting.botCreativity : "conservative"), callbacks: [new customCallbackHandler_1.MyCallbackHandler(send)], modelName: "gpt-3.5-turbo-0613" });
    console.log(chatbotDetails);
    const d = chains_1.RetrievalQAChain.fromLLM(model, chromadb.asRetriever(2), {
        returnSourceDocuments: true,
        prompt: (0, prompt_1.getPromptTemplate)(chatbotDetails != undefined ? chatbotDetails.botConfig.name : "", botSetting != undefined ? botSetting.systemPrompt : "", botSetting !== undefined ? botSetting.userPrompt : "", chat_history),
        verbose: true,
    });
    const res = yield d.call({
        query
    });
    // update chat Histroy
    if (chatHistory.length >= chatInHistory) {
        chatHistory.splice(0, 1);
    }
    chatHistory.push({
        human: query,
        AIMessage: res['text'],
    });
    try {
        redisClient_1.redisClient.set(sessionId, JSON.stringify(chatHistory));
    }
    catch (error) {
        console.log("error in setting chatHistory :", error);
    }
    let sourceUrl = [];
    res['sourceDocuments'].forEach((d) => {
        sourceUrl.push(d.metadata['souorce']);
    });
    send.write(`data: [SOURCE_URL]${sourceUrl}[SOURCE_URL]\n\n`);
    console.log("response :", res['text']);
    return res;
});
const getKSearch = (totalDocs) => {
    if (totalDocs >= 3)
        return 3;
    else
        return totalDocs;
};
exports.default = chatbot;
