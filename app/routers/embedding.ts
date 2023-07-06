import express, { Request, Response } from "express"
import { addUrlsToDb, createEmbedding, customKnwoledgeEmbed, deleteEmbedding } from "../utils/embedingHelper";
import { checkToken } from "../utils/checkToken";


const embeddingRoute = express.Router();

embeddingRoute.post("/embedding", checkToken, async (req: Request, res: Response) => {
    const { urls, chatbotId } = req.body

    console.log("embedding is called :", urls, chatbotId);

    try {

        let urlData = await addUrlsToDb(urls, chatbotId)

        res.send(urlData)

        console.log("embedding started");


        let { docs } = await createEmbedding(urls, chatbotId, (req as any).user)
        console.log("finish embedding :");
    }
    catch (error) {
        console.log("error in creating embedding due to :", error);
        res.status(500).send("unable to create embedding due to " + error)
    }

    // let result = await embeddingData(docs, collectionName)

})


embeddingRoute.post("/custom-knowledge-embedding", async (req: Request, res: Response) => {


    const { data, chatbotId } = req.body
    try {
        await customKnwoledgeEmbed(data, chatbotId)
        res.send("done")
    } catch (error) {

        console.log("error in custom knowledge embedding due to :", error);
        res.status(500).send("unable to custom knowledge embedding due to " + error)
    }
})

embeddingRoute.delete("/embedding", async (req: Request, res: Response) => {

    const { urls, chatbotId } = req.body;
    console.log(urls, chatbotId);

    try {

        await deleteEmbedding(urls, chatbotId)
        res.send({ sucess: true, error: false })
    } catch (error) {
        console.log("error in deleting Embedding :", error);
        res.status(500).send({ sucess: false, error: true })
    }

})


export default embeddingRoute