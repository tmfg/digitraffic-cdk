import { emptySecretHolder, getActiveMaintenance } from "../testutils.js";
import { NodePingApi, type NodePingCheck, type NodePingNotification } from "../../api/nodeping-api.js";
import * as maintenanceService from "../../service/maintenance-service.js";
import { type ActiveMaintenance, CStateStatuspageApi } from "../../api/cstate-statuspage-api.js";
import { SlackApi } from "@digitraffic/common/dist/utils/slack";
import _ from "lodash";
import { randomString } from "@digitraffic/common/dist/test/testutils";
import { EndpointHttpMethod } from "../../app-props.js";
import { jest } from "@jest/globals";

type MaintenanceChecksTo = "enabled" | "disabled" | "none";

let slackNotifyApi: SlackApi;
let cStateApi: CStateStatuspageApi;
let nodePingApi: NodePingApi;

describe("MaintenanceServiceTest", () => {
    beforeAll(() => {
        const secretHolder = emptySecretHolder();
        slackNotifyApi = new SlackApi("");
        cStateApi = new CStateStatuspageApi("", "", "", "", "", secretHolder);
        nodePingApi = new NodePingApi(secretHolder, 1000, 10, 1);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    async function testHandleMaintenance(
        expectMaintenanceChecksTo: MaintenanceChecksTo = "none",
        cStateApiActiveMaintenance: ActiveMaintenance | undefined = undefined,
        nodePingApi_getNodePingChecks: NodePingCheck[] = [],
        nodePingApi_getNodePingChecksSecondCall: NodePingCheck[] = []
    ): Promise<void> {
        const stubCStateApiIsActiveMaintenances = jest
            .spyOn(cStateApi, "isActiveMaintenances")
            .mockReturnValue(Promise.resolve(cStateApiActiveMaintenance !== undefined));

        const stubCStateApiFindActiveMaintenance = jest
            .spyOn(cStateApi, "findActiveMaintenance")
            .mockReturnValue(Promise.resolve(cStateApiActiveMaintenance));

        const stubCStateApiTriggerUpdateMaintenanceGithubAction = jest
            .spyOn(cStateApi, "triggerUpdateMaintenanceGithubAction")
            .mockReturnValue(Promise.resolve());

        const stubGetNodePingChecks = jest
            .spyOn(nodePingApi, "getNodePingChecks")
            .mockReturnValueOnce(Promise.resolve(nodePingApi_getNodePingChecks));
        if (expectMaintenanceChecksTo === "enabled") {
            // Second call
            stubGetNodePingChecks.mockReturnValueOnce(
                Promise.resolve(nodePingApi_getNodePingChecksSecondCall)
            );
        }
        const stubDisableNodePingChecks = jest
            .spyOn(nodePingApi, "disableNodePingChecks")
            .mockReturnValue(Promise.resolve());
        const stubEnableNodePingChecks = jest
            .spyOn(nodePingApi, "enableNodePingChecks")
            .mockReturnValue(Promise.resolve());
        const stubSlackNotifyApi = jest.spyOn(slackNotifyApi, "notify").mockReturnValue(Promise.resolve());

        await maintenanceService.handleMaintenance(nodePingApi, cStateApi, slackNotifyApi);

        expect(stubCStateApiIsActiveMaintenances).toHaveBeenCalledTimes(0);
        expect(stubCStateApiFindActiveMaintenance).toHaveBeenCalledTimes(1);

        if (expectMaintenanceChecksTo === "enabled") {
            // Extra call after enabling checks to see there is no more enabled checks
            expect(stubGetNodePingChecks).toHaveBeenCalledTimes(2);
        } else {
            expect(stubGetNodePingChecks).toHaveBeenCalledTimes(1);
        }

        const enabledCount = nodePingApi_getNodePingChecks
            .filter((c) => c.enable === "active")
            .reduce((sum) => sum++, 0);
        const disabledCount = nodePingApi_getNodePingChecks
            .filter((c) => c.enable === "inactive")
            .reduce((sum) => sum++, 0);

        if (expectMaintenanceChecksTo === "enabled") {
            expect(stubEnableNodePingChecks).toHaveBeenCalledTimes(1);
            expect(stubDisableNodePingChecks).not.toHaveBeenCalled();
            expect(stubCStateApiTriggerUpdateMaintenanceGithubAction).toHaveBeenCalledTimes(0);
            expect(stubSlackNotifyApi).toHaveBeenCalledTimes(1);
            expect(stubSlackNotifyApi).toHaveBeenCalledWith(
                expect.stringContaining("Maintenance has ended!")
            );
            // If there is still NodePing checks disabled then message should contain notice of it.
            if (nodePingApi_getNodePingChecksSecondCall.length) {
                expect(stubSlackNotifyApi).toHaveBeenCalledWith(
                    expect.stringContaining(
                        `but still ${nodePingApi_getNodePingChecksSecondCall.length} are in inactive state`
                    )
                );
            } else {
                expect(stubSlackNotifyApi).toHaveBeenCalledWith(expect.not.stringContaining(`but`));
            }

            expect(stubSlackNotifyApi).toHaveBeenCalledWith(
                expect.stringContaining(disabledCount.toString())
            );
        } else if (expectMaintenanceChecksTo === "disabled") {
            expect(stubEnableNodePingChecks).not.toHaveBeenCalled();
            expect(stubDisableNodePingChecks).toHaveBeenCalledTimes(1);
            expect(stubCStateApiTriggerUpdateMaintenanceGithubAction).toHaveBeenCalledTimes(1);
            expect(stubCStateApiTriggerUpdateMaintenanceGithubAction).toHaveBeenCalledWith(
                cStateApiActiveMaintenance
            );
            expect(stubSlackNotifyApi).toHaveBeenCalledTimes(1);
            expect(stubSlackNotifyApi).toHaveBeenCalledWith(expect.stringContaining("disabled"));
            expect(stubSlackNotifyApi).toHaveBeenCalledWith(expect.stringContaining(enabledCount.toString()));
        } else {
            expect(stubEnableNodePingChecks).not.toHaveBeenCalled();
            expect(stubDisableNodePingChecks).not.toHaveBeenCalled();
            expect(stubSlackNotifyApi).not.toHaveBeenCalled();
        }
    }

    test("No maintenance on CState & checks active -> no change", async () =>
        await testHandleMaintenance("none", undefined, getNodePingChecks(10, true)));

    test("Maintenance on CState & checks enabled -> checks disabled", async () =>
        await testHandleMaintenance("disabled", getActiveMaintenance(), getNodePingChecks(10, true)));

    test("No maintenance on CState & checks disabled -> checks enabled", async () =>
        await testHandleMaintenance("enabled", undefined, getNodePingChecks(10, false)));

    test("No maintenance on CState & checks disabled -> checks enabled but sill found one enabled checks", async () =>
        await testHandleMaintenance(
            "enabled",
            undefined,
            getNodePingChecks(10, false),
            getNodePingChecks(1, false)
        ));

    test("Maintenance on CState & checks disabled -> no change", async () =>
        await testHandleMaintenance("none", getActiveMaintenance(), getNodePingChecks(10, false)));
});

function getNodePingChecks(checksCount: number, checksActive: boolean): NodePingCheck[] {
    return _.range(checksCount).map(
        () =>
            ({
                _id: randomString(),
                enable: checksActive ? "active" : "inactive",
                interval: 1,
                label: `Marine /api/ais/v1/${randomString()}`,
                notifications: [] as unknown as NodePingNotification[],
                parameters: { method: EndpointHttpMethod.GET, sendheaders: {}, target: "", threshold: 0 },
                state: 1,
                type: "HTTPADV"
            }) as const satisfies NodePingCheck
    );
}
