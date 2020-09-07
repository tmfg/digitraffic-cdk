import * as pgPromise from "pg-promise";
import {handler} from '../../../../lib/lambda/update-services/lambda-update-services';
import {dbTestBase} from "../../db-testutil";
import {TestHttpServer} from "../../../../../../common/test/httpserver";
import {findAllServiceCodes} from "../../../../lib/db/db-services";

const SERVER_PORT = 8088;

process.env.ENDPOINT_USER = "some_user";
process.env.ENDPOINT_PASS = "some_pass";
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}`;

describe('update-services', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('update', async () => {
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/services.xml": () => {
                return fakeServices();
            }
        });

        try {
            await handler();
            expect((await findAllServiceCodes(db)).map(s => Number(s.service_code))).toMatchObject([171,198,199]);
        } finally {
            server.close();
        }
    });

}));

function fakeServices() {
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