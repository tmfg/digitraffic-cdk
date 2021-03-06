import axios from 'axios';
import {SecretsManager} from 'aws-sdk';
import {UpdateStatusSecret} from "../../secret";

const NODEPING_API = 'https://api.nodeping.com/api/1';
const STATUSPAGE_URL = process.env.STATUSPAGE_URL as string;

// Lambda is intended to be run every minute so the HTTP timeouts for the two HTTP requests should not exceed 1 min
const DEFAULT_TIMEOUT_MS = 25000

const smClient = new SecretsManager({
    region: process.env.AWS_REGION
});

interface StatuspageMaintenances {
    readonly scheduled_maintenances: [{
        readonly scheduled_for: string
        readonly scheduled_until: string
    }]
}

interface NodePingCheck {
    readonly enable: string
}

async function getActiveStatusPageMaintenances(): Promise<StatuspageMaintenances> {
    const r = await axios.get(`${STATUSPAGE_URL}/api/v2/scheduled-maintenances/active.json`, {
        timeout: DEFAULT_TIMEOUT_MS
    });
    if (r.status != 200) {
        throw new Error('Unable to get Statuspage maintenances');
    }
    return r.data as StatuspageMaintenances;
}

async function getEnabledNodePingChecks(nodepingToken: string, subaccountId: string): Promise<NodePingCheck[]> {
    const r = await axios.get(`${NODEPING_API}/checks?token=${nodepingToken}&customerid=${subaccountId}`, {
        timeout: DEFAULT_TIMEOUT_MS
    });
    if (r.status != 200) {
        throw new Error('Unable to fetch checks');
    }
    const checks = Object.values(r.data) as NodePingCheck[];
    return checks.filter(c => c.enable == 'active');
}

async function setNodePingCheckStateToDisabled(disabled: boolean, nodepingToken: string, subaccountId: string) {
    console.log(`Setting NodePing checks disabled state to ${disabled}`);
    const r = await axios.put(`${NODEPING_API}/checks?disableall=${disabled}&token=${nodepingToken}&customerid=${subaccountId}`, {
        timeout: DEFAULT_TIMEOUT_MS
    });
    if (r.status != 200) {
        throw new Error('Unable to update checks');
    }
    console.log('..done');
}

async function enableNodePingChecks(nodepingToken: string, subaccountId: string) {
    await setNodePingCheckStateToDisabled(false, nodepingToken, subaccountId);
}

async function disableNodePingChecks(nodepingToken: string, subaccountId: string) {
    await setNodePingCheckStateToDisabled(true, nodepingToken, subaccountId);
}

async function handleMaintenance(secret: UpdateStatusSecret) {
    const activeMaintenances = await getActiveStatusPageMaintenances();
    const enabledNodePingChecks = await getEnabledNodePingChecks(secret.nodePingToken, secret.nodepingSubAccountId);

    if (activeMaintenances.scheduled_maintenances.length) {
        if (enabledNodePingChecks.length) {
            console.log('Active maintenances found, disabling NodePing checks');
            await disableNodePingChecks(secret.nodePingToken, secret.nodepingSubAccountId);
        }
    } else {
        if (!enabledNodePingChecks.length) {
            console.log('No active maintenances found, enabling disabled NodePing checks');
            await enableNodePingChecks(secret.nodePingToken, secret.nodepingSubAccountId);
        }
    }
}

export const handler = async (): Promise<any> => {
    const secretObj = await smClient.getSecretValue({
        SecretId: process.env.SECRET_ARN as string
    }).promise();
    if (!secretObj.SecretString) {
        throw new Error('No secret found!');
    }
    const secret: UpdateStatusSecret = JSON.parse(secretObj.SecretString);

    await handleMaintenance(secret);
}
