import { update } from "../../service/update-service.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function handler(): Promise<void> {
    const start = Date.now();

    try {
        await update();
    } finally {
        logger.info({
            method: "UpdateData.handler",
            tookMs: Date.now() - start
        });
    }
}
