import {MonitoredApp} from '../../app-props';
import {SecretsManager} from 'aws-sdk';
import {UpdateStatusSecret} from "../../secret";
import {NodePingApi} from '../../api/nodeping';
import {StatuspageApi} from '../../api/statuspage';
import * as StatusService from '../../service/status';
import {DigitrafficApi} from "../../api/digitraffic";
import {StatusEnvKeys} from "../../keys";

const smClient = new SecretsManager({
    region: process.env.AWS_REGION,
});

const secretId = process.env[StatusEnvKeys.SECRET_ID] as string;
const apps = JSON.parse(process.env[StatusEnvKeys.APPS] as string) as MonitoredApp[];
const checkTimeout = Number(process.env[StatusEnvKeys.CHECK_TIMEOUT_SECONDS]);
const checkInterval = Number(process.env[StatusEnvKeys.INTERVAL_MINUTES]);

export const handler = async (): Promise<any> => {
    const secretObj = await smClient.getSecretValue({
        SecretId: secretId,
    }).promise();
    if (!secretObj.SecretString) {
        throw new Error('No secret found!');
    }
    if (!checkTimeout) {
        throw new Error('Check timeout not set');
    }
    if (!checkInterval) {
        throw new Error('Check timeout not set');
    }
    const secret: UpdateStatusSecret = JSON.parse(secretObj.SecretString);
    const digitrafficApi = new DigitrafficApi();
    const statuspageApi = new StatuspageApi(secret.statuspagePageId, secret.statuspageApiKey);
    const nodePingApi = new NodePingApi(secret.nodePingToken, secret.nodepingSubAccountId, checkTimeout, checkInterval);

    await StatusService.updateComponentsAndChecks(
        apps, digitrafficApi, statuspageApi, nodePingApi, secret,
    );
};
