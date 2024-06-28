import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const KEY = "authorizer.dtCpoId";
export function parseAuthEvent(event: Record<string, string>): string {
    // event: {"authorizer.dtCpoId":"[<value>]"}
    const method = "LambdaAuthEventService.parseAuthEvent";
    logger.debug({
        method,
        event
    });

    const payload = event[KEY]; // "[<dtCpoId>]"
    if (payload) {
        const dtCpoId = payload.substring(1, payload.length - 1).trim();
        logger.debug({
            method,
            dtCpoId
        });
        if (dtCpoId.length) {
            return dtCpoId;
        }
    }
    logger.error({
        method,
        message: "Not authorized! dtCpoId cannot be empty!"
    });
    throw new Error("Not authorized! dtCpoId cannot be empty!");
}
