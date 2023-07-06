import express, { Request, Response } from "express"
import { streamUrlCrawler, urlCrawler } from "../utils/scrapy"
import fs from "fs"
const getUrlsRouter = express.Router()

getUrlsRouter.post("/get-all-urls", async (req: Request, res: Response) => {
    // const pageHTML = await axios.get("https://www.flutteruidev.tech/")
    // pageHTML.data
    let { url, requestLimit } = req.body

    try {

        let urls = await urlCrawler(url, undefined, requestLimit)

        res.send(urls)
    } catch (error) {
        console.log("error in fetch the url", url, " due to ", error);
        res.status(500).send([])

    }
})


getUrlsRouter.get("/s-get-all-urls", async (req: Request, res: Response) => {

    const { url, requestLimit } = req.query as any

    res.writeHead(200, {
        'Cache-Control': 'no-cache',
        "Connection": 'keep-alive',
        'Content-Type': 'text/event-stream',
        "Access-Control-Allow-Origin": "*",
    });

    try {
        let urls = await streamUrlCrawler(url, res, undefined, requestLimit)

    } catch (error) {

        console.log("unable to crawle the url due to :", error);
        res.write(`error: unable to crawle the url due to : ${error}`)
    } finally {
        res.end();
    }
})



export default getUrlsRouter