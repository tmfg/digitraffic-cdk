import axios from "axios";
import { Agent } from "https";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

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
        const resp = await axios.post(url, faultS124, {
            httpsAgent: new Agent({
                ca,
                cert: clientCertificate,
                key: privateKey
            }),
            headers: {
                "Content-Type": "text/xml;charset=utf-8"
            }
        });

        if (resp.status !== 200) {
            logger.error({
                method: "VisApi.postDocument",
                customStatus: resp.status,
                customText: resp.statusText
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

export async function query(imo: string, url: string): Promise<string | null> {
    const queryUrl = `${url}/api/_search/serviceInstance?query=imo:${imo}`;
    logger.info({
        method: "VisApi.query",
        customUrl: queryUrl
    });

    try {
        const resp = await axios.get<InstanceUri[] | undefined>(queryUrl);
        if (resp.status !== 200) {
            logger.error({
                method: "VisApi.query",
                customStatus: resp.status,
                customText: resp.statusText
            });
            return Promise.reject();
        }

        const instanceList = resp.data;

        if (!instanceList) {
            logger.info({
                method: "VisApi.query",
                message: "empty instanceList!"
            });
            return null;
        } else if (instanceList.length === 1) {
            return instanceList[0].endpointUri;
        }

        logger.info({
            method: "VisApi.query",
            message: `instancelist length ${instanceList.length}`
        });

        return null;
    } catch (error) {
        logException(logger, error);

        return Promise.reject();
    }
}
