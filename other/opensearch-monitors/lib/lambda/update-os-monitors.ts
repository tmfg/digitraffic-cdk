import { STS } from "aws-sdk";
import { OpenSearch } from "../api/opensearch";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { AssumeRoleRequest } from "aws-sdk/clients/sts";
import { readFileSync } from "fs";
import { OSMonitor } from "../monitor/monitor";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

export enum EnvKeys {
    ROLE = "ROLE",
    OS_HOST = "OS_HOST",
    OS_VPC_ENDPOINT = "OS_VPC_ENDPOINT"
}

const ROLE_ARN = getEnvVariable(EnvKeys.ROLE);
const OS_HOST = getEnvVariable(EnvKeys.OS_HOST);
const OS_VPC_ENDPOINT = getEnvVariable(EnvKeys.OS_VPC_ENDPOINT);

const sts = new STS({ apiVersion: "2011-06-15" });

async function assumeRole(roleArn: string): Promise<AwsCredentialIdentity> {
    const roleToAssume = {
        RoleArn: roleArn,
        RoleSessionName: "OS_Session",
        DurationSeconds: 900
    } as AssumeRoleRequest;

    return await new Promise((resolve, reject) => {
        sts.assumeRole(roleToAssume, (err, data) => {
            if (err || !data.Credentials) {
                reject(err);
            } else {
                resolve({
                    accessKeyId: data.Credentials.AccessKeyId,
                    secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken
                });
            }
        });
    });
}

export const handler = async (): Promise<void> => {
    try {
        const monitors = JSON.parse(readFileSync("./monitors.txt").toString()) as unknown as OSMonitor[];

        if (!monitors || monitors.length === 0) {
            logger.error({
                method: "UpdateOsMonitors.handler",
                message: "no monitors found"
            });
        } else {
            const role = await assumeRole(ROLE_ARN);

            const os = new OpenSearch(OS_HOST, OS_VPC_ENDPOINT, role);
            await os.deleteAllMonitors();
            await os.addMonitors(monitors);
        }
    } catch (error) {
        logException(logger, error);
    }
};
