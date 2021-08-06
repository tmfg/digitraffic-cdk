import {MonitoredApp} from '../../app-props';
import {SecretsManager} from 'aws-sdk';
import {UpdateStatusSecret} from "../../secret";
import {NodePingApi} from '../../api/nodeping';
import {StatuspageApi} from '../../api/statuspage';
import * as StatusService from '../../service/status';
import {DigitrafficApi} from "../../api/digitraffic";

const smClient = new SecretsManager({
    region: process.env.AWS_REGION
});

const apps = JSON.parse(process.env.APPS as string) as MonitoredApp[];

export const handler = async (): Promise<any> => {
    const secretObj = await smClient.getSecretValue({
        SecretId: process.env.SECRET_ARN as string
    }).promise();
    if (!secretObj.SecretString) {
        throw new Error('No secret found!');
    }
    const secret: UpdateStatusSecret = JSON.parse(secretObj.SecretString);
    const digitrafficApi = new DigitrafficApi();
    const statuspageApi = new StatuspageApi(secret.statuspagePageId, secret.statuspageApiKey);
    const nodePingApi = new NodePingApi(secret.nodePingToken, secret.nodepingSubAccountId);

    await StatusService.updateComponentsAndChecks(apps, digitrafficApi, statuspageApi, nodePingApi, secret);
}
