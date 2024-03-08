import { CStateStatuspageApi } from "../../api/cstate-statuspage-api.js";
import { getRandomInteger } from "@digitraffic/common/dist/test/testutils";
import { add, sub } from "date-fns";
import { getCstateIndexJson, SERVER_PORT } from "../testutils.js";
import axios, { type AxiosRequestConfig } from "axios";
import { jest } from "@jest/globals";

const C_STATE_PAGE_URL = `http://localhost:${SERVER_PORT}`;

const cStateApi = new CStateStatuspageApi(C_STATE_PAGE_URL);

describe("CStateApiTest", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test("getStatus - no maintenances", async () => {
        await expectMaintenance([], false);
    });

    test("getStatus - active maintenance, not with NodePing disable", async () => {
        await expectMaintenance([{ disableNodeping: false, start: getDateInPast() }], false);
    });

    test("getStatus - active maintenance, with NodePing disable", async () => {
        await expectMaintenance([{ disableNodeping: true, start: getDateInPast() }], true);
    });

    test("getStatus - future maintenance, not with NodePing disable", async () => {
        await expectMaintenance([{ disableNodeping: false, start: getDateInFuture() }], false);
    });

    test("getStatus - future maintenance, with NodePing disable", async () => {
        await expectMaintenance([{ disableNodeping: true, start: getDateInFuture() }], false);
    });

    test("getStatus - future maintenance in 1 minute, with NodePing disable should activate", async () => {
        await expectMaintenance([{ disableNodeping: true, start: getDateInFuture(30) }], true);
    });

    interface TestMaintenance {
        readonly disableNodeping: boolean;
        readonly start: Date;
    }

    async function expectMaintenance(
        maintenances: TestMaintenance[],
        expectMaintenance: boolean
    ): Promise<void> {
        const spy = jest
            .spyOn(axios, "get")
            .mockImplementation((_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                expect(_url).toEqual(`${C_STATE_PAGE_URL}/index.json`);
                return Promise.resolve({
                    status: 200,
                    data: getCstateIndexJson(maintenances)
                });
            });
        const result = await cStateApi.isActiveMaintenances();
        expect(result).toBe(expectMaintenance);
        expect(spy).toHaveBeenCalledTimes(1);
    }

    function getDateInPast(seconds?: number): Date {
        return sub(new Date(), { seconds: seconds ?? getRandomInteger(60, 10 * 60) });
    }

    function getDateInFuture(seconds?: number): Date {
        return add(new Date(), { seconds: seconds ?? getRandomInteger(2 * 60, 10 * 60) });
    }
});
