import express, { Request, Response } from "express"
import chatbot from "../utils/chatbot";
import delay from "../utils/delay";
import { error } from "console";

const queryRouter = express.Router()

queryRouter.get("/test-query", async (req: Request, res: Response) => {
    let resText = "Flutter is an open-source mobile application development framework created by Google. It allows developers to build high-quality native interfaces for both Android and iOS platforms using a single codebase. Flutter uses the Dart programming language and has a rich set of pre-built widgets and tools to simplify the development process."
    const { query, id } = req.query as any
    // let query = "what is flutter"
    // let collectionName = "flutter-ui-dev"

    res.writeHead(200, {
        'Cache-Control': 'no-cache',
        "Connection": 'keep-alive',
        'Content-Type': 'text/event-stream',
        "Access-Control-Allow-Origin": "*",
    });


    // await chatbot(query, id, res)
    let token = resText.split(" ")

    for (let index = 0; index < token.length; index++) {
        const element = token[index];
        await delay(200)

        res.write(`data: ${element}\n\n`)

    }


    res.end();
    console.log("ended");

})

queryRouter.get("/query", async (req: Request, res: Response) => {
    const { query, id, sessionId } = req.query as any
    // let query = "what in the complete one+"
    let chatbotId = id
    const s = req.query

    try {

        res.writeHead(200, {
            'Cache-Control': 'no-cache',
            "Connection": 'keep-alive',
            'Content-Type': 'text/event-stream',
            "Access-Control-Allow-Origin": "*",
        });

        await chatbot(query, chatbotId, res, sessionId)

    } catch (error) {
        console.log("unable to query due to :", error);
        res.write(`error: unable to query due to ${error}`)
        // res.status(500).send(`unable to query due to : ${error}`)
    } finally {
        res.end();
    }

    console.log("ended");

})

export default queryRouter