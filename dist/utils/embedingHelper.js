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
exports.addUrlsToDb = exports.deleteEmbedding = exports.createEmbedding = exports.customKnwoledgeEmbed = void 0;
// import puppeteer from "puppeteer"
const text_splitter_1 = require("langchain/text_splitter");
const chromadb_1 = require("chromadb");
const hashUrl_1 = require("./hashUrl");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
const puppeteer_helper_1 = require("./puppeteer_helper");
const resend_1 = require("../services/resend");
const customKnwoledgeEmbed = (data, chatbotId) => __awaiter(void 0, void 0, void 0, function* () {
    let collection;
    try {
        const embedder = new chromadb_1.OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY);
        let client = new chromadb_1.ChromaClient(process.env.DB_URL);
        collection = yield client.getOrCreateCollection(chatbotId, {}, embedder);
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error;
    }
    const textSplitter = new text_splitter_1.TokenTextSplitter({
        encodingName: 'cl100k_base',
        chunkSize: 500,
        chunkOverlap: 20,
        disallowedSpecial: [],
        // separators: ['\n\n', '\n', ' ', '']
    });
    // const chatRef = doc(db, `/chatbots/${chatbotId}`);
    // await updateDoc(chatRef, {
    //     status: "pending"
    // })
    try {
        let chunk = [];
        try {
            chunk = yield textSplitter.splitText(data);
            let uid = (0, hashUrl_1.hashUrl)(data);
            console.log("uid :", uid);
            for (let index = 0; index < chunk.length; index++) {
                const text = chunk[index];
                let id = `${uid}-${index}`;
                let metaData = { "souorce": "" };
                yield collection.add(id, undefined, metaData, text);
                console.log("chunk: ", index);
            }
            // update the status and chunk size
            // const docRef = doc(db, `/chatbots/${chatbotId}/trained_data/${uid}`);
            // await updateDoc(docRef, {
            //     status: "trained",
            //     chunk_size: chunk.length,
            // });
            // await updateDoc(chatRef, {
            //     status: "trained"
            // })
            // docs.push(new Document({ pageContent: data!, metadata: metaData }))
        }
        catch (error) {
            error = error;
            console.log("error in embedding the url due to : ", error);
            let uid = 'custom-knowledge';
            // const docRef = doc(db, `/chatbots/${chatbotId}/trained_data/${uid}`);
            // await updateDoc(docRef, {
            //     status: "failed",
            //     chunk_size: chunk.length,
            // });
        }
        // await updateDoc(chatRef, {
        //     status: "trained"
        // })
    }
    catch (error) {
        error = error;
        console.log("error in embeding url due to :", error);
        throw error;
    }
});
exports.customKnwoledgeEmbed = customKnwoledgeEmbed;
const createEmbedding = (urls, chatbotId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    let collection;
    let error;
    try {
        const embedder = new chromadb_1.OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY);
        let client = new chromadb_1.ChromaClient(process.env.DB_URL);
        collection = yield client.getOrCreateCollection(chatbotId, {}, embedder);
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error;
    }
    // const browser = await puppeteer.launch({
    //     // executablePath: '/usr/bin/google-chrome',
    //     headless: "new",
    //     args: ['--no-sandbox', "--disable-gpu",]
    // })
    let process_url = [];
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
    const chatRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}`);
    yield (0, firestore_1.updateDoc)(chatRef, {
        status: "pending"
    });
    try {
        for (let index = 0; index < urls.length; index++) {
            const url = urls[index];
            console.log("processing ", url);
            const browser = yield puppeteer_helper_1.puppeteer.connect({ browserWSEndpoint: `ws:${process.env.LEO_CHORME_PORT_3000_TCP_ADDR}:${process.env.LEO_CHORME_SERVICE_PORT_HTTP}`, ignoreHTTPSErrors: true, protocolTimeout: 0, });
            // const browser = await puppeteer.connect({ browserWSEndpoint: `ws:localhost:3002`, ignoreHTTPSErrors: true, protocolTimeout: 0, })
            try {
                const page = yield browser.newPage();
                yield (0, puppeteer_helper_1.blockResourceRequest)(page);
                page.setDefaultNavigationTimeout(0);
                yield page.goto(url, { timeout: 0, waitUntil: ["domcontentloaded", "load"] });
                let b = yield page.waitForSelector('body', { timeout: 120000 });
                if ((yield page.title()).includes("404"))
                    throw '404; page not found';
                let data = yield (b === null || b === void 0 ? void 0 : b.evaluate((e) => e.innerText));
                let a = yield page.$$("a");
                let promise = a.map((el) => __awaiter(void 0, void 0, void 0, function* () {
                    let url = yield el.evaluate(e => e.href);
                    let text = yield el.evaluate(e => e.innerText);
                    console.log(text, url);
                    data = data.replace(text, `[${text}](${url})`);
                }));
                yield Promise.all(promise);
                console.log("data :", data);
                if (data == null)
                    throw "unable to fetch data";
                chunk = yield textSplitter.splitText(data);
                let uid = (0, hashUrl_1.hashUrl)(url);
                console.log("uid :", uid);
                yield page.close();
                for (let index = 0; index < chunk.length; index++) {
                    const text = chunk[index];
                    // let embed = await embedding.embedDocuments([text]);
                    // collection = await db.ensureCollection()
                    // console.log("embed :", embed);
                    // console.log("\n\n\n");
                    let id = `${uid}-${index}`;
                    let metaData = { "souorce": url };
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
                process_url.push(url);
                // update the status and chunk size
                const docRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}/trained_data/${uid}`);
                yield (0, firestore_1.updateDoc)(docRef, {
                    status: "trained",
                    chunk_size: chunk.length,
                });
                if (index + 1 === urls.length)
                    yield (0, firestore_1.updateDoc)(chatRef, {
                        status: "trained"
                    });
                // docs.push(new Document({ pageContent: data!, metadata: metaData }))
            }
            catch (error) {
                error = error;
                console.log("error in embedding the url due to : ", error);
                let uid = (0, hashUrl_1.hashUrl)(url);
                const docRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}/trained_data/${uid}`);
                yield (0, firestore_1.updateDoc)(docRef, {
                    status: "failed",
                    chunk_size: chunk.length,
                });
                error_url.push(url);
            }
            finally {
                browser.disconnect();
            }
            if (index + 1 === urls.length) {
                yield (0, firestore_1.updateDoc)(chatRef, {
                    status: "trained"
                });
                if (process_url.length > urls.length / 2 && urls.length != 1) {
                    (0, resend_1.sendMail)(userId, "Chatbot is Ready 🚀", `Your chat is Ready <br><br> Try it out right now at <a href=https://www.webbotify.com/tryout/${chatbotId} >link</a>`);
                }
            }
        }
    }
    catch (error) {
        error = error;
        console.log("error in embeding url due to :", error);
        throw error;
    }
    finally {
        if (process_url.length < urls.length / 2) {
            yield (0, resend_1.sendMail)(userId, "WebBotify Embedding Failed", `the Embedding for ChatBot of with ID ${chatbotId} faild due to some circumtances, <br><br> please visit <a href=https://www.webbotify.com/chatbots/${chatbotId}/link >Webbotify </a> to restrain your url <br> if the error still continues, please let us know we are Happy you help you out with anything`);
            yield (0, resend_1.sendMail)(process.env.SEND_MAIL_TO, "Embedding Failed", `Embedding Fail for <br> url = ${urls} <br><br> chatbot Id = ${chatbotId} <br><br> with error message ${error}`);
        }
    }
    // browser.close()
    console.log("done");
    return { docs, error_url };
});
exports.createEmbedding = createEmbedding;
const deleteEmbedding = (urls, chatbotId) => __awaiter(void 0, void 0, void 0, function* () {
    let collection;
    // let embedding = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
    try {
        const embedder = new chromadb_1.OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY);
        let client = new chromadb_1.ChromaClient(process.env.DB_URL);
        collection = yield client.getOrCreateCollection(chatbotId, {}, embedder);
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error;
    }
    for (let index = 0; index < urls.length; index++) {
        const url = urls[index];
        const uid = (0, hashUrl_1.hashUrl)(url);
        console.log("uid :", uid, url);
        // get the chunk size from the firestore
        let chunkSize = 1;
        let ids = [];
        for (let index = 0; index < chunkSize; index++) {
            ids.push(`${uid}-${index}`);
        }
        console.log("ids :", ids);
        let r = yield collection.delete(ids);
        console.log("result : ", r);
        const urlRef = (0, firestore_1.doc)(firebase_1.db, `chatbots/${chatbotId}/trained_data/${uid}`);
        yield (0, firestore_1.deleteDoc)(urlRef);
    }
});
exports.deleteEmbedding = deleteEmbedding;
// export const embeddingData = async (process_data: any[], collectionName: string) => {
//     let db;
//     let collection;
//     let embedding = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
//     try {
//         // db = new Chroma(embedding, {
//         //     collectionName,
//         //     url: `http://${process.env.DB_HOST}:${process.env.DB_PORT}`
//         // })
//         const embedder = new OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY!)
//         let client = new ChromaClient(`http://${process.env.DB_HOST}:${process.env.DB_PORT}`)
//         collection = await client.getOrCreateCollection(collectionName, {}, embedder)
//     }
//     catch (error) {
//         console.log("unable to initial Db connection due to :", error);
//         throw error
//     }
//     let texts = []
//     let metaData = []
//     let ids = []
//     for (let index = 0; index < process_data.length; index++) {
//         const doc = process_data[index];
//         texts.push(doc['text'])
//         ids.push(doc['id'])
//         metaData.push({ 'source': doc['source'] })
//     }
//     let embed = await embedding.embedDocuments(texts)
//     // collection = await db.ensureCollection()
//     await collection.add(ids, embed, metaData, texts)
//     // console.log("data :", await collection.count());
//     return "sucess create vector store"
// }
const addUrlsToDb = (urls, chatbotId) => __awaiter(void 0, void 0, void 0, function* () {
    let data = [];
    let promise = urls.map((url) => __awaiter(void 0, void 0, void 0, function* () {
        const uid = (0, hashUrl_1.hashUrl)(url);
        const docRef = (0, firestore_1.doc)(firebase_1.db, `/chatbots/${chatbotId}/trained_data/${uid}`);
        let urlObj = {
            id: uid,
            status: "pending",
            type: "WEB",
            source: url,
            created_at: new Date(),
            updated_at: new Date()
        };
        yield (0, firestore_1.setDoc)(docRef, urlObj);
        data.push(urlObj);
    }));
    yield Promise.all(promise);
    return data;
});
exports.addUrlsToDb = addUrlsToDb;
