import {NodePingApi, NodePingCheck, NodePingCheckState} from "../api/nodeping";
import {StatuspageApi, StatuspageComponent, StatuspageComponentStatus} from "../api/statuspage";
import {UpdateStatusSecret} from "../secret";
import {AppEndpoints} from "../model/app-endpoints";
import {MonitoredApp} from "../app-props";
import {DigitrafficApi} from "../api/digitraffic";

export async function getNodePingAndStatuspageComponentStatuses(
    secret: UpdateStatusSecret,
    statuspageApi: StatuspageApi,
    nodePingApi: NodePingApi): Promise<string[]> {

    const statuspageComponents = await statuspageApi.getStatuspageComponents();
    const nodePingChecks = await nodePingApi.getNodepingChecks();

    const statuspageCheckMap: {[label: string]: StatuspageComponent } = {};
    statuspageComponents.forEach(sc => statuspageCheckMap[sc.name] = sc);

    const nodePingCheckMap: {[label: string]: NodePingCheck} = {};
    nodePingChecks.forEach(npc => nodePingCheckMap[npc.label] = npc);

    const missingStatuspageComponents = nodePingChecks.filter(npc => !statuspageCheckMap.hasOwnProperty(npc.label))
        .map(npc => `${npc.label}: Statuspage component missing`);
    const missingNodePingChecks = statuspageComponents.filter(sc => !nodePingCheckMap.hasOwnProperty(sc.name))
        .map(sc => `${sc.name}: NodePing check missing`);

    return missingStatuspageComponents.concat(missingNodePingChecks).concat(statuspageComponents.map(sc => {
        const nodePingCheck = nodePingCheckMap[sc.name];
        if (!nodePingCheck) {
            return null;
        }
        if (nodePingCheck.state == NodePingCheckState.UP && sc.status != StatuspageComponentStatus.operational) {
            return `${sc.name}: NodePing check is UP, Statuspage component is DOWN`;
        } else if (nodePingCheck.state == NodePingCheckState.DOWN && sc.status == StatuspageComponentStatus.operational) {
            return `${sc.name}: NodePing check is DOWN, Statuspage component is UP`;
        }
        return null;
    }).filter((s): s is string => !!s));
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

async function updateComponentsAndChecksForApp(
    appEndpoints: AppEndpoints,
    secret: UpdateStatusSecret,
    statuspageApi: StatuspageApi,
    nodePingApi: NodePingApi): Promise<void> {

    const allEndpoints = appEndpoints.endpoints.concat(appEndpoints.extraEndpoints.map(e => e.name));

    let statuspageComponents = await statuspageApi.getStatuspageComponents();
    const statuspageComponentNames: string[] = statuspageComponents.map(c => c.name);
    const missingComponents = allEndpoints.filter(e => !statuspageComponentNames.includes(e));
    console.log('Missing components', missingComponents);

    // loop in order to preserve ordering
    for (const component of missingComponents) {
        await statuspageApi.createStatuspageComponent(component, getStatuspageComponentGroupId(appEndpoints, secret));
    }
    if (missingComponents.length > 0) {
        statuspageComponents = await statuspageApi.getStatuspageComponents();
    }

    let contacts = await nodePingApi.getNodepingContacts();
    const contactNames: string[] = Object.values(contacts).map((c: any) => c.name);
    const missingContacts = allEndpoints.filter(e => !contactNames.includes(e));
    console.log('Missing contacts', missingContacts);

    for (const missingContact of missingContacts) {
        const component = statuspageComponents.find(c => c.name === missingContact);
        if (!component) {
            throw new Error(`Component for missing contact ${missingContact} not found`);
        }
        await nodePingApi.createNodepingContact(missingContact,
            secret.nodePingToken,
            secret.statuspagePageId,
            component.id)
    }
    if (missingContacts.length > 0) {
        contacts = await nodePingApi.getNodepingContacts();
    }

    const checks: string[] = (await nodePingApi.getNodepingChecks())
        .map((check: any) => check.label);
    const missingChecks = allEndpoints.filter(e => !checks.includes(e));
    console.log('Missing checks', missingChecks);
    for (const missingCheck of missingChecks) {
        const contact: any = Object.values(contacts).find((c: any) => c.name === missingCheck);
        if (!contact) {
            throw new Error(`Contact for ${missingCheck} not found`);
        }
        const correspondingExtraEndpoint = appEndpoints.extraEndpoints.find(e => e.name === missingCheck);
        await nodePingApi.createNodepingCheck(missingCheck,
            [
                Object.keys(contact['addresses'])[0] as string,
                secret.nodePingContactIdSlack1,
                secret.nodePingContactIdSlack2
            ],
            appEndpoints.hostPart,
            correspondingExtraEndpoint);
    }
}

export async function updateComponentsAndChecks(
    apps: MonitoredApp[],
    digitrafficApi: DigitrafficApi,
    statuspageApi: StatuspageApi,
    nodePingApi: NodePingApi,
    secret: UpdateStatusSecret) {

    const endpoints: AppEndpoints[] = await Promise.all(apps.map(digitrafficApi.getAppEndpoints));

    for (const endpoint of endpoints) {
        await updateComponentsAndChecksForApp(endpoint, secret, statuspageApi, nodePingApi);
    }
}
