import { BaseCallbackHandler } from "langchain/callbacks";
import { Sender } from "./chatbot";
import { Response } from "express";
export class MyCallbackHandler extends BaseCallbackHandler {
    name = "MyCallbackHandler";
    send?: Response;
    constructor(s: any) {
        super();
        this.send = s
    };
    async handleLLMNewToken(token: string, runId: string, parentRunId?: string | undefined): Promise<void> {
        this.send!.write(`data: ${JSON.stringify(token)}\n\n`)

    }
    handleChainError(err: any, runId: string, parentRunId?: string | undefined): void | Promise<void> {

    }
    //   async handleChainStart(chain: { name: string }) {
    //     console.log(`Entering new ${chain.name} chain...`);
    //   }

    //   async handleChainEnd(_output: ChainValues) {
    //     console.log("Finished chain.");
    //   }

    //   async handleAgentAction(action: AgentAction) {
    //     console.log(action.log);
    //   }

    //   async handleToolEnd(output: string) {
    //     console.log(output);
    //   }

    //   async handleText(text: string) {
    //     console.log(text);
    //   }

    //   async handleAgentEnd(action: AgentFinish) {
    //     console.log(action.log);
    //   }
}