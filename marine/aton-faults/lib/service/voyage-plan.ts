import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import * as FaultsService from "./faults";
import * as WarningsService from "./warnings";
import {SNS} from "aws-sdk";
import {AtonSecret} from "../model/secret";
import {S124Type, SendS124Event} from "../model/upload-voyageplan-event";

export class VoyagePlanService {
    private readonly sns: SNS;
    private readonly callbackEndpoint: string;
    private readonly sendFaultsSnsTopicArn: string;

    constructor(sns: SNS, callbackEndpoint: string, sendFaultsSnsTopicArn: string) {
        this.sns = sns;
        this.callbackEndpoint = callbackEndpoint;
        this.sendFaultsSnsTopicArn = sendFaultsSnsTopicArn;
    }

    async handleVoyagePlan(voyagePlan: RtzVoyagePlan) {
        await this.sendFaultsForVoyagePlan(voyagePlan);
        await this.sendWarningsForVoyagePlan(voyagePlan);
    }

    private async sendFaultsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<any> {
        const faultIds = await FaultsService.findFaultIdsForVoyagePlan(voyagePlan);

        console.info("sending %d faults", faultIds.length);

        for (const id of faultIds) {
            await this.sendSns(this.sendFaultsSnsTopicArn, {
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
                await this.sendSns(this.sendFaultsSnsTopicArn, {
                    type: S124Type.WARNING,
                    id: feature.properties.id,
                    callbackEndpoint: this.callbackEndpoint
                });
            }
        }
    }

    private sendSns(TopicArn: string, event: SendS124Event): Promise<any> {
        return this.sns.publish({
            Message: JSON.stringify(event),
            TopicArn
        }).promise();
    }
}
