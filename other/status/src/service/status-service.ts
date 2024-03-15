import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DigitrafficApi } from "../api/digitraffic-api.js";
import type { NodePingApi, NodePingCheck, NodePingContact } from "../api/nodeping-api.js";
import {
    type StatuspageApi,
    type StatuspageComponent,
    StatuspageComponentStatus
} from "../api/statuspage.js";
import { EndpointHttpMethod, type MonitoredApp, type MonitoredEndpoint } from "../app-props.js";
import type { AppWithEndpoints } from "../model/app-with-endpoints.js";
import type { UpdateStatusSecret } from "../secret.js";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { CStateStatuspageApi, CStateSystem } from "../api/cstate-statuspage-api.js";
import { removeAppAndTrim, removeTrailingSlash } from "./utils.js";
import _ from "lodash";

const SERVICE = "StatusService" as const;
const BETA = "beta" as const;

export async function getNodePingAndStatuspageComponentNotInSyncStatuses(
    statuspageApi: StatuspageApi,
    nodePingApi: NodePingApi,
    cStateStatuspageApi: CStateStatuspageApi
): Promise<string[]> {
    const statuspageComponents = (await statuspageApi.getStatuspageComponents()).filter(
        (sc) => sc.group_id !== null
    ); // skip component group components
    const nodePingChecks = await nodePingApi.getNodePingChecks();
    const cStateStatus = await cStateStatuspageApi.getStatus();
    const cStateMaintenanceOn = await cStateStatuspageApi.isActiveMaintenances();
    const statuspageMaintenanceOn =
        (await statuspageApi.getActiveStatusPageMaintenances()).scheduled_maintenances.length > 0;
    const maintenanceOn = cStateMaintenanceOn || statuspageMaintenanceOn;
    const statuspageCheckMap: Record<string, StatuspageComponent> = {};
    statuspageComponents.forEach((sc) => (statuspageCheckMap[convertToCstateNameWithoutApp(sc.name)] = sc));

    const nodePingCheckMap: Record<string, NodePingCheck> = {};
    nodePingChecks.forEach(
        (npc) => (nodePingCheckMap[convertToCstateNameWithoutApp(npc.label).toLowerCase()] = npc)
    );

    const cStateSystemsMap: Record<string, CStateSystem> = {};
    cStateStatus.systems.forEach(
        (system) => (cStateSystemsMap[convertToCstateNameWithoutApp(system.name)] = system)
    );

    const missingStatuspageComponents = nodePingChecks
        .filter((npc) => !(convertToCstateNameWithoutApp(npc.label) in statuspageCheckMap))
        .map((npc) => `${npc.label}: Statuspage component missing`);

    const missingCStateSystems = nodePingChecks
        .filter((npc) => !isBeta(npc.label))
        .filter((npc) => !(convertToCstateNameWithoutApp(npc.label) in cStateSystemsMap))
        .map((npc) => `${npc.label}: CState Statuspage system missing`);

    const missingNodePingChecksVsStatusPage = statuspageComponents
        .filter((sc) => !(convertToCstateNameWithoutApp(sc.name) in nodePingCheckMap))
        .map((sc) => `${sc.name}: NodePing check missing`);

    const missingNodePingChecksVsCState = cStateStatus.systems
        .filter((sc) => !(removeAppAndTrim(sc.name) in nodePingCheckMap))
        .map((sc) => `${sc.name}: NodePing check missing`);

    const outOfSyncWithStatusPage = maintenanceOn
        ? []
        : statuspageComponents
              .map((sc) => {
                  const nodePingCheck = nodePingCheckMap[convertToCstateNameWithoutApp(sc.name)];
                  if (!nodePingCheck) {
                      return null;
                  }
                  if (nodePingCheck.state === 1 && sc.status !== StatuspageComponentStatus.operational) {
                      return `${sc.name}: NodePing check is UP, Statuspage component is DOWN`;
                  } else if (
                      nodePingCheck.state === 0 &&
                      sc.status === StatuspageComponentStatus.operational
                  ) {
                      return `${sc.name}: NodePing check is DOWN, Statuspage component is UP`;
                  }
                  return null;
              })
              .filter((s): s is string => !!s);

    const outOfSyncWithCStateStatusPage = maintenanceOn
        ? []
        : cStateStatus.systems
              .map((cStateSystem) => {
                  const nodePingCheck = nodePingCheckMap[convertToCstateNameWithoutApp(cStateSystem.name)];
                  if (!nodePingCheck) {
                      return null;
                  }
                  if (nodePingCheck.state === 1 && cStateSystem.status !== "ok") {
                      return `${cStateSystem.name}: NodePing check is UP, CState statuspage component is DOWN`;
                  } else if (nodePingCheck.state === 0 && cStateSystem.status === "ok") {
                      return `${cStateSystem.name}: NodePing check is DOWN, CState statuspage component is UP`;
                  }
                  return null;
              })
              .filter((s): s is string => !!s);

    return missingStatuspageComponents
        .concat(missingCStateSystems)
        .concat(missingNodePingChecksVsStatusPage)
        .concat(missingNodePingChecksVsCState)
        .concat(outOfSyncWithStatusPage)
        .concat(outOfSyncWithCStateStatusPage);
}

/**
 * Statuspage labels:
 * Rail Swagger -> /swagger
 * Rail infra-api -> /infra-api
 * Rail infra-api Swagger -> /infra-api/swagger" "/infra-api/swagger"
 * Rail Last Updated -> /last-updated
 * Rail /last-updated/ -> /last-updated
 * @param checkLabel
 */
function convertToCstateNameWithoutApp(checkLabel: string): string {
    const label = checkLabel.toLowerCase();
    const labelWoApp = removeAppAndTrim(label);
    const labelWoSlash = removeTrailingSlash(labelWoApp);
    const filledLabel = fillSpacesAndTrim(labelWoSlash);
    return filledLabel.startsWith("/") ? filledLabel : `/${filledLabel}`;
}

function fillSpacesAndTrim(label: string): string {
    const trimmed = label.trim();
    if (trimmed.includes("-") && trimmed.includes(" ")) {
        // infra-api swagger -> infra-api/swagger
        return trimmed.replace(new RegExp(" ", "g"), "/");
    }
    return trimmed.replace(new RegExp(" ", "g"), "-");
}

function getStatuspageComponentGroupId(appEndpoints: AppWithEndpoints, secret: UpdateStatusSecret): string {
    switch (appEndpoints.app.toLowerCase()) {
        case "road":
            return secret.statusPageRoadComponentGroupId;
        case "marine":
            return secret.statusPageMarineComponentGroupId;
        case "rail":
            return secret.statusPageRailComponentGroupId;
    }
    throw new Error(
        `Error fetching Status page component group id for app ${appEndpoints.app}! Unknown app or missing component group id`
    );
}

async function updateComponentsAndChecksForApp(
    appWithEndpoints: AppWithEndpoints,
    secretHolder: SecretHolder<UpdateStatusSecret>,
    statuspageApi: StatuspageApi,
    nodePingApi: NodePingApi,
    gitHubOwner: string,
    gitHubRepo: string,
    gitHubBranch: string,
    gitHubWorkflowFile: string
): Promise<void> {
    const start = Date.now();
    const method = `${SERVICE}.updateComponentsAndChecksForApp` as const satisfies LoggerMethodType;
    logger.info({
        method,
        message: `Updating components and checks for app ${appWithEndpoints.app}`
    });
    const secret = await secretHolder.get();
    const allEndpoints = appWithEndpoints.endpoints.concat(
        appWithEndpoints.extraEndpoints.map((e) => e.name)
    );

    let statuspageComponents = await statuspageApi.getStatuspageComponents();
    const statuspageComponentNames: string[] = statuspageComponents.map((c) => c.name);
    const missingComponents = allEndpoints.filter((e) => !statuspageComponentNames.includes(e) && !isBeta(e));
    logger.info({
        method,
        message: missingComponents.length
            ? `Missing statuspage components ${JSON.stringify(missingComponents)}`
            : "No missing statuspage components"
    });

    // loop in order to preserve ordering
    for (const component of missingComponents) {
        await statuspageApi.createStatuspageComponent(
            component,
            getStatuspageComponentGroupId(appWithEndpoints, secret)
        );
    }
    if (missingComponents.length) {
        statuspageComponents = await statuspageApi.getStatuspageComponents();
    }

    let contacts = await nodePingApi.getNodepingContacts();
    const contactNames: string[] = contacts.map((c) => c.name);
    const missingContactEndpoints = allEndpoints.filter(
        (e) => !isBeta(e) && findContact(contacts, e, appWithEndpoints.app) === undefined
    );

    logger.info({
        method,
        message: missingContactEndpoints.length
            ? `Missing NodePing contacts ${JSON.stringify(missingContactEndpoints)}`
            : "No Missing NodePing contacts"
    });

    for (const missingContactEndpoint of missingContactEndpoints) {
        const component = statuspageComponents.find((c) => c.name === missingContactEndpoint);
        if (!component) {
            throw new Error(`Component for missing contact ${missingContactEndpoint} not found`);
        }
        await nodePingApi.createStatuspageContact(
            missingContactEndpoint,
            appWithEndpoints.app,
            secret.statuspageApiKey,
            secret.statuspagePageId,
            component.id
        );
    }

    // GitGub cState actions contact
    const nodePingContactNameForGitHubActions = `GitHub Actions for status ${gitHubBranch}`;
    if (!contactNames.includes(nodePingContactNameForGitHubActions)) {
        await nodePingApi.createNodepingContactForCState(
            gitHubOwner,
            gitHubRepo,
            gitHubBranch,
            gitHubWorkflowFile,
            secret.gitHubPat,
            nodePingContactNameForGitHubActions
        );
        missingContactEndpoints.push(nodePingContactNameForGitHubActions);
    }

    if (missingContactEndpoints.length) {
        // eslint-disable-next-line require-atomic-updates
        contacts = await nodePingApi.getNodepingContacts();
    }

    const checks = await nodePingApi.getNodePingChecks();
    const checkNames = checks.map((check) => check.label);
    const missingChecks = allEndpoints.filter(
        (e) => !checkNames.includes(e) && !checkNames.includes(`${appWithEndpoints.app} ${e}`)
    );
    logger.info({
        method,
        message: missingChecks.length
            ? `Missing NodePing checks ${JSON.stringify(missingChecks)}`
            : "No Missing NodePing checks"
    });

    // Find github actions contact
    const githubActionsContactId = getContactId(nodePingContactNameForGitHubActions, contacts);

    const internalContactIds = [secret.nodePingContactIdSlack1, secret.nodePingContactIdSlack2];

    await createChecks(
        missingChecks,
        internalContactIds,
        githubActionsContactId,
        contacts,
        appWithEndpoints,
        nodePingApi
    );

    logger.info({
        method,
        message: `Updating checks for app ${appWithEndpoints.app}`
    });
    await updateChecks(
        checks.filter((c) => c.label.toLowerCase().includes(appWithEndpoints.app.toLowerCase())),
        internalContactIds,
        githubActionsContactId,
        contacts,
        nodePingApi,
        appWithEndpoints.extraEndpoints,
        appWithEndpoints.app
    );

    logger.info({
        method,
        message: `Updating components and checks for app ${appWithEndpoints.app} done`,
        tookMs: Date.now() - start
    });
}

function getContactIds(
    checkLabel: string,
    internalContactIds: string[],
    githubActionsContactId: string,
    contact: undefined | NodePingContact
): string[] {
    const contactId = _.keys(contact?.addresses)[0];
    return isBeta(checkLabel)
        ? internalContactIds // beta apis are only reported internally
        : contactId
          ? [...internalContactIds, githubActionsContactId, contactId]
          : [...internalContactIds, githubActionsContactId];
}

async function createChecks(
    missingChecks: string[],
    internalContactIds: string[],
    githubActionsContactId: string,
    contacts: NodePingContact[],
    appWithEndpoints: AppWithEndpoints,
    nodePingApi: NodePingApi
): Promise<void> {
    for (const missingCheck of missingChecks) {
        // Statuspage contact
        const contact = isBeta(missingCheck)
            ? undefined
            : findContact(contacts, missingCheck, appWithEndpoints.app);

        const correspondingExtraEndpoint = appWithEndpoints.extraEndpoints.find(
            (e) => e.name === missingCheck
        );

        const contactIdsToSet = getContactIds(
            missingCheck,
            internalContactIds,
            githubActionsContactId,
            contact
        );

        await nodePingApi.createNodepingCheck(
            missingCheck,
            contactIdsToSet,
            appWithEndpoints.hostPart,
            appWithEndpoints.app,
            correspondingExtraEndpoint
        );
    }
}

export async function updateChecks(
    checks: NodePingCheck[],
    internalContactIds: string[],
    githubActionsContactId: string,
    contacts: NodePingContact[],
    nodePingApi: NodePingApi,
    extraEndpoints: MonitoredEndpoint[],
    app: string
): Promise<void> {
    const method = `${SERVICE}.updateChecks` as const as LoggerMethodType;
    for (const check of checks) {
        const correspondingExtraEndpoint = extraEndpoints.find((e) => e.url === check.parameters.target);

        const statusPageContact = findContact(contacts, check.label, app);
        if (!statusPageContact && !isBeta(check.label)) {
            throw new Error(`${method} Contact for ${check.label} not found`);
        }
        const checksContactIds = getContactIds(
            check.label,
            internalContactIds,
            githubActionsContactId,
            statusPageContact
        );

        if (nodePingApi.checkNeedsUpdate(check, correspondingExtraEndpoint, checksContactIds)) {
            await nodePingApi.updateNodepingCheck(
                check._id,
                check.type,
                correspondingExtraEndpoint?.method ?? EndpointHttpMethod.HEAD,
                checksContactIds,
                check.label,
                correspondingExtraEndpoint
            );
        }
    }
}

/**
 * Updates checks for apps to NodePing and StatusPage
 */
export async function updateComponentsAndChecks(
    apps: MonitoredApp[],
    digitrafficApi: DigitrafficApi,
    statuspageApi: StatuspageApi,
    nodePingApi: NodePingApi,
    secret: SecretHolder<UpdateStatusSecret>,
    gitHubOwner: string,
    gitHubRepo: string,
    gitHubBranch: string,
    gitHubWorkflowFile: string
): Promise<void> {
    const endpoints: AppWithEndpoints[] = await Promise.all(
        apps.map((app) => digitrafficApi.getAppWithEndpoints(app))
    );

    for (const endpoint of endpoints) {
        await updateComponentsAndChecksForApp(
            endpoint,
            secret,
            statuspageApi,
            nodePingApi,
            gitHubOwner,
            gitHubRepo,
            gitHubBranch,
            gitHubWorkflowFile
        );
    }
}

function findContact(contacts: NodePingContact[], check: string, app: string): NodePingContact | undefined {
    return Object.values(contacts).find(
        (c) => c.name === check || `${app} ${c.name}` === check || c.name === `${app} ${check}`
    );
}

function getContactId(contactName: string, contacts: NodePingContact[]): string {
    const method = `${SERVICE}.getContactId` as const satisfies LoggerMethodType;
    const contact = Object.values(contacts).find((c) => c.name === contactName);
    const message = `NodePing contact with name ${contactName}` as const;
    if (contact) {
        const contactId = _.keys(contact.addresses)[0];
        if (!contactId) {
            logger.error({
                method,
                message: `${message} don't have addresses`
            });
            throw new Error(`${message} don't have addresses`);
        }
        logger.info({
            method,
            message: `${message}, id ${contactId} found`
        });
        return contactId;
    } else {
        logger.error({
            method,
            message: `${message} not found`
        });
        throw new Error(`NodePing contact ${contactName} not found`);
    }
}

function isBeta(path: string): boolean {
    return path.toLowerCase().includes(BETA);
}
