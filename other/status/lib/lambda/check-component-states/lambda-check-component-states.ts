import { SecretsManager } from "aws-sdk";
import { UpdateStatusSecret } from "../../secret";
import * as StatusService from "../../service/status";
import { StatuspageApi } from "../../api/statuspage";
import { NodePingApi } from "../../api/nodeping";
import { StatusReportApi } from "../../api/statusreport";

const smClient = new SecretsManager({
    region: process.env.AWS_REGION,
});

/**
 * Checks current status of StatusPage and NodePing and sends report to Slack
 */
export const handler = async (): Promise<void> => {
    const secretObj = await smClient
        .getSecretValue({
            SecretId: process.env.SECRET_ARN!,
        })
        .promise();
    if (!secretObj.SecretString) {
        throw new Error("No secret found!");
    }
    const secret: UpdateStatusSecret = JSON.parse(secretObj.SecretString);
    const statuspageApi = new StatuspageApi(
        secret.statuspagePageId,
        secret.statuspageApiKey
    );
    const nodePingApi = new NodePingApi(
        secret.nodePingToken,
        secret.nodepingSubAccountId
    );

    const componentStatuses =
        await StatusService.getNodePingAndStatuspageComponentStatuses(
            secret,
            statuspageApi,
            nodePingApi
        );

    if (componentStatuses.length) {
        const statusReportApi = new StatusReportApi(secret.reportUrl);
        await statusReportApi.sendReport(componentStatuses);
    }
};
