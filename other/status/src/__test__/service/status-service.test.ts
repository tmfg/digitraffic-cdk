import * as StatusService from "../../service/status-service.js";
import {
    NODEPING_DIGITRAFFIC_USER,
    NodePingApi,
    type NodePingCheck,
    type NodePingContact
} from "../../api/nodeping-api.js";
import {
    StatuspageApi,
    type StatuspageComponent,
    StatuspageComponentStatus,
    type StatuspageMaintenances
} from "../../api/statuspage.js";
import { randomString } from "@digitraffic/common/dist/test/testutils";
import { EndpointHttpMethod, type MonitoredApp, type MonitoredEndpoint } from "../../app-props.js";
import { emptySecretHolder, mockSecretHolder, setTestEnv } from "../testutils.js";
import {
    type CStateStatus,
    CStateStatuspageApi,
    type CStateSystem,
    type PinnedIssue
} from "../../api/cstate-statuspage-api.js";
import type { AppWithEndpoints } from "../../model/app-with-endpoints.js";
import { DigitrafficApi } from "../../api/digitraffic-api.js";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import type { UpdateStatusSecret } from "../../secret.js";
import _ from "lodash";
import { jest } from "@jest/globals";

let cStateApi: CStateStatuspageApi;
let statuspageApi: StatuspageApi;
let nodePingApi: NodePingApi;
let digitrafficApi: DigitrafficApi;
let secretHolder: SecretHolder<UpdateStatusSecret>;

const defaultApiLabel = "/api/foo/v1/bar" as const;
const defaultCStateApiLabel = `road${defaultApiLabel}` as const;
const emptyCStateStatus: CStateStatus = {
    pinnedIssues: [] satisfies PinnedIssue[],
    systems: [] satisfies CStateSystem[]
} as const satisfies CStateStatus;

const defaultCStateSystem = {
    name: defaultCStateApiLabel,
    status: "ok",
    category: "Road",
    description: ""
} as const satisfies CStateSystem;

describe("StatusServiceTest", () => {
    beforeAll(() => {
        setTestEnv();
        secretHolder = mockSecretHolder();
        statuspageApi = new StatuspageApi(secretHolder, "statuspageUrl", 1000);
        nodePingApi = new NodePingApi(secretHolder, 1000, 1000, 1);
        cStateApi = new CStateStatuspageApi("cStatePageUrl");
        digitrafficApi = new DigitrafficApi();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    async function testGetNodePingAndStatuspageComponentNotInSyncStatuses(
        expectationFn: (statuses: string[]) => void,
        returnFromStatuspage: StatuspageComponent[] = [],
        returnFromCStateStatus: CStateStatus = emptyCStateStatus,
        returnFromNodePing: NodePingCheck[] = [],
        returnFromStatusPageMaintenances: StatuspageMaintenances = { scheduled_maintenances: [] }
    ): Promise<void> {
        jest.spyOn(statuspageApi, "getStatuspageComponents").mockReturnValue(
            Promise.resolve(returnFromStatuspage)
        );
        jest.spyOn(statuspageApi, "getActiveStatusPageMaintenances").mockReturnValue(
            Promise.resolve(returnFromStatusPageMaintenances)
        );
        jest.spyOn(nodePingApi, "getNodePingChecks").mockReturnValue(Promise.resolve(returnFromNodePing));
        jest.spyOn(cStateApi, "getStatus").mockReturnValue(Promise.resolve(returnFromCStateStatus));

        const statuses = await StatusService.getNodePingAndStatuspageComponentNotInSyncStatuses(
            statuspageApi,
            nodePingApi,
            cStateApi
        );

        expectationFn(statuses);
    }

    test("getNodePingAndStatuspageComponentStatuses - returns nothing", async () =>
        await testGetNodePingAndStatuspageComponentNotInSyncStatuses((statuses: string[]) =>
            expect(statuses.length).toBe(0)
        ));

    test("getNodePingAndStatuspageComponentStatuses - missing Statuspage and cstate component", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(2);
                expect(statuses[0]).toBe(`${defaultApiLabel}: Statuspage component missing`);
                expect(statuses[1]).toBe(`${defaultApiLabel}: CState Statuspage system missing`);
            },
            [],
            emptyCStateStatus,
            [{ label: defaultApiLabel, state: 1 } as NodePingCheck]
        ));

    test("getNodePingAndStatuspageComponentStatuses - missing NodePing check", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(1);
                expect(statuses[0]).toBe(`${defaultApiLabel}: NodePing check missing`);
            },
            [
                {
                    name: defaultApiLabel,
                    id: "someid",
                    group_id: "somegroupid",
                    status: StatuspageComponentStatus.operational
                }
            ]
        ));

    test("getNodePingAndStatuspageComponentStatuses - missing CState system from NodePing check", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(1);
                expect(statuses[0]).toBe(`${defaultCStateSystem.name}: NodePing check missing`);
            },
            [],
            { ...emptyCStateStatus, systems: [defaultCStateSystem] },
            []
        ));

    test("getNodePingAndStatuspageComponentStatuses - Statuspage component groups don't create checks", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(0);
            },
            [
                {
                    name: "testcomponent",
                    id: "someid",
                    group_id: null,
                    status: StatuspageComponentStatus.operational
                }
            ]
        ));

    test("getNodePingAndStatuspageComponentStatuses - NodePing check UP, Statuspage check DOWN, CState DOWN", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(2);
                expect(statuses[0]).toBe(
                    `${defaultApiLabel}: NodePing check is UP, Statuspage component is DOWN`
                );
                expect(statuses[1]).toBe(
                    `${defaultCStateApiLabel}: NodePing check is UP, CState statuspage component is DOWN`
                );
            },
            [
                {
                    name: defaultApiLabel,
                    id: "someid",
                    group_id: "somegroupid",
                    status: StatuspageComponentStatus.major_outage
                }
            ],
            {
                ...emptyCStateStatus,
                systems: [{ ...defaultCStateSystem, status: "down" }]
            },
            [
                {
                    label: defaultApiLabel,
                    state: 1
                } as NodePingCheck
            ]
        ));

    test("getNodePingAndStatuspageComponentStatuses - NodePing check DOWN, Statuspage check UP, CState down", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(1);
                expect(statuses[0]).toBe(
                    `${defaultApiLabel}: NodePing check is DOWN, Statuspage component is UP`
                );
            },
            [
                {
                    name: defaultApiLabel,
                    id: "someid",
                    group_id: "somegroupid",
                    status: StatuspageComponentStatus.operational
                }
            ],
            { ...emptyCStateStatus, systems: [{ ...defaultCStateSystem, status: "down" }] },
            [
                {
                    label: defaultApiLabel,
                    state: 0
                } as NodePingCheck
            ]
        ));

    test("getNodePingAndStatuspageComponentStatuses - NodePing check DOWN, Statuspage check DOWN & CState statuspage check UP", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(1);
                expect(statuses[0]).toBe(
                    `${defaultCStateApiLabel}: NodePing check is DOWN, CState statuspage component is UP`
                );
            },
            [
                {
                    name: defaultApiLabel,
                    id: "someid",
                    group_id: "somegroupid",
                    status: StatuspageComponentStatus.major_outage
                }
            ],
            { ...emptyCStateStatus, systems: [{ ...defaultCStateSystem }] },
            [
                {
                    label: defaultApiLabel,
                    state: 0
                } as NodePingCheck
            ]
        ));

    test("getNodePingAndStatuspageComponentStatuses - app name is stripped", async () =>
        testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(0);
            },
            [
                {
                    name: defaultApiLabel,
                    id: "someid",
                    group_id: "somegroupid",
                    status: StatuspageComponentStatus.operational
                }
            ],
            { ...emptyCStateStatus, systems: [defaultCStateSystem] },
            [
                {
                    label: `Road ${defaultApiLabel}`,
                    state: 1
                } as NodePingCheck
            ]
        ));

    test("getNodePingAndStatuspageComponentStatuses - custom api names with spaces", async () => {
        const customName1StatusPage = "Rail Data is Up To Date";
        const customName1CState = "rail/data-is-up-to-date";
        const customName1NodePing = "Rail Data is Up To Date";
        await testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(0);
            },
            [
                {
                    name: customName1StatusPage,
                    id: "someid",
                    group_id: "somegroupid",
                    status: StatuspageComponentStatus.operational
                }
            ],
            { ...emptyCStateStatus, systems: [{ ...defaultCStateSystem, name: customName1CState }] },
            [
                {
                    label: customName1NodePing,
                    state: 1
                } as NodePingCheck
            ]
        );
    });

    test("getNodePingAndStatuspageComponentStatuses - custom api names with spaces and dashes", async () => {
        const customName1StatusPage = "Rail infra-api Swagger";
        const customName1CState = "rail/infra-api/swagger";
        const customName1NodePing = "Rail infra-api Swagger";
        await testGetNodePingAndStatuspageComponentNotInSyncStatuses(
            (statuses: string[]) => {
                expect(statuses.length).toBe(0);
            },
            [
                {
                    name: customName1StatusPage,
                    id: "someid",
                    group_id: "somegroupid",
                    status: StatuspageComponentStatus.operational
                }
            ],
            { ...emptyCStateStatus, systems: [{ ...defaultCStateSystem, name: customName1CState }] },
            [
                {
                    label: customName1NodePing,
                    state: 1
                } as NodePingCheck
            ]
        );
    });

    test("updateChecks - check is updated", async () => {
        const secret: UpdateStatusSecret = await secretHolder.get();
        const nodePingApi = new NodePingApi(emptySecretHolder(), 1000, 10, 1);

        const checks: NodePingCheck[] = [
            {
                _id: randomString(),
                label: randomString(),
                type: "HTTPADV",
                state: 1,
                enable: "active",
                interval: 1,
                notifications: [],
                parameters: {
                    target: "http://some.url",
                    method: EndpointHttpMethod.HEAD,
                    threshold: 10,
                    sendheaders: {}
                }
            }
        ];

        const slackContact = makeContact(secret.nodePingContactIdSlack1);
        const contact = makeContact(`Road ${checks[0]?.label}`);
        const ghContact = makeContact("gh-contact-id");

        const nodePingApiCreateNodepingCheckSpy = jest
            .spyOn(nodePingApi, "createNodepingCheck")
            .mockReturnValue(Promise.resolve());

        const nodePingApiUpdateSpy = jest
            .spyOn(nodePingApi, "updateNodepingCheck")
            .mockReturnValue(Promise.resolve());

        await StatusService.updateChecks(
            checks,
            [_.keys(slackContact.addresses)[0]!],
            "gh-contact-id",
            [contact, ghContact, slackContact],
            nodePingApi,
            [],
            "Road"
        );

        expect(nodePingApiUpdateSpy).toHaveBeenCalledTimes(1);
        expect(nodePingApiCreateNodepingCheckSpy).not.toHaveBeenCalled();
    });

    test("updateComponentsAndChecksForApp - missing check -> new check is created", async () => {
        const secret: UpdateStatusSecret = await secretHolder.get();
        const githubBranch = "master";
        const endpoints: string[] = [
            "road/api/maintenance/v1/tracking/routes",
            "road/api/maintenance/v1/tracking/routes/latest"
        ];

        const check0 = makeNodepingCheck("Road", endpoints[0]!);
        const check1 = makeNodepingCheck("Road", endpoints[1]!);
        const checks: NodePingCheck[] = [check0];

        const slackContact1 = makeContact(secret.nodePingContactIdSlack1);
        const slackContact2 = makeContact(secret.nodePingContactIdSlack2);
        const check_0_contact = makeContact(check0.label);
        const check_1_contact = makeContact(check1.label);
        const ghActionsContact = makeContact(`GitHub Actions for status ${githubBranch}`);

        // Set all notifications for existing check to ok
        checks[0]!.notifications.push(
            { [secret.nodePingContactIdSlack1]: { delay: 0, schedule: "All" } },
            { [secret.nodePingContactIdSlack2]: { delay: 0, schedule: "All" } },
            { [_.keys(check_0_contact.addresses)[0]!]: { delay: 0, schedule: "All" } },
            { [_.keys(ghActionsContact.addresses)[0]!]: { delay: 0, schedule: "All" } }
        );

        const app = {
            name: "Road",
            hostPart: "tie",
            url: "https://road/swagger.json",
            endpoints: [] satisfies MonitoredEndpoint[],
            excluded: [] satisfies string[]
        } as const satisfies MonitoredApp;

        const getStatuspageComponents1: StatuspageComponent[] = [makeStatuspageComponent(endpoints[0]!)];
        const getStatuspageComponents2: StatuspageComponent[] = [
            getStatuspageComponents1[0]!,
            makeStatuspageComponent(endpoints[1]!)
        ];

        const getNodepingContacts1: NodePingContact[] = [
            slackContact1,
            slackContact2,
            ghActionsContact,
            check_0_contact
        ];
        const getNodepingContacts2: NodePingContact[] = [...getNodepingContacts1, check_1_contact];

        await callWithStubsAndVerifyUpdateComponentsAndChecksForApp(
            app,
            endpoints,
            getStatuspageComponents1,
            getStatuspageComponents2,
            getNodepingContacts1,
            getNodepingContacts2,
            checks,
            "owner",
            "repo",
            githubBranch,
            "workflow.yaml"
        );
    });
});

async function callWithStubsAndVerifyUpdateComponentsAndChecksForApp(
    app: MonitoredApp,
    endpoints: string[] = [],
    getStatuspageComponents: StatuspageComponent[] = [],
    getStatuspageComponentsAfterUpdate: StatuspageComponent[] = [],
    getNodepingContacts1: NodePingContact[] = [],
    getNodepingContacts2: NodePingContact[] = [],
    returnFromNodePing: NodePingCheck[] = [],
    gitHubOwner: string = "owner",
    gitHubRepo: string = "repo",
    gitHubBranch: string = "branch",
    gitHubWorkflowFile: string = "workflow.yaml"
): Promise<void> {
    const appEndpoints: AppWithEndpoints = {
        app: app.name,
        hostPart: app.hostPart,
        endpoints: endpoints,
        extraEndpoints: []
    };

    const getAppEndpointsStub = jest
        .spyOn(digitrafficApi, "getAppWithEndpoints")
        .mockReturnValue(Promise.resolve(appEndpoints));
    const getNodePingChecksStub = jest
        .spyOn(nodePingApi, "getNodePingChecks")
        .mockReturnValue(Promise.resolve(returnFromNodePing));
    const getStatuspageComponentsStub = jest
        .spyOn(statuspageApi, "getStatuspageComponents")
        .mockReturnValueOnce(Promise.resolve(getStatuspageComponents))
        .mockReturnValueOnce(Promise.resolve(getStatuspageComponentsAfterUpdate));

    const createStatuspageComponentStub = jest
        .spyOn(statuspageApi, "createStatuspageComponent")
        .mockReturnValue(Promise.resolve());

    const getNodepingContactsStub = jest
        .spyOn(nodePingApi, "getNodepingContacts")
        .mockReturnValueOnce(Promise.resolve(Promise.resolve(getNodepingContacts1)))
        .mockReturnValueOnce(Promise.resolve(Promise.resolve(getNodepingContacts2)));

    const createStatuspageContactStub = jest
        .spyOn(nodePingApi, "createStatuspageContact")
        .mockReturnValue(Promise.resolve());
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
        statuspageApi,
        nodePingApi,
        secretHolder,
        gitHubOwner,
        gitHubRepo,
        gitHubBranch,
        gitHubWorkflowFile
    );

    expect(getNodePingChecksStub).toHaveBeenCalledTimes(1);
    expect(getAppEndpointsStub).toHaveBeenCalledTimes(1);
    expect(getStatuspageComponentsStub).toHaveBeenCalledTimes(2);
    expect(createStatuspageComponentStub).toHaveBeenCalledTimes(1);

    expect(getNodepingContactsStub).toHaveBeenCalledTimes(2);
    expect(createStatuspageContactStub).toHaveBeenCalledTimes(1);
    // we already have github contact
    expect(createNodepingContactForCStateStub).not.toHaveBeenCalled();
    expect(createNodepingCheckStub).toHaveBeenCalledTimes(1);

    // We only create new check and old check is already uptodate
    expect(updateNodepingCheckStub).not.toHaveBeenCalled();
}

function makeContact(contactId: string): NodePingContact {
    return {
        name: contactId,
        custrole: "notify",
        addresses: {
            [contactId]: {}
        }
    };
}

function makeStatuspageComponent(endpoint: string): StatuspageComponent {
    return {
        name: endpoint,
        id: randomString(),
        group_id: "road-group",
        status: StatuspageComponentStatus.operational
    };
}

function makeNodepingCheck(category: "Road" | "Marine" | "Rail", url: string): NodePingCheck {
    return {
        _id: randomString(),
        label: `${category} ${url}`,
        type: "HTTPADV",
        state: 1,
        enable: "active",
        interval: 1,
        notifications: [],
        parameters: {
            target: "http://some.url",
            method: EndpointHttpMethod.HEAD,
            threshold: 1000,
            sendheaders: {
                "accept-encoding": "gzip",
                "digitraffic-user": NODEPING_DIGITRAFFIC_USER
            }
        }
    };
}
