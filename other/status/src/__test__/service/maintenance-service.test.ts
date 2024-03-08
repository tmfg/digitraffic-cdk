import { emptySecretHolder } from "../testutils.js";
import { NodePingApi, type NodePingCheck, type NodePingNotification } from "../../api/nodeping-api.js";
import {
    StatuspageApi,
    type StatuspageMaintenance,
    type StatuspageMaintenances
} from "../../api/statuspage.js";
import * as maintenanceService from "../../service/maintenance-service.js";
import { CStateStatuspageApi } from "../../api/cstate-statuspage-api.js";
import { SlackApi } from "@digitraffic/common/dist/utils/slack";
import _ from "lodash";
import { randomString } from "@digitraffic/common/dist/test/testutils";
import { EndpointHttpMethod } from "../../app-props.js";
import { jest } from "@jest/globals";

type MaintenanceChecksTo = "enabled" | "disabled" | "none";

let slackNotifyApi: SlackApi;
let cStateApi: CStateStatuspageApi;
let statuspageApi: StatuspageApi;
let nodePingApi: NodePingApi;

describe("MaintenanceServiceTest", () => {
    beforeAll(() => {
        const secretHolder = emptySecretHolder();
        slackNotifyApi = new SlackApi("");
        cStateApi = new CStateStatuspageApi("");
        statuspageApi = new StatuspageApi(secretHolder, "", 1000);
        nodePingApi = new NodePingApi(secretHolder, 1000, 10, 1);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    async function testHandleMaintenance(
        expectMaintenanceChecksTo: MaintenanceChecksTo = "none",
        statuspageApi_getActiveStatusPageMaintenances: StatuspageMaintenances = {
            scheduled_maintenances: []
        },
        cStateApi_isActiveMaintenances: boolean = false,
        nodePingApi_getNodePingChecks: NodePingCheck[] = []
    ): Promise<void> {
        const stubGetActiveStatusPageMaintenances = jest
            .spyOn(statuspageApi, "getActiveStatusPageMaintenances")
            .mockReturnValue(Promise.resolve(statuspageApi_getActiveStatusPageMaintenances));
        const stubCStateApiIsActiveMaintenances = jest
            .spyOn(cStateApi, "isActiveMaintenances")
            .mockReturnValue(Promise.resolve(cStateApi_isActiveMaintenances));

        const stubGetNodePingChecks = jest
            .spyOn(nodePingApi, "getNodePingChecks")
            .mockReturnValue(Promise.resolve(nodePingApi_getNodePingChecks));
        const stubDisableNodePingChecks = jest
            .spyOn(nodePingApi, "disableNodePingChecks")
            .mockReturnValue(Promise.resolve());
        const stubEnableNodePingChecks = jest
            .spyOn(nodePingApi, "enableNodePingChecks")
            .mockReturnValue(Promise.resolve());
        const stubSlackNotifyApi = jest.spyOn(slackNotifyApi, "notify").mockReturnValue(Promise.resolve());

        await maintenanceService.handleMaintenance(nodePingApi, cStateApi, slackNotifyApi, statuspageApi);

        expect(stubGetActiveStatusPageMaintenances).toHaveBeenCalledTimes(1);
        expect(stubCStateApiIsActiveMaintenances).toHaveBeenCalledTimes(1);
        expect(stubGetNodePingChecks).toHaveBeenCalledTimes(1);

        const enabledCount = nodePingApi_getNodePingChecks
            .filter((c) => c.enable === "active")
            .reduce((sum) => sum++, 0);
        const disabledCount = nodePingApi_getNodePingChecks
            .filter((c) => c.enable === "inactive")
            .reduce((sum) => sum++, 0);

        if (expectMaintenanceChecksTo === "enabled") {
            expect(stubEnableNodePingChecks).toHaveBeenCalledTimes(1);
            expect(stubDisableNodePingChecks).not.toHaveBeenCalled();
            expect(stubSlackNotifyApi).toHaveBeenCalledTimes(1);
            expect(stubSlackNotifyApi).toHaveBeenCalledWith(expect.stringContaining("enabled"));
            expect(stubSlackNotifyApi).toHaveBeenCalledWith(
                expect.stringContaining(disabledCount.toString())
            );
        } else if (expectMaintenanceChecksTo === "disabled") {
            expect(stubEnableNodePingChecks).not.toHaveBeenCalled();
            expect(stubDisableNodePingChecks).toHaveBeenCalledTimes(1);
            expect(stubSlackNotifyApi).toHaveBeenCalledTimes(1);
            expect(stubSlackNotifyApi).toHaveBeenCalledWith(expect.stringContaining("disabled"));
            expect(stubSlackNotifyApi).toHaveBeenCalledWith(expect.stringContaining(enabledCount.toString()));
        } else {
            expect(stubEnableNodePingChecks).not.toHaveBeenCalled();
            expect(stubDisableNodePingChecks).not.toHaveBeenCalled();
            expect(stubSlackNotifyApi).not.toHaveBeenCalled();
        }
    }

    test("No maintenance & checks active -> no change", async () =>
        await testHandleMaintenance(
            "none",
            getActiveStatuspageMaintenances(0),
            false,
            getNodePingChecks(10, true)
        ));

    test("Maintenance on CState & checks enabled -> checks disabled", async () =>
        await testHandleMaintenance(
            "disabled",
            getActiveStatuspageMaintenances(0),
            true,
            getNodePingChecks(10, true)
        ));

    test("Maintenance on StatusPage & checks enabled -> checks disabled", async () =>
        await testHandleMaintenance(
            "disabled",
            getActiveStatuspageMaintenances(1),
            false,
            getNodePingChecks(10, true)
        ));

    test("No maintenance & checks disabled -> checks enabled", async () =>
        await testHandleMaintenance(
            "enabled",
            getActiveStatuspageMaintenances(0),
            false,
            getNodePingChecks(10, false)
        ));

    test("Maintenance on CState & checks disabled -> no change", async () =>
        await testHandleMaintenance(
            "none",
            getActiveStatuspageMaintenances(0),
            true,
            getNodePingChecks(10, false)
        ));

    test("Maintenance on StatusPage & checks disabled -> no change", async () =>
        await testHandleMaintenance(
            "none",
            getActiveStatuspageMaintenances(10),
            false,
            getNodePingChecks(10, false)
        ));
});

function getActiveStatuspageMaintenances(maintenancesCount: number): StatuspageMaintenances {
    return {
        scheduled_maintenances: _.range(maintenancesCount).map(
            () =>
                ({
                    scheduled_for: new Date().toUTCString(),
                    scheduled_until: new Date().toUTCString()
                }) as const satisfies StatuspageMaintenance
        )
    };
}

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
