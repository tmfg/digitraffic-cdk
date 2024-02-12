// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "Test";

const { handler } = await import("../../../lambda/update-disruptions/update-disruptions.js");
const { disruptionFeatures } = await import("../../testdata.js");
const { dbTestBase } = await import("../../db-testutil.js");
const DisruptionsDb = await import("../../../db/disruptions.js");
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
const { ProxyHolder } = await import("@digitraffic/common/dist/aws/runtime/secrets/proxy-holder");
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { jest } from "@jest/globals";
import axios, { type AxiosRequestConfig } from "axios";

const SERVER_PORT = 8089;

const testSecret = {
    url: `http://localhost:${SERVER_PORT}/`
};
describe(
    "lambda-update-disruptions",
    dbTestBase((db: DTDatabase) => {
        jest.spyOn(ProxyHolder.prototype, "setCredentials").mockReturnValueOnce(Promise.resolve());
        jest.spyOn(SecretHolder.prototype, "get").mockReturnValueOnce(Promise.resolve(testSecret));

        test("Update", async () => {
            const features = disruptionFeatures();
            jest.spyOn(axios, "get").mockImplementation(
                (_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                    return Promise.resolve({
                        status: 200,
                        data: features
                    });
                }
            );

            await handler();
            const disruptions = await DisruptionsDb.findAll(db);
            expect(disruptions.length).toBe(features.features.length);
        });
    })
);
