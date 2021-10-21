import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import * as FaultsService from "./faults";
import * as WarningsService from "./warnings";
import * as S124Converter from "./s124-converter";
import {SNS} from "aws-sdk";
import {Builder} from "xml2js";
import {AtonSecret} from "../model/secret";
import {decodeBase64} from "digitraffic-common/js/js-utils";
import {sendWarnings} from "./vis-sender";

export class VoyagePlanService {
    private readonly sns: SNS;
    private readonly callbackEndpoint: string;
    private readonly sendFaultsSnsTopicArn: string;
    private readonly secret: AtonSecret;

    constructor(sns: SNS, callbackEndpoint: string, sendFaultsSnsTopicArn: string, secret: AtonSecret) {
        this.sns = sns;
        this.callbackEndpoint = callbackEndpoint;
        this.sendFaultsSnsTopicArn = sendFaultsSnsTopicArn;
        this.secret = secret;
    }

    async handleVoyagePlan(voyagePlan: RtzVoyagePlan) {
        await this.sendFaultsForVoyagePlan(voyagePlan);
        await this.sendWarningsForVoyagePlan(voyagePlan);
    }

    private async sendFaultsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<any> {
        const faultIds = await FaultsService.findFaultIdsForVoyagePlan(voyagePlan);

        console.info("sending %d faults", faultIds.length);

        for (const faultId of faultIds) {
            await this.sendSns(this.sendFaultsSnsTopicArn, JSON.stringify({
                faultId,
                callbackEndpoint: this.callbackEndpoint
            }));
        }

        return Promise.resolve('');
    }

    private async sendWarningsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<any> {
        const warnings = await WarningsService.findWarningsForVoyagePlan(voyagePlan);

        console.info("DEBUG warnings " + JSON.stringify(warnings, null, 2));

        if(warnings && warnings.features?.length > 0) {
            const s124 = S124Converter.convertWarnings(warnings.features);
            const xml = new Builder().buildObject(s124);

            await this.sendWarnings(xml);
        }
    }

    private async sendWarnings(xml: string): Promise<any> {
        console.info("DEBUG should send " + xml);

        if (this.secret?.certificate) {
            const clientCertificate = decodeBase64(this.secret.certificate);
            const privateKey = decodeBase64(this.secret.privatekey);
            const caCert = decodeBase64(this.secret.ca);

            await sendWarnings(xml, this.callbackEndpoint, caCert, clientCertificate, privateKey);
        } else {
            console.info("skipping sending, no certificate found");
        }
    }

    private sendSns(TopicArn: string, Message: string): Promise<any> {
        return this.sns.publish({
            Message,
            TopicArn
        }).promise();
    }
}
