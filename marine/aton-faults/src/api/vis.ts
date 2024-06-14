import { Agent, request } from "undici";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";

export async function postDocument(
    faultS124: string,
    url: string,
    ca: string,
    clientCertificate: string,
    privateKey: string
): Promise<void> {
    logger.info({
        method: "VisApi.postDocument",
        customUrl: url
    });

    // try-catch so axios won't log keys/certs
    try {
        const resp = await request(url, {
            method: "POST",
            body: faultS124,
            dispatcher: new Agent({
                connect: {
                    ca,
                    cert: clientCertificate,
                    key: privateKey
                }
            }),
            headers: {
                "Content-Type": "text/xml;charset=utf-8"
            }
        });

        if (resp.statusCode !== 200) {
            logger.error({
                method: "VisApi.postDocument",
                customStatus: resp.statusCode,
            });
            return Promise.reject();
        }
    } catch (error) {
        logException(logger, error);

        return Promise.reject();
    }
    return Promise.resolve();
}

interface InstanceUri {
    readonly endpointUri: string;
}

export async function query(imo: string, url: string): Promise<string | undefined> {
    const queryUrl = `${url}/api/_search/serviceInstance?query=imo:${imo}`;
    logger.info({
        method: "VisApi.query",
        customUrl: queryUrl
    });

    try {
        const resp = await ky.get(queryUrl);
        if (resp.status !== 200) {
            logger.error({
                method: "VisApi.query",
                customStatus: resp.status,
                customText: resp.statusText
            });
            return Promise.reject();
        }

        const instanceList = await resp.json<InstanceUri[] | undefined>();

        if (!instanceList) {
            logger.info({
                method: "VisApi.query",
                message: "empty instanceList!"
            });
            return undefined;
        }

        const instance = instanceList[0];
        if (instance) {
            return instance.endpointUri;
        }

        logger.info({
            method: "VisApi.query",
            message: `instancelist length ${instanceList.length}`
        });

        return undefined;
    } catch (error) {
        logException(logger, error);

        return Promise.reject();
    }
}
