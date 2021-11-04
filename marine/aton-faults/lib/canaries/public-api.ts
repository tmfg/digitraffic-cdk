import {ResponseChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";
import assert from "assert";

const hostname = process.env.hostname as string;

export const handler = async () => {
    const checker = new UrlChecker(hostname);
    const rs = ResponseChecker.forGeojson();

    await checker.expect200("/api/aton/v1/faults?language=fi", rs.checkJson((json: any) => {
        assert.ok(json.features.length > 10);
        assert.ok(json.features.some((f:any) => f.properties.state === 'Kirjattu'));
    }));

    await checker.expect200("/api/aton/v1/faults?language=sv", rs.checkJson((json: any) => {
        assert.ok(json.features.length > 10);
        assert.ok(json.features.some((f:any) => f.properties.state === 'Registrerad'));
    }));

    // unknown locale ge -> english is used
    await checker.expect200("/api/aton/v1/faults?language=ge", rs.checkJson((json: any) => {
        assert.ok(json.features.length > 10);
        assert.ok(json.features.some((f:any) => f.properties.state === 'Registered'));
    }));

    return checker.done();
}
