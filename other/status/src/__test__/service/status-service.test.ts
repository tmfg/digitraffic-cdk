import * as StatusService from "../../service/status-service.js";
import {
  NODEPING_DIGITRAFFIC_USER,
  NodePingApi,
  type NodePingCheck,
  type NodePingContact,
} from "../../api/nodeping-api.js";
import { randomString } from "@digitraffic/common/dist/test/testutils";
import {
  EndpointHttpMethod,
  type MonitoredApp,
  type MonitoredEndpoint,
} from "../../app-props.js";
import {
  emptySecretHolder,
  mockSecretHolder,
  setTestEnv,
} from "../testutils.js";
import {
  type CStateStatus,
  CStateStatuspageApi,
  type CStateSystem,
  type PinnedIssue,
} from "../../api/cstate-statuspage-api.js";
import type { AppWithEndpoints } from "../../model/app-with-endpoints.js";
import { DigitrafficApi } from "../../api/digitraffic-api.js";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { UpdateStatusSecret } from "../../secret.js";
import _ from "lodash";
import { jest } from "@jest/globals";

let cStateApi: CStateStatuspageApi;
let nodePingApi: NodePingApi;
let digitrafficApi: DigitrafficApi;
let secretHolder: SecretHolder<UpdateStatusSecret>;

const defaultApiLabel = "/api/foo/v1/bar" as const;
const defaultCStateApiLabel = `road${defaultApiLabel}` as const;
const emptyCStateStatus: CStateStatus = {
  baseURL: "cStatePageUrl",
  pinnedIssues: [] satisfies PinnedIssue[],
  systems: [] satisfies CStateSystem[],
} as const satisfies CStateStatus;

const defaultCStateSystem = {
  name: defaultCStateApiLabel,
  status: "ok",
  category: "Road",
  description: "",
} as const satisfies CStateSystem;

describe("StatusServiceTest", () => {
  beforeAll(() => {
    setTestEnv();
    secretHolder = mockSecretHolder();
    nodePingApi = new NodePingApi(secretHolder, 1000, 1000, 1);
    cStateApi = new CStateStatuspageApi(
      "cStatePageUrl",
      "gitHubOwner",
      "gitHubRepo",
      "gitHubBranch",
      "gitHubWorkflowFile",
      secretHolder,
    );
    digitrafficApi = new DigitrafficApi();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function testGetNodePingAndStatuspageComponentNotInSyncStatuses(
    expectationFn: (statuses: string[]) => void,
    returnFromCStateStatus: CStateStatus = emptyCStateStatus,
    returnFromNodePing: NodePingCheck[] = [],
  ): Promise<void> {
    jest.spyOn(nodePingApi, "getNodePingChecks").mockReturnValue(
      Promise.resolve(returnFromNodePing),
    );
    jest.spyOn(cStateApi, "getStatus").mockReturnValue(
      Promise.resolve(returnFromCStateStatus),
    );

    const statuses = await StatusService
      .getNodePingAndStatuspageComponentNotInSyncStatuses(
        nodePingApi,
        cStateApi,
      );

    expectationFn(statuses);
  }

  test("getNodePingAndStatuspageComponentStatuses - returns nothing", async () =>
    await testGetNodePingAndStatuspageComponentNotInSyncStatuses((
      statuses: string[],
    ) => expect(statuses.length).toBe(0)));

  test("getNodePingAndStatuspageComponentStatuses - missing cState component", async () =>
    testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(1);
        expect(statuses[0]).toBe(
          `${defaultApiLabel}: cState Statuspage system missing`,
        );
      },
      emptyCStateStatus,
      [{ label: defaultApiLabel, state: 1 } as NodePingCheck],
    ));

  test("getNodePingAndStatuspageComponentStatuses - missing cState system from NodePing check", async () =>
    testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(1);
        expect(statuses[0]).toBe(
          `${defaultCStateSystem.name}: NodePing check missing`,
        );
      },
      { ...emptyCStateStatus, systems: [defaultCStateSystem] },
    ));

  test("getNodePingAndStatuspageComponentStatuses - NodePing check UP and cState DOWN", async () =>
    testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(1);
        expect(statuses[0]).toBe(
          `${defaultCStateApiLabel}: NodePing check is UP, cState statuspage component is DOWN`,
        );
      },
      {
        ...emptyCStateStatus,
        systems: [{ ...defaultCStateSystem, status: "down" }],
      },
      [
        {
          label: defaultApiLabel,
          state: 1,
        } as NodePingCheck,
      ],
    ));

  test("getNodePingAndStatuspageComponentStatuses - NodePing check UP and cState DISRUPTED", async () =>
    testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(0);
      },
      {
        ...emptyCStateStatus,
        systems: [{ ...defaultCStateSystem, status: "disrupted" }],
      },
      [
        {
          label: defaultApiLabel,
          state: 1,
        } as NodePingCheck,
      ],
    ));

  test("getNodePingAndStatuspageComponentStatuses - NodePing check UP and cState NOTICE", async () =>
    testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(0);
      },
      {
        ...emptyCStateStatus,
        systems: [{ ...defaultCStateSystem, status: "notice" }],
      },
      [
        {
          label: defaultApiLabel,
          state: 1,
        } as NodePingCheck,
      ],
    ));

  test("getNodePingAndStatuspageComponentStatuses - NodePing check DOWN and cState statuspage check UP", async () =>
    testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(1);
        expect(statuses[0]).toBe(
          `${defaultCStateApiLabel}: NodePing check is DOWN, cState statuspage component is UP`,
        );
      },
      { ...emptyCStateStatus, systems: [{ ...defaultCStateSystem }] },
      [
        {
          label: defaultApiLabel,
          state: 0,
        } as NodePingCheck,
      ],
    ));

  test("getNodePingAndStatuspageComponentStatuses - app name is stripped", async () =>
    testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(0);
      },
      { ...emptyCStateStatus, systems: [defaultCStateSystem] },
      [
        {
          label: `Road ${defaultApiLabel}`,
          state: 1,
        } as NodePingCheck,
      ],
    ));

  test("getNodePingAndStatuspageComponentStatuses - custom api names with spaces", async () => {
    const customName1CState = "rail/data-is-up-to-date";
    const customName1NodePing = "Rail Data is Up To Date";
    await testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(0);
      },
      {
        ...emptyCStateStatus,
        systems: [{ ...defaultCStateSystem, name: customName1CState }],
      },
      [
        {
          label: customName1NodePing,
          state: 1,
        } as NodePingCheck,
      ],
    );
  });

  test("getNodePingAndStatuspageComponentStatuses - custom api names with spaces and dashes", async () => {
    const customName1CState = "rail/infra-api/swagger";
    const customName1NodePing = "Rail infra-api Swagger";
    await testGetNodePingAndStatuspageComponentNotInSyncStatuses(
      (statuses: string[]) => {
        expect(statuses.length).toBe(0);
      },
      {
        ...emptyCStateStatus,
        systems: [{ ...defaultCStateSystem, name: customName1CState }],
      },
      [
        {
          label: customName1NodePing,
          state: 1,
        } as NodePingCheck,
      ],
    );
  });

  test("updateChecks - check not updated", async () => {
    const secret: UpdateStatusSecret = await secretHolder.get();
    const nodePingApi = new NodePingApi(emptySecretHolder(), 1000, 10, 1);

    const slackContact = makeContact(secret.nodePingContactIdSlack1);
    const ghActionsContact = makeContact(`GitHub Actions for status master`);
    const slackContactId = _.keys(slackContact.addresses)[0]!;
    const ghContactId = _.keys(ghActionsContact.addresses)[0]!;

    const check = makeNodepingCheck("Road", "http://some.url");
    check.notifications.push(
      { [secret.nodePingContactIdSlack1]: { delay: 0, schedule: "All" } },
      { [ghContactId]: { delay: 0, schedule: "All" } },
    );
    const checks: NodePingCheck[] = [check];

    const nodePingApiCreateNodepingCheckSpy = jest
      .spyOn(nodePingApi, "createNodepingCheck")
      .mockReturnValue(Promise.resolve());

    const nodePingApiUpdateSpy = jest
      .spyOn(nodePingApi, "updateNodepingCheck")
      .mockReturnValue(Promise.resolve());

    await StatusService.updateChecks(
      checks,
      [slackContactId],
      ghContactId,
      nodePingApi,
      [],
      "Road",
    );

    expect(nodePingApiUpdateSpy).toHaveBeenCalledTimes(0);
    expect(nodePingApiCreateNodepingCheckSpy).not.toHaveBeenCalled();
  });

  test("updateComponentsAndChecksForApp - missing contact -> new contact is created", async () => {
    const secret: UpdateStatusSecret = await secretHolder.get();
    const githubBranch = "master";
    const endpoints: string[] = [
      "road/api/maintenance/v1/tracking/routes",
      "road/api/maintenance/v1/tracking/routes/latest",
    ];

    const check0 = makeNodepingCheck("Road", endpoints[0]!);
    const check1 = makeNodepingCheck("Road", endpoints[1]!);
    const checks: NodePingCheck[] = [check0, check1];

    const slackContact1 = makeContact(secret.nodePingContactIdSlack1);
    const slackContact2 = makeContact(secret.nodePingContactIdSlack2);
    const ghActionsContact = makeContact(
      `GitHub Actions for status ${githubBranch}`,
    );

    // Set all test created and gh contact missing for checks
    checks[0]!.notifications.push(
      { [secret.nodePingContactIdSlack1]: { delay: 0, schedule: "All" } },
      { [secret.nodePingContactIdSlack2]: { delay: 0, schedule: "All" } },
    );
    checks[1]!.notifications.push(
      { [secret.nodePingContactIdSlack1]: { delay: 0, schedule: "All" } },
      { [secret.nodePingContactIdSlack2]: { delay: 0, schedule: "All" } },
    );

    const app = {
      name: "Road",
      hostPart: "tie",
      url: "https://road/swagger.json",
      endpoints: [] satisfies MonitoredEndpoint[],
      excluded: [] satisfies string[],
    } as const satisfies MonitoredApp;

    const getNodepingContacts1: NodePingContact[] = [
      slackContact1,
      slackContact2,
    ];
    const getNodepingContacts2: NodePingContact[] = [
      ...getNodepingContacts1,
      ghActionsContact,
    ];

    await callWithStubsAndVerifyUpdateComponentsAndChecksForApp(
      app,
      endpoints,
      getNodepingContacts1,
      getNodepingContacts2,
      checks,
      "owner",
      "repo",
      githubBranch,
      "workflow.yaml",
    );
  });

  test("updateComponentsAndChecksForApp - missing check -> new check is created", async () => {
    const secret: UpdateStatusSecret = await secretHolder.get();
    const githubBranch = "master";
    const endpoints: string[] = [
      "/api/maintenance/v1/tracking/routes",
      "/api/maintenance/v1/tracking/routes/latest",
    ];

    const check0 = makeNodepingCheck("Road", endpoints[0]!, 1000);
    const checks: NodePingCheck[] = [check0];

    const slackContact1 = makeContact(secret.nodePingContactIdSlack1);
    const slackContact2 = makeContact(secret.nodePingContactIdSlack2);
    const ghActionsContact = makeContact(
      `GitHub Actions for status ${githubBranch}`,
    );

    // Set all notifications for existing check to ok
    checks[0]!.notifications.push(
      { [secret.nodePingContactIdSlack1]: { delay: 0, schedule: "All" } },
      { [secret.nodePingContactIdSlack2]: { delay: 0, schedule: "All" } },
      {
        [_.keys(ghActionsContact.addresses)[0]!]: { delay: 0, schedule: "All" },
      },
    );

    const app = {
      name: "Road",
      hostPart: "tie",
      url: "https://road/swagger.json",
      endpoints: [] satisfies MonitoredEndpoint[],
      excluded: [] satisfies string[],
    } as const satisfies MonitoredApp;

    const getNodepingContacts1: NodePingContact[] = [
      slackContact1,
      slackContact2,
      ghActionsContact,
    ];

    await callWithStubsAndVerifyUpdateComponentsAndChecksForApp(
      app,
      endpoints,
      getNodepingContacts1,
      getNodepingContacts1,
      checks,
      "owner",
      "repo",
      githubBranch,
      "workflow.yaml",
    );
  });
});

async function callWithStubsAndVerifyUpdateComponentsAndChecksForApp(
  app: MonitoredApp,
  endpoints: string[] = [],
  getNodepingContacts1: NodePingContact[] = [],
  getNodepingContacts2: NodePingContact[] = [],
  returnFromNodePing: NodePingCheck[] = [],
  gitHubOwner: string = "owner",
  gitHubRepo: string = "repo",
  gitHubBranch: string = "branch",
  gitHubWorkflowFile: string = "workflow.yaml",
): Promise<void> {
  const appEndpoints: AppWithEndpoints = {
    app: app.name,
    hostPart: app.hostPart,
    endpoints: endpoints,
    extraEndpoints: [],
  };

  const getAppEndpointsStub = jest
    .spyOn(digitrafficApi, "getAppWithEndpoints")
    .mockReturnValue(Promise.resolve(appEndpoints));
  const getNodePingChecksStub = jest
    .spyOn(nodePingApi, "getNodePingChecks")
    .mockReturnValue(Promise.resolve(returnFromNodePing));

  const getNodepingContactsStub = jest
    .spyOn(nodePingApi, "getNodepingContacts")
    .mockReturnValueOnce(Promise.resolve(Promise.resolve(getNodepingContacts1)))
    .mockReturnValueOnce(
      Promise.resolve(Promise.resolve(getNodepingContacts2)),
    );

  const createNodepingContactForCStateStub = jest
    .spyOn(nodePingApi, "createNodepingContactForCState")
    .mockReturnValue(Promise.resolve());

  const createNodepingCheckStub = jest
    .spyOn(nodePingApi, "createNodepingCheck")
    .mockReturnValue(Promise.resolve());
  const updateNodepingCheckStub = jest
    .spyOn(nodePingApi, "updateNodepingCheck")
    .mockReturnValue(Promise.resolve());

  await StatusService.updateComponentsAndChecks(
    [app],
    digitrafficApi,
    nodePingApi,
    secretHolder,
    gitHubOwner,
    gitHubRepo,
    gitHubBranch,
    gitHubWorkflowFile,
  );

  expect(getNodePingChecksStub).toHaveBeenCalledTimes(1);
  expect(getAppEndpointsStub).toHaveBeenCalledTimes(1);

  // if contacts are ok they are fetched once, if not, then they are created and fetched for second time
  const createContact = !_.isEqual(
    getNodepingContacts1.sort(),
    getNodepingContacts2.sort(),
  );
  const createCheck = endpoints.length !== returnFromNodePing.length;
  expect(getNodepingContactsStub).toHaveBeenCalledTimes(createContact ? 2 : 1);
  // we create github contact only if it not exist
  expect(createNodepingContactForCStateStub).toHaveBeenCalledTimes(
    createContact ? 1 : 0,
  );
  // Create check if missing
  expect(createNodepingCheckStub).toHaveBeenCalledTimes(createCheck ? 1 : 0);

  // We update gh contacts only if new contact is created and only for existing endpoint
  const updateTimes = createContact ? (createCheck ? 1 : 2) : 0;
  expect(updateNodepingCheckStub).toHaveBeenCalledTimes(updateTimes);
}

function makeContact(contactId: string): NodePingContact {
  return {
    name: contactId,
    custrole: "notify",
    addresses: {
      [contactId]: {},
    },
  };
}

function makeNodepingCheck(
  category: "Road" | "Marine" | "Rail",
  url: string,
  timeout: number = 10,
): NodePingCheck {
  return {
    _id: randomString(),
    label: `${category} ${url}`,
    type: "HTTPADV",
    state: 1,
    enable: "active",
    interval: 1,
    notifications: [],
    parameters: {
      target: url,
      method: EndpointHttpMethod.HEAD,
      threshold: timeout,
      sendheaders: {
        "accept-encoding": "gzip",
        "digitraffic-user": NODEPING_DIGITRAFFIC_USER,
      },
    },
  };
}
