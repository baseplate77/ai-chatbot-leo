
import { puppeteerClusterCrwaler } from './puppeteer_helper';


// focus of this crawler is to give as many url as fast as possible, no need to give all url just give it fast
export const urlCrawler = async (url: string, limit: number = 99, requestLimit: number = 4) => {
    try {
        console.log("limit :", limit, requestLimit);

        let urls = await puppeteerClusterCrwaler(url, limit, requestLimit)
        return urls
    } catch (error) {
        console.log("error in urlCrawler, unable to crallwer due to :", error);
        throw `error in urlCrawler, fail to crawler due to : ${error}`
    }
}

export const streamUrlCrawler = async (url: string, res: any, limit: number = 99, requestLimit: number = 4) => {

    try {

        let urls = await puppeteerClusterCrwaler(url, limit, requestLimit, (newUrl) => {
            // console.log("newUrl :", newUrl);

            res.write(`data: ${newUrl}\n\n`)
        })
        return urls
    } catch (error) {

        console.log("error in streamUrlCrawler, unable to crallwer due to :", error);
        throw `error in streamUrlCrawler, fail to crawler due to : ${error}`
    }

}


