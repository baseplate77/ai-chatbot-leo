// import puppeteer from "puppeteer"
import { TokenTextSplitter } from "langchain/text_splitter";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb"
import { hashUrl } from "./hashUrl";
import { db } from "../services/firebase";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { blockResourceRequest, puppeteer } from "./puppeteer_helper";
import { sendMail } from "../services/resend";



export const customKnwoledgeEmbed = async (data: string, chatbotId: string) => {

    let collection: any;
    try {
        const embedder = new OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY!)

        let client = new ChromaClient(process.env.DB_URL)
        collection = await client.getOrCreateCollection(chatbotId, {}, embedder)
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error

    }

    const textSplitter = new TokenTextSplitter({
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

        let chunk: string[] = []

        try {

            chunk = await textSplitter.splitText(data!);
            let uid = hashUrl(data);
            console.log("uid :", uid);


            for (let index = 0; index < chunk.length; index++) {
                const text = chunk[index];
                let id = `${uid}-${index}`;
                let metaData = { "souorce": "" }
                await collection.add(id, undefined, metaData, text)

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
        } catch (error) {
            error = error
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



    } catch (error) {
        error = error
        console.log("error in embeding url due to :", error);
        throw error
    }


}

export const createEmbedding = async (urls: string[], chatbotId: string, userId: string) => {

    let collection: any;
    let error: any;
    try {
        const embedder = new OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY!)

        let client = new ChromaClient(process.env.DB_URL)
        collection = await client.getOrCreateCollection(chatbotId, {}, embedder)
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error

    }
    // const browser = await puppeteer.launch({
    //     executablePath: '/usr/bin/google-chrome',
    //     headless: "new",
    //     args: ['--no-sandbox', "--disable-gpu",]
    // })


    let process_url: string[] = []
    let error_url: string[] = []
    let docs: any[] = []
    let chunk: string[] = []

    const textSplitter = new TokenTextSplitter({
        encodingName: 'cl100k_base',
        chunkSize: 500,
        chunkOverlap: 20,
        disallowedSpecial: [],
        // separators: ['\n\n', '\n', ' ', '']
    });

    const chatRef = doc(db, `/chatbots/${chatbotId}`);

    await updateDoc(chatRef, {
        status: "pending"
    })

    try {
        for (let index = 0; index < urls.length; index++) {
            const url = urls[index];

            console.log("processing ", url);


            const browser = await puppeteer.connect({ browserWSEndpoint: `ws:${process.env.LEO_CHORME_PORT_3000_TCP_ADDR}:${process.env.LEO_CHORME_SERVICE_PORT_HTTP}`, ignoreHTTPSErrors: true, protocolTimeout: 0, })

            // const browser = await puppeteer.connect({ browserWSEndpoint: `ws:localhost:3002`, ignoreHTTPSErrors: true, protocolTimeout: 0, })

            try {
                const page = await browser.newPage();
                await blockResourceRequest(page)
                page.setDefaultNavigationTimeout(0)
                await page.goto(url, { timeout: 0, waitUntil: ["domcontentloaded", "load"] });

                let b = await page.waitForSelector('body', { timeout: 120000 })

                if ((await page.title()).includes("404"))
                    throw '404; page not found';

                let data = await b?.evaluate((e: any) => e.innerText);
                console.log("data :", data);

                if (data == null)
                    throw "unable to fetch data";

                chunk = await textSplitter.splitText(data!);
                let uid = hashUrl(url);
                console.log("uid :", uid);

                await page.close();

                for (let index = 0; index < chunk.length; index++) {
                    const text = chunk[index];
                    // let embed = await embedding.embedDocuments([text]);
                    // collection = await db.ensureCollection()
                    // console.log("embed :", embed);
                    // console.log("\n\n\n");


                    let id = `${uid}-${index}`;
                    let metaData = { "souorce": url }
                    // await collection.add(id, embed[0], metaData, text)
                    collection.createIndex
                    await collection.add(id, undefined, metaData, text)

                    docs.push({
                        id,
                        text,
                        // "embed": embed[0],
                        metaData,
                    })

                    console.log("chunk: ", index);


                }
                process_url.push(url)
                // update the status and chunk size
                const docRef = doc(db, `/chatbots/${chatbotId}/trained_data/${uid}`);
                await updateDoc(docRef, {
                    status: "trained",
                    chunk_size: chunk.length,
                });
                if (index + 1 === urls.length)
                    await updateDoc(chatRef, {
                        status: "trained"
                    })
                // docs.push(new Document({ pageContent: data!, metadata: metaData }))
            } catch (error) {
                error = error
                console.log("error in embedding the url due to : ", error);
                let uid = hashUrl(url);
                const docRef = doc(db, `/chatbots/${chatbotId}/trained_data/${uid}`);
                await updateDoc(docRef, {
                    status: "failed",
                    chunk_size: chunk.length,
                });
                error_url.push(url);
            } finally {
                browser.disconnect();
            }
            if (index + 1 === urls.length) {
                await updateDoc(chatRef, {
                    status: "trained"
                })
                if (process_url.length > urls.length / 2 && urls.length != 1) {
                    sendMail(userId, "Chatbot is Ready 🚀", `Your chat is Ready <br><br> Try it out right now at <a href=https://www.webbotify.com/tryout/${chatbotId} >link</a>`)
                }
            }


        }
    } catch (error) {
        error = error
        console.log("error in embeding url due to :", error);
        throw error
    } finally {
        if (process_url.length < urls.length / 2) {
            await sendMail(userId, "WebBotify Embedding Failed", `the Embedding for ChatBot of with ID ${chatbotId} faild due to some circumtances, <br><br> please visit <a href=https://www.webbotify.com/chatbots/${chatbotId}/link >Webbotify </a> to restrain your url <br> if the error still continues, please let us know we are Happy you help you out with anything`)
            await sendMail(process.env.SEND_MAIL_TO!, "Embedding Failed", `Embedding Fail for <br> url = ${urls} <br><br> chatbot Id = ${chatbotId} <br><br> with error message ${error}`)
        }
    }

    console.log("done");

    return { docs, error_url }
}

export const deleteEmbedding = async (urls: string[], chatbotId: string) => {

    let collection;
    // let embedding = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
    try {
        const embedder = new OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY!)

        let client = new ChromaClient(process.env.DB_URL)
        collection = await client.getOrCreateCollection(chatbotId, {}, embedder)
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error
    }

    for (let index = 0; index < urls.length; index++) {
        const url = urls[index];
        const uid = hashUrl(url)

        console.log("uid :", uid, url);

        // get the chunk size from the firestore

        let chunkSize = 1;
        let ids: string[] = []
        for (let index = 0; index < chunkSize; index++) {
            ids.push(`${uid}-${index}`)
        }
        console.log("ids :", ids);

        let r = await collection.delete(ids)

        console.log("result : ", r);

        const urlRef = doc(db, `chatbots/${chatbotId}/trained_data/${uid}`)
        await deleteDoc(urlRef)

    }


}


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


export const addUrlsToDb = async (urls: string[], chatbotId: string) => {

    let data: any[] = []

    let promise = urls.map(async (url) => {
        const uid = hashUrl(url)
        const docRef = doc(db, `/chatbots/${chatbotId}/trained_data/${uid}`)

        let urlObj = {

            id: uid,
            status: "pending",
            type: "WEB",
            source: url,
            created_at: new Date(),
            updated_at: new Date()
        }
        await setDoc(docRef, urlObj)

        data.push(urlObj);
    })
    await Promise.all(promise)
    return data;

}