import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from "cors"
import embeddingRoute from './routers/embedding';
import queryRouter from './routers/query';
import getUrlsRouter from './routers/get_urls';
import delay from './utils/delay';
import chatRouter from './routers/chat';
import dns from "dns"
import trainFullBotRouter from './routers/train-full-bot';
import { rateLimiterMiddleware } from './utils/rate-limiter';
// import aiService from './services/ai_model';
dotenv.config();


dns.setDefaultResultOrder("ipv4first")

const app: Express = express();


app.use(cors({
  origin: '*'
}));

app.use(rateLimiterMiddleware)


app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(express.json())

const port = process.env.PORT || 3000;

app.use(queryRouter)
app.use(embeddingRoute)
app.use(getUrlsRouter)
app.use(chatRouter)
app.use(trainFullBotRouter)

app.get('/', async (req: Request, res: Response) => {
  // await chatbot("query", "flutter-ui-dev")
  // try {
  //   let d = await fetch("https://db.webbotify.com")
  //   console.log("got a resonspe :", d);

  // } catch (error) {
  //   console.log("erorr :", error);

  // }

  // await loadModel()


  // await aiService.runQuery("", [])



  res.send('Express + TypeScript Server');

});

app.listen(port, async () => {
  console.log(`⚡️[server]: Server with https is running at http://localhost:${port} ⚡`);
});