import express, { Request, Response } from "express";
import { puppeteer, blockResourceRequest } from "../utils/puppeteer_helper";
import delay from "../utils/delay";
import { hashUrl } from "../utils/hashUrl";
import { arrayUnion, doc, increment, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { TokenTextSplitter } from "langchain/text_splitter";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { generateChatbotId } from "../utils/generateChatbotID";


const trainFullBotRouter = express.Router()


trainFullBotRouter.post("/train-full-bot", async (req: Request, res: Response) => {
    let { url, name } = req.body

    try {

        let chatBotId = await createChatBOT(name)
        handleBotTraining(url, chatBotId);
        await delay(1000)
        res.send({ chatBotId })
    } catch (error) {
        console.log("faile to start the trainning of bot for  url :", url, " due to :", error);

        res.status(500).send(`unable to start training of bot for url : ${url} due to : ${error}`)

    }

})


const createChatBOT = async (name: string) => {
    let chatBotId = generateChatbotId()
    let userId = "flutteruidevofficial@gmail.com"
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
            systemPrompt:
                "",
            userPrompt:
                ""
        },
        botConfig: {
            name: name ?? "",
            welcomeMsg: "Hi, How can i assist you?",
            primaryColor: "#5F58DF",
            botIcon:
                "https://firebasestorage.googleapis.com/v0/b/ai-chatbot-f2048.appspot.com/o/Group.png?alt=media&token=2fa0617f-40e8-47cd-9cbd-61665e3167be",
        },
    };

    try {

        const docRef = doc(db, `/chatbots/${chatBotId}`)
        const userRef = doc(db, `/users/${userId}`)
        await Promise.all([
            setDoc(docRef, defaultBotDetail, { merge: true }),
            setDoc(userRef, {
                chatbots: arrayUnion({ name, id: chatBotId })
            }, { merge: true })
        ])

        return chatBotId
    } catch (error) {
        console.log("unable to create chatbot due to firebase :", error);
        throw `unable to create a chatbot due to firebase : ${error}`
    }


}

const handleBotTraining = async (url: string, chatbotId: string, limit: number = 999, requestLimit: number = 999,) => {
    var startTime = performance.now()

    let collection;
    // let chatbotId = "714812219995170139452714"
    try {
        const embedder = new OpenAIEmbeddingFunction(process.env.OPENAI_API_KEY!)
        let client = new ChromaClient(process.env.DB_URL)
        collection = await client.getOrCreateCollection(chatbotId, {}, embedder)
    }
    catch (error) {
        console.log("unable to initial Db connection due to :", error);
        throw error
    }


    const localUrl = new Set()
    const processUrl: string[] = []
    let requestNoTracker = 0;
    let tnumber = 0;

    let urlQueue = [url]

    let u = new URL(url)
    let domainUrl = u.hostname?.split(".").slice(-2).join(".");

    console.log("domain :", domainUrl);

    // const browser = await puppeteer.launch({
    //     executablePath: '/usr/bin/google-chrome',
    //     devtools: false,
    //     headless: "new",
    //     args: ['--no-sandbox', "--disable-gpu",]
    // })
    const browser = await puppeteer.connect({ browserWSEndpoint: `ws:${process.env.LEO_CHORME_PORT_3000_TCP_ADDR}:${process.env.LEO_CHORME_SERVICE_PORT_HTTP}`, ignoreHTTPSErrors: true, protocolTimeout: 90000 })

    let error_url = []
    let docs: any[] = []
    let chunk: string[] = []

    const textSplitter = new TokenTextSplitter({
        encodingName: 'cl100k_base',
        chunkSize: 500,
        chunkOverlap: 20,
        disallowedSpecial: [],
        // separators: ['\n\n', '\n', ' ', '']
    });


    while (urlQueue.length !== 0) {
        const page = await browser.newPage();
        tnumber++;
        let cUrl = urlQueue.shift()
        try {
            await blockResourceRequest(page)

            await page.goto(cUrl!, { timeout: 90000, waitUntil: ["domcontentloaded"] });

            let b = await page.waitForSelector('body', { timeout: 120000, })
            if ((await page.title()).includes("404"))
                throw '404; page not found';
            let data: string | undefined = await b?.evaluate((e) => e.innerText);
            console.log("data :", data);

            if (data == null)
                throw "unable to fetch data";

            // get all the avilable URL 

            await page.waitForSelector("a", { timeout: 120000 })


            let a = await page.$$("a")
            let promise = a.map(async (el) => {
                let url = await el.evaluate(e => e.href)
                let text = await el.evaluate(e => e.innerText)
                console.log(text, url);
                data = data!.replace(text, `[${text}](${url})`)

                if (url === "" || !url.includes(domainUrl)) return
                try {
                    let u = new URL(url)
                    let newUrl = u.origin + u.pathname
                    // console.log("urls : ", newUrl);

                    if (u.hostname.includes(domainUrl)) {
                        localUrl.add(newUrl)
                    }

                    if (u.hostname.includes(domainUrl) && localUrl.size < limit && requestNoTracker < requestLimit) {
                        // console.log("local url size :", localUrl.size);
                        if (!processUrl.includes(newUrl) && !["/signup", "/login"].some(route => newUrl.includes(route))) {
                            // cluster.queue(newUrl)
                            urlQueue.push(newUrl)
                            processUrl.push(newUrl)
                            requestNoTracker++;
                        }
                    }
                } catch (error) {
                    console.log("invaild Url :", url, error);

                }
            })

            await Promise.all(promise)
            // get all the Data of the url


            chunk = await textSplitter.splitText(data!);
            let uid = hashUrl(cUrl!);

            console.log("uid :", uid, cUrl, tnumber);

            await page.close();

            for (let index = 0; index < chunk.length; index++) {
                const text = chunk[index];
                // let embed = await embedding.embedDocuments([text]);
                // collection = await db.ensureCollection()
                // console.log("embed :", embed);
                // console.log("\n\n\n");


                let id = `${uid}-${index}`;
                let metaData = { "souorce": cUrl }
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
            // update the status and chunk size
            const docRef = doc(db, `/chatbots/${chatbotId}/trained_data/${uid}`);
            const chatbotRef = doc(db, `/chatbots/${chatbotId}`)
            await Promise.all([
                setDoc(docRef, {
                    status: "trained",
                    chunk_size: chunk.length,
                    id: uid,
                    type: "WEB",
                    source: cUrl,
                    created_at: new Date(),
                    updated_at: new Date()
                }, { merge: true }),

                setDoc(chatbotRef, {
                    totalLinks: increment(1)
                }, { merge: true })
            ])

            // if (index + 1 === urls.length)
            //     await updateDoc(chatRef, {
            //         status: "trained"
            //     })

            // docs.push(new Document({ pageContent: data!, metadata: metaData }))
        } catch (error) {
            console.log("error in scrapying the url due to : ", error);
            let uid = hashUrl(url);
            const docRef = doc(db, `/chatbots/${chatbotId}/trained_data/${uid}`);
            await setDoc(docRef, {
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


    browser.disconnect()

    var endTime = performance.now()

    console.log(`traning this bot  took ${(endTime - startTime) / 1000} seconds`)
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
}


export default trainFullBotRouter