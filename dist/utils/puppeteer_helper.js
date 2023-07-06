"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.blockResourceRequest = exports.puppeteerClusterCrwaler = exports.puppeteer = void 0;
const puppeteer_1 = __importStar(require("puppeteer"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const puppeteer_extra_plugin_recaptcha_1 = __importDefault(require("puppeteer-extra-plugin-recaptcha"));
const puppeteer_extra_plugin_adblocker_1 = __importDefault(require("puppeteer-extra-plugin-adblocker"));
const puppeteer_extra_1 = require("puppeteer-extra");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mockPng = fs_1.default.readFileSync(path_1.default.join(__dirname, "..", "..", 'mock.png')).toString("base64");
const puppeteer = (0, puppeteer_extra_1.addExtra)(puppeteer_1.default);
exports.puppeteer = puppeteer;
puppeteer.use((0, puppeteer_extra_plugin_stealth_1.default)());
puppeteer.use((0, puppeteer_extra_plugin_recaptcha_1.default)());
puppeteer.use((0, puppeteer_extra_plugin_adblocker_1.default)({
    // blockTrackers: true,
    interceptResolutionPriority: puppeteer_1.DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
}));
const blocked_domains = [
    'googlesyndication.com',
    'adservice.google.com',
];
const blockResourceRequest = (page) => __awaiter(void 0, void 0, void 0, function* () {
    // await page.setRequestInterception(true)
    // page.on('request', request => {
    //   const url = request.url().toLowerCase();
    //   const resourceType = request.resourceType();
    //   // console.log("type :", resourceType);
    //   if (
    //     resourceType === 'media' ||
    //     resourceType === "image" ||
    //     resourceType === "other" ||
    //     // resourceType === "xhr" ||
    //     // resourceType === "stylesheet" ||
    //     resourceType === "font" ||
    //     url.endsWith('.mp4') ||
    //     url.endsWith('.avi') ||
    //     url.endsWith('.flv') ||
    //     url.endsWith('.mov') ||
    //     url.endsWith('.wmv')
    //   ) {
    //     // console.log(`ABORTING: ${resourceType}`);
    //     // request.abort();
    //     request.respond({ status: 200, body: 'aborted' })
    //   } else if (blocked_domains.some(domain => url.includes(domain))) {
    //     // console.log("AbORTIN : GOOGLE ADS SCRIPT");
    //     request.abort();
    //   }
    //   else {
    //     request.continue();
    //   }
    // });
    let client = yield page.target().createCDPSession();
    yield client.send('Network.setBlockedURLs', {
        urls: blocked_domains
    });
    yield client.send('Fetch.enable', {
        patterns: [
            {
                resourceType: 'Image',
                requestStage: 'Request'
            }
        ]
    });
    client.on('Fetch.requestPaused', (e) => __awaiter(void 0, void 0, void 0, function* () {
        client.send('Fetch.fulfillRequest', {
            requestId: e.requestId,
            responseCode: 200,
            body: mockPng
        });
    }));
    yield Promise.all([
        client.send('Console.disable'),
        client.send('ServiceWorker.disable'),
        client.send('CSS.disable'),
        client.send('Network.setBypassServiceWorker', { bypass: true }),
        client.send('Page.setBypassCSP', { enabled: true }),
    ]);
});
exports.blockResourceRequest = blockResourceRequest;
const puppeteerClusterCrwaler = (url, limit = 999, requestLimit = 4, getUrlCB) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const localUrl = new Set();
    const processUrl = [];
    let requestNoTracker = 0;
    let error_url = [];
    // new code 
    let u = new URL(url);
    let domainUrl = (_a = u.hostname) === null || _a === void 0 ? void 0 : _a.split(".").slice(-2).join(".");
    let urlQueue = [u.toString()];
    processUrl.push(u.toString());
    console.log("start ");
    // const browser = await puppeteer.launch({
    //   // executablePath: '/usr/bin/google-chrome',
    //   devtools: false,
    //   headless: true,
    //   args: [
    //     "--no-sandbox",
    //     "--disable-gpu",
    //     "--shm-size=1gb",
    //     '--disable-dev-shm-usage',
    //     '--no-zygote',
    //   ]
    // })
    // console.log(`browser url : ws:${process.env.LEO_CHORME_PORT_3000_TCP_ADDR}:${process.env.LEO_CHORME_SERVICE_PORT_HTTP}`);
    try {
        const browser = yield puppeteer.connect({ browserWSEndpoint: `ws:${process.env.LEO_CHORME_PORT_3000_TCP_ADDR}:${process.env.LEO_CHORME_SERVICE_PORT_HTTP}`, ignoreHTTPSErrors: true, protocolTimeout: 60000 });
        // const browser = await puppeteer.connect({ browserWSEndpoint: `ws:localhost:3002`, ignoreHTTPSErrors: true, protocolTimeout: 120000, })
        while (urlQueue.length !== 0) {
            let cUrl = urlQueue.shift();
            console.log("processing :", cUrl);
            try {
                const page = yield browser.newPage();
                yield blockResourceRequest(page);
                yield page.goto(cUrl, { timeout: 60000, waitUntil: ["domcontentloaded"] });
                yield page.waitForSelector("a", { timeout: 60000 });
                let a = yield page.$$("a");
                let promise = a.map((el) => __awaiter(void 0, void 0, void 0, function* () {
                    let url = yield el.evaluate(e => e.href);
                    if (url === "" || !url.includes(domainUrl))
                        return;
                    try {
                        let u = new URL(url);
                        let newUrl = u.origin + u.pathname;
                        if (u.hostname.includes(domainUrl)) {
                            if (getUrlCB)
                                getUrlCB(newUrl);
                            localUrl.add(newUrl);
                        }
                        if (u.hostname.includes(domainUrl) && localUrl.size < limit && requestNoTracker < requestLimit) {
                            if (!processUrl.includes(newUrl) && !["/signup", "/login"].some(route => newUrl.includes(route))) {
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
                yield page.close();
            }
            catch (error) {
                console.log("error in scrapying the url due to : ", error);
                error_url.push(url);
            }
        }
        console.log("************ END ***********");
        // await browser.close()
        yield browser.disconnect();
    }
    catch (error) {
        console.log("error in scrapying :", error);
        throw error;
    }
    return Array.from(localUrl);
    // const cluster = await Cluster.launch({
    //   concurrency: Cluster.CONCURRENCY_CONTEXT,
    //   maxConcurrency: 2,
    //   // monitor: true,
    //   skipDuplicateUrls: true,
    //   retryLimit: 0,
    //   retryDelay: 0,
    //   puppeteer,
    //   // timeout: 0,
    //   puppeteerOptions: {
    //     waitForInitialPage: true,
    //     headless: "new",
    //     devtools: false,
    //     // userDataDir: "./user_data",
    //     // executablePath: '/usr/bin/google-chrome',
    //     args: [
    //       "--no-sandbox",
    //       "--disable-gpu",
    //       "--shm-size=1gb",
    //       '--disable-dev-shm-usage',
    //       '--disable-setuid-sandbox',
    //       '--no-first-run',
    //       '--no-zygote',
    //       '--enable-blink-features=HTMLImports',
    //       // "--disable-features=AudioServiceOutOfProcess"
    //       // '--autoplay-policy=user-gesture-required',
    //       // '--disable-background-networking',
    //       // '--disable-background-timer-throttling',
    //       // '--disable-backgrounding-occluded-windows',
    //       // '--disable-breakpad',
    //       // '--disable-client-side-phishing-detection',
    //       // '--disable-component-update',
    //       // '--disable-default-apps',
    //       // '--disable-dev-shm-usage',
    //       // '--disable-domain-reliability',
    //       // '--disable-extensions',
    //       // '--disable-features=AudioServiceOutOfProcess',
    //       // '--disable-hang-monitor',
    //       // '--disable-ipc-flooding-protection',
    //       // '--disable-notifications',
    //       // '--disable-offer-store-unmasked-wallet-cards',
    //       // '--disable-popup-blocking',
    //       // '--disable-print-preview',
    //       // '--disable-prompt-on-repost',
    //       // '--disable-renderer-backgrounding',
    //       // '--disable-setuid-sandbox',
    //       // '--disable-speech-api',
    //       // '--disable-sync',
    //       // '--hide-scrollbars',
    //       // '--ignore-gpu-blacklist',
    //       // '--metrics-recording-only',
    //       // '--mute-audio',
    //       // '--no-default-browser-check',
    //       // '--no-first-run',
    //       // '--no-pings',
    //       // '--no-sandbox',
    //       // '--no-zygote',
    //       // '--password-store=basic',
    //       // '--use-gl=swiftshader',
    //       // '--use-mock-keychain',
    //     ],
    //     ignoreHTTPSErrors: true,
    //   }
    // });
    // try {
    //   await cluster.task(async ({ page, data: url }) => {
    //     console.log("processing url :", url);
    //     try {
    //       await page.setViewport({
    //         width: 1280,
    //         height: 720,
    //       });
    //       page.setDefaultNavigationTimeout(12000);
    //       await blockResourceRequest(page)
    //       await page.goto(url, { timeout: 120000, waitUntil: ['domcontentloaded'] });
    //       // await page.waitForSelector('.js-result', { visible: true })
    //       await page.waitForSelector("a", { timeout: 12000, visible: true })
    //       let a = await page.$$("a")
    //       let promise = a.map(async (el) => {
    //         let url = await el.evaluate(e => e.href)
    //         if (url === "" || !url.includes(domainUrl)) return
    //         try {
    //           let u = new URL(url)
    //           let newUrl = u.origin + u.pathname
    //           // let newUrl = u.toString()
    //           // console.log("urls : ", newUrl);
    //           if (u.hostname.includes(domainUrl)) {
    //             if (getUrlCB != undefined)
    //               getUrlCB(newUrl);
    //             localUrl.add(newUrl)
    //           }
    //           if (u.hostname.includes(domainUrl) && localUrl.size < limit && requestNoTracker < requestLimit) {
    //             // console.log("local url size :", localUrl.size);
    //             if (!processUrl.includes(newUrl) && !["/signup", "/login"].some(route => newUrl.includes(route))) {
    //               cluster.queue(u.toString())
    //               processUrl.push(newUrl)
    //               requestNoTracker++;
    //             }
    //           }
    //         } catch (error) {
    //           console.log("invaild Url :", url, error);
    //         }
    //       })
    //       await Promise.all(promise)
    //     } catch (error) {
    //       console.log("error in cluster task :", error);
    //     }
    //     // Store screenshot, do something else
    //   });
    //   let u = new URL(url)
    //   let domainUrl = u.hostname?.split(".").slice(-2).join(".");
    //   cluster.queue(u.toString());
    //   processUrl.push(url)
    //   await cluster.idle();
    //   await delay(100)
    //   await cluster.close();
    // } catch (error) {
    //   console.log("error in urlcrawler ", error);
    //   await cluster.close()
    //   throw error;
    // }
    // console.log("******************** ENDED *******************");
    // return Array.from(localUrl)
});
exports.puppeteerClusterCrwaler = puppeteerClusterCrwaler;
