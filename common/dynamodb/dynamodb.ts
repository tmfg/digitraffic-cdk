import {DocumentClient} from "aws-sdk/clients/dynamodb";

const isTest = process.env.JEST_WORKER_ID;

export function getDocumentClient() {
    const config: any = {
        convertEmptyValues: true,
    };
    if (isTest) {
        config.endpoint = 'localhost:8000';
        config.sslEnabled = false;
        config.region = 'local-env';
    }
    return new DocumentClient(config);
}
