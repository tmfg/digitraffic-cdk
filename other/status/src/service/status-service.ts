import {
  logger,
  type LoggerMethodType,
} from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DigitrafficApi } from "../api/digitraffic-api.js";
import type {
  NodePingApi,
  NodePingCheck,
  NodePingContact,
} from "../api/nodeping-api.js";
import { type MonitoredApp, type MonitoredEndpoint } from "../app-props.js";
import type { AppWithEndpoints } from "../model/app-with-endpoints.js";
import type { UpdateStatusSecret } from "../secret.js";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type {
  CStateStatuspageApi,
  CStateSystem,
} from "../api/cstate-statuspage-api.js";
import { removeAppAndTrim, removeTrailingSlash } from "./utils.js";
import _ from "lodash";

const SERVICE = "StatusService" as const;
const BETA = "beta" as const;

export async function getNodePingAndStatuspageComponentNotInSyncStatuses(
  nodePingApi: NodePingApi,
  cStateStatuspageApi: CStateStatuspageApi,
): Promise<string[]> {
  const nodePingChecks = await nodePingApi.getNodePingChecks();
  const cStateStatus = await cStateStatuspageApi.getStatus();
  const cStateMaintenanceOn = await cStateStatuspageApi.isActiveMaintenances();

  const nodePingCheckMap: Record<string, NodePingCheck> = {};
  nodePingChecks.forEach(
    (
      npc,
    ) => (nodePingCheckMap[
      convertToCstateNameWithoutApp(npc.label).toLowerCase()
    ] = npc),
  );

  const cStateSystemsMap: Record<string, CStateSystem> = {};
  cStateStatus.systems.forEach(
    (
      system,
    ) => (cStateSystemsMap[convertToCstateNameWithoutApp(system.name)] =
      system),
  );

  const missingCStateSystems = nodePingChecks
    .filter((npc) => !isBeta(npc.label))
    .filter((npc) =>
      !(convertToCstateNameWithoutApp(npc.label) in cStateSystemsMap)
    )
    .map((npc) => `${npc.label}: cState Statuspage system missing`);

  const missingNodePingChecksVsCState = cStateStatus.systems
    .filter((sc) => !(removeAppAndTrim(sc.name) in nodePingCheckMap))
    .map((sc) => `${sc.name}: NodePing check missing`);

  const outOfSyncWithCStateStatusPage = cStateMaintenanceOn
    ? []
    : cStateStatus.systems
      .map((cStateSystem) => {
        const nodePingCheck =
          nodePingCheckMap[convertToCstateNameWithoutApp(cStateSystem.name)];
        if (!nodePingCheck) {
          return null;
        }
        if (nodePingCheck.state === 1 && cStateSystem.status === "down") {
          return `${cStateSystem.name}: NodePing check is UP, cState statuspage component is DOWN`;
        } else if (
          nodePingCheck.state === 0 && cStateSystem.status !== "down"
        ) {
          return `${cStateSystem.name}: NodePing check is DOWN, cState statuspage component is UP`;
        }
        return null;
      })
      .filter((s): s is string => !!s);

  return missingCStateSystems.concat(missingNodePingChecksVsCState).concat(
    outOfSyncWithCStateStatusPage,
  );
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

async function updateNodePingChecksForApp(
  appWithEndpoints: AppWithEndpoints,
  secretHolder: SecretHolder<UpdateStatusSecret>,
  nodePingApi: NodePingApi,
  gitHubOwner: string,
  gitHubRepo: string,
  gitHubBranch: string,
  gitHubWorkflowFile: string,
): Promise<void> {
  const start = Date.now();
  const method =
    `${SERVICE}.updateNodePingChecksForApp` as const satisfies LoggerMethodType;
  logger.info({
    method,
    message: `Updating components and checks for app ${appWithEndpoints.app}`,
  });
  const secret = await secretHolder.get();
  const allEndpoints = appWithEndpoints.endpoints.concat(
    appWithEndpoints.extraEndpoints.map((e) => e.name),
  );

  let contacts = await nodePingApi.getNodepingContacts();
  const contactNames: string[] = contacts.map((c) => c.name);

  // GitGub cState actions contact
  const nodePingContactNameForGitHubActions =
    `GitHub Actions for status ${gitHubBranch}`;
  if (!contactNames.includes(nodePingContactNameForGitHubActions)) {
    await nodePingApi.createNodepingContactForCState(
      gitHubOwner,
      gitHubRepo,
      gitHubBranch,
      gitHubWorkflowFile,
      secret.gitHubPat,
      nodePingContactNameForGitHubActions,
    );
    contacts = await nodePingApi.getNodepingContacts();
  }

  const checks = await nodePingApi.getNodePingChecks();
  const checkNames = checks.map((check) => check.label);
  const missingChecks = allEndpoints.filter(
    (e) =>
      !checkNames.includes(e) &&
      !checkNames.includes(`${appWithEndpoints.app} ${e}`),
  );
  logger.info({
    method,
    message: missingChecks.length
      ? `Missing NodePing checks ${JSON.stringify(missingChecks)}`
      : "No Missing NodePing checks",
  });

  // Find github actions contact
  const githubActionsContactId = getContactId(
    nodePingContactNameForGitHubActions,
    contacts,
  );
  // Slack contacts
  const internalContactIds = [
    secret.nodePingContactIdSlack1,
    secret.nodePingContactIdSlack2,
  ];

  logger.info({
    method,
    message: `Creating missing checks for app ${appWithEndpoints.app} start`,
  });
  await createChecks(
    missingChecks,
    internalContactIds,
    githubActionsContactId,
    appWithEndpoints,
    nodePingApi,
  );

  logger.info({
    method,
    message: `Updating checks for app ${appWithEndpoints.app}`,
  });
  await updateChecks(
    checks.filter((c) =>
      c.label.toLowerCase().includes(appWithEndpoints.app.toLowerCase())
    ),
    internalContactIds,
    githubActionsContactId,
    nodePingApi,
    appWithEndpoints.extraEndpoints,
    appWithEndpoints.app,
  );

  logger.info({
    method,
    message: `Updating and checks for app ${appWithEndpoints.app} done`,
    tookMs: Date.now() - start,
  });
}

function getContactIds(
  checkLabel: string,
  internalContactIds: string[],
  githubActionsContactId: string,
): string[] {
  return isBeta(checkLabel)
    ? internalContactIds // beta apis are only reported internally
    : [...internalContactIds, githubActionsContactId];
}

async function createChecks(
  missingChecks: string[],
  internalContactIds: string[],
  githubActionsContactId: string,
  appWithEndpoints: AppWithEndpoints,
  nodePingApi: NodePingApi,
): Promise<void> {
  const method = `${SERVICE}.createChecks` as const satisfies LoggerMethodType;
  const start = Date.now();
  for (const missingCheck of missingChecks) {
    const correspondingExtraEndpoint = appWithEndpoints.extraEndpoints.find(
      (e) => e.name === missingCheck,
    );

    const contactIdsToSet = getContactIds(
      missingCheck,
      internalContactIds,
      githubActionsContactId,
    );

    await nodePingApi.createNodepingCheck(
      missingCheck,
      contactIdsToSet,
      appWithEndpoints.hostPart,
      appWithEndpoints.app,
      correspondingExtraEndpoint,
    );
  }
  logger.info({
    method,
    message: `Creating missing checks for app ${appWithEndpoints.app} end`,
    tookMs: Date.now() - start,
    customCount: missingChecks.length,
  });
}

export async function updateChecks(
  checks: NodePingCheck[],
  internalContactIds: string[],
  githubActionsContactId: string,
  nodePingApi: NodePingApi,
  extraEndpoints: MonitoredEndpoint[],
  app: string,
): Promise<void> {
  const method = `${SERVICE}.updateChecks` as const satisfies LoggerMethodType;
  const start = Date.now();
  let count = 0;
  for (const check of checks) {
    // Ie. updating mqtt url matches only for label as url has changed.
    const correspondingExtraEndpoint = extraEndpoints.find(
      (e) =>
        e.url === check.parameters.target ||
        e.name.toLowerCase() === check.label.toLowerCase(),
    );

    const checksContactIds = getContactIds(
      check.label,
      internalContactIds,
      githubActionsContactId,
    );

    if (
      nodePingApi.checkNeedsUpdate(
        check,
        correspondingExtraEndpoint,
        checksContactIds,
      )
    ) {
      await nodePingApi.updateNodepingCheck(
        check._id,
        check.parameters.target,
        checksContactIds,
        check.label,
        correspondingExtraEndpoint,
      );
      count++;
    }
  }
  logger.info({
    method,
    message: `Updating existing checks for app ${app}`,
    tookMs: Date.now() - start,
    customCount: count,
  });
}

/**
 * Updates checks for apps to NodePing
 */
export async function updateComponentsAndChecks(
  apps: MonitoredApp[],
  digitrafficApi: DigitrafficApi,
  nodePingApi: NodePingApi,
  secret: SecretHolder<UpdateStatusSecret>,
  gitHubOwner: string,
  gitHubRepo: string,
  gitHubBranch: string,
  gitHubWorkflowFile: string,
): Promise<void> {
  const appsWithEndpoints: AppWithEndpoints[] = await Promise.all(
    apps.map((app) => digitrafficApi.getAppWithEndpoints(app)),
  );

  for (const appWithEndpoints of appsWithEndpoints) {
    await updateNodePingChecksForApp(
      appWithEndpoints,
      secret,
      nodePingApi,
      gitHubOwner,
      gitHubRepo,
      gitHubBranch,
      gitHubWorkflowFile,
    );
  }
}

function getContactId(
  contactName: string,
  contacts: NodePingContact[],
): string {
  const method = `${SERVICE}.getContactId` as const satisfies LoggerMethodType;
  const contact = Object.values(contacts).find((c) => c.name === contactName);
  const message = `NodePing contact with name ${contactName}` as const;
  if (contact) {
    const contactId = _.keys(contact.addresses)[0];
    if (!contactId) {
      logger.error({
        method,
        message: `${message} don't have addresses`,
      });
      throw new Error(`${message} don't have addresses`);
    }
    logger.info({
      method,
      message: `${message}, id ${contactId} found`,
    });
    return contactId;
  } else {
    logger.error({
      method,
      message: `${message} not found`,
    });
    throw new Error(`NodePing contact ${contactName} not found`);
  }
}

function isBeta(path: string): boolean {
  return path.toLowerCase().includes(BETA);
}
