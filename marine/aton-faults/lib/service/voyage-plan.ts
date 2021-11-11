import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import * as FaultsService from "./faults";
import * as WarningsService from "./warnings";
import {SQS} from "aws-sdk";
import {S124Type, SendS124Event} from "../model/upload-voyageplan-event";

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

    private async sendFaultsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<any> {
        const faultIds = await FaultsService.findFaultIdsForVoyagePlan(voyagePlan);

        console.info("sending %d faults", faultIds.length);

        for (const id of faultIds) {
            await this.sendSqs(this.sendS124QueueUrl, {
                type: S124Type.FAULT,
                id,
                callbackEndpoint: this.callbackEndpoint
            });
        }

        return Promise.resolve('');
    }

    private async sendWarningsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<any> {
        const warnings = await WarningsService.findWarningsForVoyagePlan(voyagePlan);

        if(warnings && warnings.features) {
            console.info("sending %d warnings", warnings.features.length);

            for (const feature of warnings.features) {
                await this.sendSqs(this.sendS124QueueUrl, {
                    type: S124Type.WARNING,
                    id: feature.properties.id,
                    callbackEndpoint: this.callbackEndpoint
                });
            }
        }
    }

    private sendSqs(QueueUrl: string, event: SendS124Event): Promise<any> {
        return this.sqs.sendMessage({
            MessageBody: JSON.stringify(event),
            QueueUrl
        }).promise();
    }
}
