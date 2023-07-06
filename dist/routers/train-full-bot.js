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
const puppeteer_helper_1 = require("../utils/puppeteer_helper");
const delay_1 = __importDefault(require("../utils/delay"));
const hashUrl_1 = require("../utils/hashUrl");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../services/firebase");
const text_splitter_1 = require("langchain/text_splitter");
const chromadb_1 = require("chromadb");
const generateChatbotID_1 = require("../utils/generateChatbotID");
const trainFullBotRouter = express_1.default.Router();
trainFullBotRouter.post("/train-full-bot", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { url, name } = req.body;
    try {
        let chatBotId = yield createChatBOT(name);
        handleBotTraining(url, chatBotId);
        yield (0, delay_1.default)(1000);
        res.send({ chatBotId });
    }
    catch (error) {
        console.log("faile to start the trainning of bot for  url :", url, " due to :", error);
        res.status(500).send(`unable to start training of bot for url : ${url} due to : ${error}`);
    }
}));
const createChatBOT = (name) => __awaiter(void 0, void 0, void 0, function* () {
    let chatBotId = (0, generateChatbotID_1.generateChatbotId)();
    let userId = "flutteruidevofficial@gmail.com";
    let defaultBotDetail = {
        id: chatBotId,
        userId: userId,
        status: "pending",
        totalVisits: 0,
        totalClickOnChatbot: 0,
        negativeFeedback: 0,
        positiveFeedback: 0,
        totalChats: 0,
        totalInteractions: 0,
        totalLinks: 0,
        totalTimeSpend: 0,
        setting: {
            botCreativity: "creative",
            systemPrompt: "",
            userPrompt: ""
        },
        botConfig: {
            name: name !== null && name !== void 0 ? name : "",
            welcomeMsg: "Hi, How can i assist you?",
            primaryColor: "#5F58DF",
            botIcon: "https://firebasestorage.googleapis.com/v0/b/ai-chatbot-f2048.appspot.com/o/Group.png?alt=media&token=2fa0617f-40e8-47cd-9cbd-61665e3167be",
        },
    };
    try {
        const docRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatBotId}`);
        const userRef = (0, firestore_1.doc)(firebase_1.db, `/users/${userId}`);
        yield Promise.all([
            (0, firestore_1.setDoc)(docRef, defaultBotDetail, { merge: true }),
            (0, firestore_1.setDoc)(userRef, {
                chatbots: (0, firestore_1.arrayUnion)({ name, id: chatBotId })
            }, { merge: true })
        ]);
        return chatBotId;
    }
    catch (error) {
        console.log("unable to create chatbot due to firebase :", error);
        throw `unable to create a chatbot due to firebase : ${error}`;
    }
});
const handleBotTraining = (url, chatbotId, limit = 999, requestLimit = 999) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    var startTime = performance.now();
    let collection;
    // let chatbotId = "714812219995170139452714"
    try {
        const embedder = new chromadb_1.OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY);
        let client = new chromadb_1.ChromaClient(process.env.DB_URL);
        collection = yield client.getOrCreateCollection(chatbotId, {}, embedder);
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error;
    }
    const localUrl = new Set();
    const processUrl = [];
    let requestNoTracker = 0;
    let tnumber = 0;
    let urlQueue = [url];
    let u = new URL(url);
    let domainUrl = (_a = u.hostname) === null || _a === void 0 ? void 0 : _a.split(".").slice(-2).join(".");
    console.log("domain :", domainUrl);
    // const browser = await puppeteer.launch({
    //     executablePath: '/usr/bin/google-chrome',
    //     devtools: false,
    //     headless: "new",
    //     args: ['--no-sandbox', "--disable-gpu",]
    // })
    const browser = yield puppeteer_helper_1.puppeteer.connect({ browserWSEndpoint: `ws:${process.env.LEO_CHORME_PORT_3000_TCP_ADDR}:${process.env.LEO_CHORME_SERVICE_PORT_HTTP}`, ignoreHTTPSErrors: true, protocolTimeout: 90000 });
    let error_url = [];
    let docs = [];
    let chunk = [];
    const textSplitter = new text_splitter_1.TokenTextSplitter({
        encodingName: 'cl100k_base',
        chunkSize: 500,
        chunkOverlap: 20,
        disallowedSpecial: [],
        // separators: ['\n\n', '\n', ' ', '']
    });
    while (urlQueue.length !== 0) {
        const page = yield browser.newPage();
        tnumber++;
        let cUrl = urlQueue.shift();
        try {
            yield (0, puppeteer_helper_1.blockResourceRequest)(page);
            yield page.goto(cUrl, { timeout: 90000, waitUntil: ["domcontentloaded"] });
            let b = yield page.waitForSelector('body', { timeout: 120000, });
            if ((yield page.title()).includes("404"))
                throw '404; page not found';
            let data = yield (b === null || b === void 0 ? void 0 : b.evaluate((e) => e.innerText));
            console.log("data :", data);
            if (data == null)
                throw "unable to fetch data";
            // get all the avilable URL 
            yield page.waitForSelector("a", { timeout: 120000 });
            let a = yield page.$$("a");
            let promise = a.map((el) => __awaiter(void 0, void 0, void 0, function* () {
                let url = yield el.evaluate(e => e.href);
                if (url === "" || !url.includes(domainUrl))
                    return;
                try {
                    let u = new URL(url);
                    let newUrl = u.origin + u.pathname;
                    // console.log("urls : ", newUrl);
                    if (u.hostname.includes(domainUrl)) {
                        localUrl.add(newUrl);
                    }
                    if (u.hostname.includes(domainUrl) && localUrl.size < limit && requestNoTracker < requestLimit) {
                        // console.log("local url size :", localUrl.size);
                        if (!processUrl.includes(newUrl) && !["/signup", "/login"].some(route => newUrl.includes(route))) {
                            // cluster.queue(newUrl)
                            urlQueue.push(newUrl);
                            processUrl.push(newUrl);
                            requestNoTracker++;
                        }
                    }
                }
                catch (error) {
                    console.log("invaild Url :", url, error);
                }
            }));
            yield Promise.all(promise);
            // get all the Data of the url
            chunk = yield textSplitter.splitText(data);
            let uid = (0, hashUrl_1.hashUrl)(cUrl);
            console.log("uid :", uid, cUrl, tnumber);
            yield page.close();
            for (let index = 0; index < chunk.length; index++) {
                const text = chunk[index];
                // let embed = await embedding.embedDocuments([text]);
                // collection = await db.ensureCollection()
                // console.log("embed :", embed);
                // console.log("\n\n\n");
                let id = `${uid}-${index}`;
                let metaData = { "souorce": cUrl };
                // await collection.add(id, embed[0], metaData, text)
                collection.createIndex;
                yield collection.add(id, undefined, metaData, text);
                docs.push({
                    id,
                    text,
                    // "embed": embed[0],
                    metaData,
                });
                console.log("chunk: ", index);
            }
            // update the status and chunk size
            const docRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}/trained_data/${uid}`);
            const chatbotRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}`);
            yield Promise.all([
                (0, firestore_1.setDoc)(docRef, {
                    status: "trained",
                    chunk_size: chunk.length,
                    id: uid,
                    type: "WEB",
                    source: cUrl,
                    created_at: new Date(),
                    updated_at: new Date()
                }, { merge: true }),
                (0, firestore_1.setDoc)(chatbotRef, {
                    totalLinks: (0, firestore_1.increment)(1)
                }, { merge: true })
            ]);
            // if (index + 1 === urls.length)
            //     await updateDoc(chatRef, {
            //         status: "trained"
            //     })
            // docs.push(new Document({ pageContent: data!, metadata: metaData }))
        }
        catch (error) {
            console.log("error in scrapying the url due to : ", error);
            let uid = (0, hashUrl_1.hashUrl)(url);
            const docRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}/trained_data/${uid}`);
            yield (0, firestore_1.setDoc)(docRef, {
                id: uid,
                type: "WEB",
                status: "failed",
                source: cUrl,
                chunk_size: chunk.length,
                updated_at: new Date()
            }, { merge: true });
            error_url.push(url);
        }
    }
    console.log("done");
    browser.disconnect();
    var endTime = performance.now();
    console.log(`traning this bot  took ${(endTime - startTime) / 1000} seconds`);
    // const cluster = await Cluster.launch({
    //     concurrency: Cluster.CONCURRENCY_CONTEXT,
    //     maxConcurrency: 2,
    //     // monitor: true,
    //     skipDuplicateUrls: true,
    //     retryLimit: 0,
    //     retryDelay: 0,
    //     puppeteer,
    //     // timeout: 0,
    //     puppeteerOptions: {
    //         waitForInitialPage: true,
    //         headless: false,
    //         devtools: false,
    //         // userDataDir: "./user_data",
    //         // executablePath: '/usr/bin/google-chrome',
    //         args: [
    //             "--no-sandbox",
    //             "--disable-gpu",
    //             "--shm-size=1gb",
    //             '--disable-dev-shm-usage',
    //             '--disable-setuid-sandbox',
    //             '--no-first-run',
    //             '--no-zygote',
    //             '--enable-blink-features=HTMLImports',
    //         ],
    //         ignoreHTTPSErrors: true,
    //     }
    // });
    // try {
    //     await cluster.task(async ({ page, data: url }) => {
    //         console.log("processing url :", url);
    //         try {
    //             await page.setViewport({ width: 1920, height: 1080 });
    //             page.setDefaultNavigationTimeout(12000);
    //             await blockResourceRequest(page)
    //             await page.goto(url, { timeout: 120000, waitUntil: ['domcontentloaded', "load"] });
    //             // await page.waitForSelector('.js-result', { visible: true })
    //             let b = await page.waitForSelector('body', { timeout: 12000, visible: true })
    //             if ((await page.title()).includes("404"))
    //                 throw '404; page not found';
    //             let data = await b?.evaluate((e) => e.innerText);
    //             console.log("data :", data);
    //             let a = await page.$$("a")
    //             let promise = a.map(async (el) => {
    //                 let url = await el.evaluate(e => e.href)
    //                 if (url === "" || !url.includes(domainUrl)) return
    //                 try {
    //                     let u = new URL(url)
    //                     let newUrl = u.origin + u.pathname
    //                     // console.log("urls : ", newUrl);
    //                     if (u.hostname.includes(domainUrl)) {
    //                         localUrl.add(newUrl)
    //                     }
    //                     if (u.hostname.includes(domainUrl) && localUrl.size < limit && requestNoTracker < requestLimit) {
    //                         // console.log("local url size :", localUrl.size);
    //                         if (!processUrl.includes(newUrl) && !["/signup", "/login"].some(route => newUrl.includes(route))) {
    //                             cluster.queue(newUrl)
    //                             processUrl.push(newUrl)
    //                             requestNoTracker++;
    //                         }
    //                     }
    //                 } catch (error) {
    //                     console.log("invaild Url :", url, error);
    //                 }
    //             })
    //             await Promise.all(promise)
    //         } catch (error) {
    //             console.log("error in cluster task :", error);
    //         }
    //         // Store screenshot, do something else
    //     });
    //     let u = new URL(url)
    //     let domainUrl = u.hostname?.split(".").slice(-2).join(".");
    //     cluster.queue(url);
    //     processUrl.push(url)
    //     await cluster.idle();
    //     await delay(100)
    //     await cluster.close();
    // } catch (error) {
    //     console.log("error in urlcrawler ", error);
    //     await cluster.close()
    //     throw error;
    // }
});
exports.default = trainFullBotRouter;
