import { dbTestBase } from "../../db-testutil.js";
import * as ServicesDb from "../../../db/services.js";
import { jest } from "@jest/globals";
import axios, { type AxiosRequestConfig } from "axios";

const SERVER_PORT = 8088;

// eslint-disable-next-line dot-notation
process.env["ENDPOINT_USER"] = "some_user";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_PASS"] = "some_pass";
// eslint-disable-next-line dot-notation
process.env["ENDPOINT_URL"] = `http://localhost:${SERVER_PORT}`;

const lambda = await import("../../../lambda/update-services/lambda-update-services.js");

describe(
    "update-services",
    dbTestBase((db) => {
        test("update", async () => {
            jest.spyOn(axios, "get").mockImplementation(
                (_url: string, _config?: AxiosRequestConfig<unknown>): Promise<unknown> => {
                    if (_url.match("/services.xml")) {
                        return Promise.resolve({
                            status: 200,
                            data: fakeServices()
                        });
                    }
                    return Promise.resolve({
                        status: 404
                    });
                }
            );

            await lambda.handler();
            expect(
                (await ServicesDb.findAllServiceCodes(db)).map((s) => Number(s.service_code))
            ).toMatchObject([171, 198, 199]);
        });
    })
);

function fakeServices(): string {
    return `
<?xml version="1.0" encoding="UTF-8" ?>
<services>
    <service>
        <service_code>171</service_code>
        <service_name>Katujen Kunto</service_name>
        <description>Onko tiessä kuoppa? Anna palautetta katujen kuntoon liittyen.</description>
        <metadata>false</metadata>
        <type>realtime</type>
        <keywords>tie,kuoppa</keywords>
        <group>Katujen kunto ja liikenne</group>
    </service>
    <service>
        <service_code>198</service_code>
        <service_name>Liikennemerkit</service_name>
        <description>Ilmoita, jos liikennemerkki on ajettu nurin, vinossa tai siinä on muuta huomautettavaa.</description>
        <metadata>false</metadata>
        <type>realtime</type>
        <keywords>liikennemerkki,valot</keywords>
        <group>Katujen kunto ja liikenne</group>
    </service>
    <service>
        <service_code>199</service_code>
        <service_name>Kyltit ja opasteet</service_name>
        <description>Ilmoita, jos kaupungin kylteissä ja opasteissa on huomautettavaa.</description>
        <metadata>false</metadata>
        <type>realtime</type>
        <keywords>kyltit,opasteet</keywords>
        <group>Katujen kunto ja liikenne</group>
    </service>
</services>
`;
}
