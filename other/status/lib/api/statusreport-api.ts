import axios, { AxiosError } from "axios";
import { logger, LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { UpdateStatusSecret } from "../secret";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

export class StatusReportApi {
    private readonly secretHolder: SecretHolder<UpdateStatusSecret>;

    constructor(secretHolder: SecretHolder<UpdateStatusSecret>) {
        this.secretHolder = secretHolder;
    }

    async sendReport(reportLines: string[]): Promise<void> {
        const start = Date.now();
        const method = "StatusReportApi.getStatuspageComponents" as const satisfies LoggerMethodType;
        logger.info({
            method,
            message: "Sending report"
        });

        const reportText = reportLines ? reportLines.join("\n") : "";
        const secret = await this.secretHolder.get();
        return axios
            .post(secret.reportUrl, JSON.stringify({ text: reportText }), {
                headers: {
                    "Content-Type": "application/json"
                },
                validateStatus: (status: number) => {
                    return status === 200;
                }
            })
            .catch((reason: AxiosError) => {
                throw new Error(
                    `method=${method} Unable to send report to ${secret.reportUrl}. Error ${
                        reason.code ? reason.code : ""
                    } ${reason.message}`
                );
            })
            .then(() => {
                return;
            })
            .finally(() =>
                logger.info({
                    method,
                    message: "Sending report done",
                    tookMs: Date.now() - start
                })
            );
    }
}
