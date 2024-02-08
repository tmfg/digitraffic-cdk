import axios from "axios";
import * as util from "util";
import * as xml2js from "xml2js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function getXml<T>(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    path: string
): Promise<T> {
    const resp = await axios.get<string>(`${endpointUrl}${path}`, {
        headers: {
            Accept: "application/xml"
        },
        auth: {
            username: endpointUser,
            password: endpointPass
        }
    });

    if (resp.status !== 200) {
        logger.error({
            method: "open311ApiXMLApiUtils.getXml",
            message: `Query to ${path} failed status ${resp.status}`
        });
        throw Error(`Query to ${path} failed`);
    }

    const parse = util.promisify(xml2js.parseString);
    return (await parse(resp.data)) as T;
}
