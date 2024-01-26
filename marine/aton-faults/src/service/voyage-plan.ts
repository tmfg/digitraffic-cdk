import type { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import * as FaultsService from "./faults.js";
import * as WarningsService from "./warnings.js";
import type { SQS, SendMessageCommandOutput } from "@aws-sdk/client-sqs";
import { S124Type, type SendS124Event } from "../model/upload-voyageplan-event.js";
export class VoyagePlanService {
    private readonly sqs: SQS;
    private readonly callbackEndpoint: string;
    private readonly sendS124QueueUrl: string;

    constructor(sqs: SQS, callbackEndpoint: string, sendS124QueueUrl: string) {
        this.sqs = sqs;
        this.callbackEndpoint = callbackEndpoint;
        this.sendS124QueueUrl = sendS124QueueUrl;
    }

    async handleVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<void> {
        await this.sendFaultsForVoyagePlan(voyagePlan);
        await this.sendWarningsForVoyagePlan(voyagePlan);
    }

    private async sendFaultsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<void> {
        const faultIds = await FaultsService.findFaultIdsForVoyagePlan(voyagePlan);

        logger.info({
            method: "VoyagePlanService.sendFaultsForVoyagePlan",
            customCount: faultIds.length
        });

        for (const id of faultIds) {
            await this.sendSqs(this.sendS124QueueUrl, {
                type: S124Type.FAULT,
                id,
                callbackEndpoint: this.callbackEndpoint
            });
        }

        return Promise.resolve();
    }

    private async sendWarningsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<void> {
        const warnings = await WarningsService.findWarningsForVoyagePlan(voyagePlan);

        if (warnings?.features) {
            logger.info({
                method: "VoyagePlanService.sendWarningsForVoyagePlan",
                customCount: warnings.features.length
            });

            for (const feature of warnings.features) {
                await this.sendSqs(this.sendS124QueueUrl, {
                    type: S124Type.WARNING,
                    id: feature.properties.id,
                    callbackEndpoint: this.callbackEndpoint
                });
            }
        }
    }

    private sendSqs(
        QueueUrl: string,
        event: SendS124Event
    ): Promise<SendMessageCommandOutput> {
        return this.sqs
            .sendMessage({
                MessageBody: JSON.stringify(event),
                QueueUrl
            });
    }
}
