import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { z, ZodError } from "zod";
import { logException } from "@digitraffic/common/dist/utils/logging";

const HOURS_ERROR = {
    message: "Hours must be between 0 and 2400"
};

const EmptyStringHours = z.literal("").transform(() => 168);

const TestSchema = z.object({
    q1: z.coerce.string().optional(),
    q2: z.coerce.string().optional(),
    multi: z.coerce
        .string()
        .optional(),
    hours: z.coerce
        .number()
        .gt(0, HOURS_ERROR)
        .lt(24 * 100, HOURS_ERROR)
        .optional()
        .default(168)
        .or(EmptyStringHours)
}).strict();

export const handler = (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();

    logger.info({
        method: "TestGet.handler",
        message: "Entering handler, event " + JSON.stringify(event)
    });

    try {
        const testEvent = TestSchema.parse(event);

        logger.info({
            method: "TestGet.handler",
            message: "parsed event " + JSON.stringify(testEvent)
        });
  
        return Promise.resolve(LambdaResponse.ok(`Everything is fine for the next ${testEvent.hours} hours!`));
    } catch (error) {
        if (error instanceof ZodError) {
            logger.info({
                method: "TestGet.handler",
                message: "Error when parsing, " + JSON.stringify(error)
            });

            return Promise.resolve(LambdaResponse.badRequest(JSON.stringify(error.issues)));
        }

        logException(logger, error, true);

        return Promise.resolve(LambdaResponse.internalError());
    } finally {
        logger.info({
            method: "TestGet.handler",
            tookMs: Date.now() - start
        });
    }
};
