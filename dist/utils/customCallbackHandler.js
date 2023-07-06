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
exports.MyCallbackHandler = void 0;
const callbacks_1 = require("langchain/callbacks");
class MyCallbackHandler extends callbacks_1.BaseCallbackHandler {
    constructor(s) {
        super();
        this.name = "MyCallbackHandler";
        this.send = s;
    }
    ;
    handleLLMNewToken(token, runId, parentRunId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.send.write(`data: ${JSON.stringify(token)}\n\n`);
        });
    }
    handleChainError(err, runId, parentRunId) {
    }
}
exports.MyCallbackHandler = MyCallbackHandler;
