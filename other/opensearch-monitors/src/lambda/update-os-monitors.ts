import { OpenSearch } from "../api/opensearch.js";
import type { AwsCredentialIdentity } from "@aws-sdk/types";
import { readFileSync } from "node:fs";
import type { OSMonitor } from "../monitor/monitor.js";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { EnvKeys } from "../env.js";
import { type AssumeRoleRequest, STS } from "@aws-sdk/client-sts";
import { SlackApi } from "@digitraffic/common/dist/utils/slack";
import { type StatusSecret } from "../secret.js";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
const ROLE_ARN = getEnvVariable(EnvKeys.ROLE);
const OS_HOST = getEnvVariable(EnvKeys.OS_HOST);
const OS_VPC_ENDPOINT = getEnvVariable(EnvKeys.OS_VPC_ENDPOINT);

const secretHolder = SecretHolder.create<StatusSecret>();
const sts = new STS({ apiVersion: "2011-06-15" });

async function assumeRole(roleArn: string): Promise<AwsCredentialIdentity> {
  const roleToAssume = {
    RoleArn: roleArn,
    RoleSessionName: "OS_Session",
    DurationSeconds: 900,
  } as AssumeRoleRequest;

  return await new Promise((resolve, reject) => {
    sts.assumeRole(roleToAssume, (err, data) => {
      if (err || !data?.Credentials) {
        reject(err);
      } else {
        resolve({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          accessKeyId: data.Credentials.AccessKeyId!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          secretAccessKey: data.Credentials.SecretAccessKey!,
          sessionToken: data.Credentials.SessionToken,
        });
      }
    });
  });
}

export const handler = async (): Promise<void> => {
  const sh = await secretHolder.get();
  const slackApiSuccess = new SlackApi(sh.reportUrl);
  const slackApiFailed = new SlackApi(sh.slackAlarmHook);

  try {
    const monitors = JSON.parse(
      readFileSync("./monitors.json").toString(),
    ) as unknown as OSMonitor[];

    if (!monitors || monitors.length === 0) {
      logger.error({
        method: "UpdateOsMonitors.handler",
        message: "no monitors found",
      });
    } else {
      const role = await assumeRole(ROLE_ARN);

      const os = new OpenSearch(OS_HOST, OS_VPC_ENDPOINT, role);
      await os.deleteAllMonitors();
      await os.addMonitors(monitors);
      await os.checkMonitorsUptodate(monitors);
      await slackApiSuccess.notify(
        `UpdateOsMonitors.checkMonitorsUptodate success: ${monitors.length} monitors added/updated`,
      );
    }
  } catch (error) {
    logException(logger, error);
    if (error instanceof Error) {
      await slackApiFailed.notify(error.message);
    } else {
      await slackApiFailed.notify(
        `UpdateOsMonitors.checkMonitorsUptodate failed: ${
          JSON.stringify(error)
        }`,
      );
    }
    return Promise.reject(error);
  }
};
