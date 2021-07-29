import axios from 'axios';
import {EndpointProtocol, MonitoredApp, MonitoredEndpoint} from '../../app-props';
import {SecretsManager} from 'aws-sdk';
import {UpdateStatusSecret} from "../../secret";
import {MediaType} from "digitraffic-common/api/mediatypes";

interface AppEndpoints {
    readonly app: string
    readonly hostPart: string
    readonly endpoints: string[]
    readonly extraEndpoints: MonitoredEndpoint[]
}

const NODEPING_API = 'https://api.nodeping.com/api/1';
const STATUSPAGE_API = 'https://api.statuspage.io/v1/pages';

const smClient = new SecretsManager({
    region: process.env.AWS_REGION
});

const apps = JSON.parse(process.env.APPS as string) as MonitoredApp[];

async function getAppEndpoints(app: MonitoredApp): Promise<AppEndpoints> {
    console.log('Fetching digitraffic endpoints')
    const r = await axios.get(app.url, {
        headers: {
            'accept-encoding': 'gzip'
        }
    });
    if (r.status !== 200) {
        throw new Error('Unable to fetch contacts');
    }
    console.log('..done');
    const all = Object.keys(r.data.paths).filter(p => !p.includes('{'));
    const notBeta = all.filter((e) => !e.includes('beta'));
    const beta = all.filter((e) => e.includes('beta'));
    notBeta.sort();
    beta.sort();
    return {
        app: app.name,
        hostPart: app.hostPart,
        endpoints: (([] as string[]).concat(notBeta).concat(beta)).filter(e => !app.excluded.includes(e)),
        extraEndpoints: app.endpoints
    };
}

async function getStatuspageComponents(statuspagePageId: string, statuspageApiKey: string) {
    console.log('Fetching Statuspage components');
    const r = await axios.get(`${STATUSPAGE_API}/${statuspagePageId}/components`, {
        headers: {
            Authorization: `OAuth ${statuspageApiKey}`
        }
    });
    if (r.status !== 200) {
        throw new Error('Unable to get Statuspage components');
    }
    console.log('..done');
    return r.data;
}

async function createStatuspageComponent(
    endpoint: string,
    statuspagePageId: string,
    statuspageComponentGroupId: string,
    statuspageApiKey: string) {
    console.log('Creating Statuspage component for endpoint', endpoint)
    const r = await axios.post(`${STATUSPAGE_API}/${statuspagePageId}/components`, {
        component: {
            description: endpoint,
            status: 'operational',
            name: endpoint,
            only_show_if_degraded: 'false',
            group_id: statuspageComponentGroupId,
            showcase: 'true'
        }
    }, {
        headers: {
            Authorization: `OAuth ${statuspageApiKey}`,
            'Content-type': MediaType.APPLICATION_JSON
        }
    });
    if (r.status !== 201) {
        throw new Error('Unable to create Statuspage component');
    }
    console.log('..done')
    return r.data;
}

async function getNodepingContacts(nodepingToken: string, subaccountId: string) {
    console.log('Fetching NodePing contacts with token');
    const r = await axios.get(`${NODEPING_API}/contacts?token=${nodepingToken}&customerid=${subaccountId}`);
    if (r.status !== 200) {
        throw new Error('Unable to fetch contacts');
    }
    console.log('..done');
    return r.data;
}

async function createNodepingContact(
    endpoint: string,
    nodepingSubaccountId: string,
    statuspageApiKey: string,
    nodepingToken: string,
    statuspagePageId: string,
    statuspageComponentId: string) {
    console.log('Creating NodePing contact for endpoint', endpoint)
    const r = await axios.post(`${NODEPING_API}/contacts`, {
        token: nodepingToken,
        customerid: nodepingSubaccountId,
        name: endpoint,
        newaddresses: [{
            address: `https://api.statuspage.io/v1/pages/${statuspagePageId}/components/${statuspageComponentId}.json`,
            type: 'webhook',
            action: 'patch',
            headers: {
                Authorization: `OAuth ${statuspageApiKey}`
            },
            data: {'component[status]': '{if success}operational{else}major_outage{/if}'}
        }]
    });
    if (r.status !== 200) {
        throw new Error('Unable to create contact');
    }
    console.log('..done');
}

async function getNodepingChecks(nodepingToken: string, subaccountId: string) {
    console.log('Fetching NodePing checks')
    const r = await axios.get(`${NODEPING_API}/checks?token=${nodepingToken}&customerid=${subaccountId}`);
    if (r.status !== 200) {
        throw new Error('Unable to fetch checks');
    }
    console.log('..done');
    return Object.values(r.data).map((check: any) => check.label);
}

async function createNodepingCheck(
    endpoint: string,
    nodepingToken: string,
    subaccountId: string,
    contactIds: string[],
    app: string,
    extraData?: MonitoredEndpoint) {

    console.log('Creating NodePing check for endpoint', endpoint);
    const notification: any = {};
    contactIds.forEach(contactId => {
        notification[`${contactId}`] = {'delay': 0, 'schedule': 'All'};
    });
    const data: any = {
        customerid: subaccountId,
        token: nodepingToken,
        label: endpoint,
        type: extraData?.protocol === EndpointProtocol.WebSocket ? 'WEBSOCKET' : 'HTTPADV',
        target: extraData?.url ?? `https://${app}.digitraffic.fi${endpoint}`,
        interval: 5,
        threshold: 30,
        enabled: true,
        follow: true,
        sendheaders: {'accept-encoding': 'gzip'},
        method: extraData?.sendData == null ? 'GET' : 'POST',
        notifications: [notification]
    };
    if (extraData?.sendData) {
        data.postdata = extraData.sendData;
        data.sendheaders['content-type'] = MediaType.APPLICATION_JSON;
    }
    const r = await axios.post(`${NODEPING_API}/checks`, data, {
        headers: {
            'Content-type': MediaType.APPLICATION_JSON
        }
    });
    if (r.status !== 200 || r.data.error) {
        throw new Error('Unable to create check');
    }
    console.log('..done');
}

function getStatuspageComponentGroupId(appEndpoints: AppEndpoints, secret: UpdateStatusSecret): string {
    switch (appEndpoints.app.toLowerCase()) {
        case 'road':
            return secret.statusPageRoadComponentGroupId;
        case 'marine':
            return secret.statusPageMarineComponentGroupId;
        case 'rail':
            return secret.statusPageRailComponentGroupId;
    }
    throw new Error(`Error fetching Status page component group id for app ${appEndpoints.app}! Unknown app or missing component group id`);
}

async function updateComponentsAndChecks(
    appEndpoints: AppEndpoints,
    secret: UpdateStatusSecret): Promise<void> {

    const allEndpoints = appEndpoints.endpoints.concat(appEndpoints.extraEndpoints.map(e => e.name));

    let statuspageComponents: any[] = await getStatuspageComponents(secret.statuspagePageId, secret.statuspageApiKey);
    const statuspageComponentNames: string[] = statuspageComponents.map(c => c.name);
    const missingComponents = allEndpoints.filter(e => !statuspageComponentNames.includes(e));
    console.log('Missing components', missingComponents);

    // loop in order to preserve ordering
    for (const component of missingComponents) {
        await createStatuspageComponent(component,
            secret.statuspagePageId,
            getStatuspageComponentGroupId(appEndpoints, secret),
            secret.statuspageApiKey);
    }
    if (missingComponents.length > 0) {
        statuspageComponents = await getStatuspageComponents(secret.statuspagePageId, secret.statuspageApiKey);
    }

    let contacts = await getNodepingContacts(secret.nodePingToken, secret.nodepingSubAccountId);
    const contactNames: string[] = Object.values(contacts).map((c: any) => c.name);
    const missingContacts = allEndpoints.filter(e => !contactNames.includes(e));
    console.log('Missing contacts', missingContacts);

    for (const missingContact of missingContacts) {
        const component = statuspageComponents.find(c => c.name === missingContact);
        if (!component) {
            throw new Error(`Component for missing contact ${missingContact} not found`);
        }
        await createNodepingContact(missingContact,
            secret.nodepingSubAccountId,
            secret.statuspageApiKey,
            secret.nodePingToken,
            secret.statuspagePageId,
            component['id'] as string)
    }
    if (missingContacts.length > 0) {
        contacts = await getNodepingContacts(secret.nodePingToken, secret.nodepingSubAccountId);
    }

    const checks: string[] = await getNodepingChecks(secret.nodePingToken, secret.nodepingSubAccountId);
    const missingChecks = allEndpoints.filter(e => !checks.includes(e));
    console.log('Missing checks', missingChecks);
    for (const missingCheck of missingChecks) {
        const contact: any = Object.values(contacts).find((c: any) => c.name === missingCheck);
        if (!contact) {
            throw new Error(`Contact for ${missingCheck} not found`);
        }
        const correspondingExtraEndpoint = appEndpoints.extraEndpoints.find(e => e.name === missingCheck);
        await createNodepingCheck(missingCheck,
            secret.nodePingToken,
            secret.nodepingSubAccountId,
            [
                Object.keys(contact['addresses'])[0] as string,
                secret.nodePingContactIdSlack1,
                secret.nodePingContactIdSlack2
            ],
            appEndpoints.hostPart,
            correspondingExtraEndpoint);
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

    const endpoints: AppEndpoints[] = await Promise.all(apps.map(getAppEndpoints));

    for (const endpoint of endpoints) {
        await updateComponentsAndChecks(endpoint, secret);
    }
}
