import { StatusReportApi } from "../../api/statusreport-api.js";
import type { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { mockSecretHolder, setTestEnv } from "../testutils.js";
import axios, { type AxiosRequestConfig } from "axios";
import type { UpdateStatusSecret } from "../../secret.js";
import { jest } from "@jest/globals";

let statusReportApi: StatusReportApi;
let secretHolder: SecretHolder<UpdateStatusSecret>;

describe("StatusReportApiTest", () => {
    beforeAll(() => {
        setTestEnv();
        secretHolder = mockSecretHolder();
        statusReportApi = new StatusReportApi(secretHolder);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("sendReport - one line", async () => {
        await expectFor("line", ["line"]);
    });

    test("sendReport - multiple lines", async () => {
        const line1 = "This is line one!";
        const line2 = "This is line two!";
        const line3 = "This is line three!";
        await expectFor(`${line1}\n${line2}\n${line3}`, [line1, line2, line3]);
    });

    test("sendReport - multiple lines with empty", async () => {
        const line1 = "This is line one!";
        const line2 = null as unknown as string;
        const line3 = "This is line three!";
        await expectFor(`${line1}\n\n${line3}`, [line1, line2, line3]);
    });

    test("sendReport - null parameter", async () => {
        const lines = null as unknown as string[];
        await expectFor("", lines);
    });

    test("sendReport - undefined parameter", async () => {
        const lines = undefined as unknown as string[];
        await expectFor("", lines);
    });

    async function expectFor(expected: string, reportLines: string[]): Promise<void> {
        const secret = await secretHolder.get();
        const spy = jest
            .spyOn(axios, "post")
            .mockImplementation(
                (_url: string, data?: unknown, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                    expect(_url).toEqual(secret.reportUrl);
                    expect(data).toEqual(JSON.stringify({ text: `${expected}` }));

                    return Promise.resolve({
                        status: 200,
                        data: {}
                    });
                }
            );
        await statusReportApi.sendReport(reportLines);
        expect(spy).toHaveBeenCalledTimes(1);
    }
});
