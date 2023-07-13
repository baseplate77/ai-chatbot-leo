import { OpenAIChat } from "langchain/llms/openai";

import { RetrievalQAChain } from "langchain/chains"
import { Chroma } from "langchain/vectorstores/chroma"
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MyCallbackHandler } from "./customCallbackHandler";
import { } from "langchain/tools"
import { Response } from "express";
import { getPromptTemplate, } from "./prompt"
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getModelTemperature } from "./getModelTemperature";
import { redisClient } from "./redisClient";


export type Sender = (chunk: any, callback?: ((error: Error | null | undefined) => void) | undefined) => boolean

const chatbot = async (query: string, chatbotId: string, send: Response, sessionId: string, chatInHistory = 3) => {
    console.log("connection to db");
    let chromadb, botSetting, chatbotDetails;
    try {
        chromadb = new Chroma(new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }), {
            collectionName: chatbotId,
            url: process.env.DB_URL,
        })


    } catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error
    }

    let chatHistory: any[] = []
    try {
        let startTime = new Date().getTime();

        let chatHistoryString = await redisClient.get(sessionId)

        if (chatHistoryString !== null)
            chatHistory = JSON.parse(chatHistoryString)

        console.log(chatHistory![0]);

        let endTime = new Date().getTime();
        console.log(`time taken ${(endTime - startTime) / 1000} seconds`);
    } catch (error) {
        console.log("failed to set entry in redis :", error);
    }

    let chat_history = "";

    chatHistory.forEach((chat) => {
        chat_history += `human:${chat['human']},\nAIMessage: ${chat['AIMessage']},\n`
    })

    console.log("Connected to db");


    try {
        const docRef = doc(db, `/chatbots/${chatbotId}`)
        chatbotDetails = ((await getDoc(docRef)).data() as any)
        botSetting = chatbotDetails !== undefined && chatbotDetails.setting
    } catch (error) {
        console.log("error in chatbot unble to fetch user define prompts so using default prompt due to :", error);
    }

    console.log("temperature :", getModelTemperature(botSetting !== undefined ? botSetting.botCreativity : "conservative"));

    const model = new OpenAIChat({ openAIApiKey: process.env.OPENAI_API_KEY, streaming: true, temperature: getModelTemperature(botSetting !== undefined ? botSetting.botCreativity : "conservative"), callbacks: [new MyCallbackHandler(send)], modelName: "gpt-3.5-turbo-0613" });
    console.log(chatbotDetails);

    let totalDoc = chatbotDetails.totalLinks ?? 1
    const d = RetrievalQAChain.fromLLM(model, chromadb.asRetriever(getKSearch(totalDoc)), {
        returnSourceDocuments: true,
        prompt: getPromptTemplate(chatbotDetails != undefined ? chatbotDetails.botConfig.name : "", botSetting != undefined ? botSetting.systemPrompt : "", botSetting !== undefined ? botSetting.userPrompt : "", chat_history),
        verbose: true,
    })



    const res = await d.call({
        query
    });

    // update chat Histroy
    if (chatHistory.length >= chatInHistory) {
        chatHistory.splice(0, 1)
    }
    chatHistory.push({
        human: query,
        AIMessage: res['text'],
    })

    try {
        redisClient.set(sessionId, JSON.stringify(chatHistory))
    } catch (error) {
        console.log("error in setting chatHistory :", error);

    }

    let sourceUrl: string[] = [];
    (res['sourceDocuments'] as any[]).forEach((d) => {
        sourceUrl.push(d.metadata['souorce'])

    })



    send.write(`data: [SOURCE_URL]${sourceUrl}[SOURCE_URL]\n\n`)
    console.log("response :", res['text']);

    return res

}

const getKSearch = (totalDocs: number) => {
    if (totalDocs >= 3)
        return 3
    else return totalDocs
}


export default chatbot