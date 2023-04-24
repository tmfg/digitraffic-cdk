import { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import * as FaultsService from "./faults";
import * as WarningsService from "./warnings";
import { AWSError, SQS } from "aws-sdk";
import { S124Type, SendS124Event } from "../model/upload-voyageplan-event";
import { PromiseResult } from "aws-sdk/lib/request";
import { SendMessageResult } from "aws-sdk/clients/sqs";

export class VoyagePlanService {
    private readonly sqs: SQS;
    private readonly callbackEndpoint: string;
    private readonly sendS124QueueUrl: string;

    constructor(sqs: SQS, callbackEndpoint: string, sendS124QueueUrl: string) {
        this.sqs = sqs;
        this.callbackEndpoint = callbackEndpoint;
        this.sendS124QueueUrl = sendS124QueueUrl;
    }

    async handleVoyagePlan(voyagePlan: RtzVoyagePlan) {
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
                    id: feature.properties?.id as number,
                    callbackEndpoint: this.callbackEndpoint
                });
            }
        }
    }

    private sendSqs(
        QueueUrl: string,
        event: SendS124Event
    ): Promise<PromiseResult<SendMessageResult, AWSError>> {
        return this.sqs
            .sendMessage({
                MessageBody: JSON.stringify(event),
                QueueUrl
            })
            .promise();
    }
}
