import {mustContain, responseChecker, UrlChecker} from "digitraffic-common/canaries/url-checker";

const hostname = process.env.hostname as string;

export const handler = async () => {
    const checker = new UrlChecker(hostname);

    await checker.expect200("/api/aton/v1/faults?language=sv", responseChecker((body: string) => {
        mustContain(body, 'Registrerad');
    }));
    await checker.expect200("/api/aton/v1/faults?language=fi", responseChecker((body: string) => {
        mustContain(body, 'Kirjattu');
    }));

    return checker.done();
}
