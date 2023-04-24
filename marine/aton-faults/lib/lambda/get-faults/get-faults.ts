import * as FaultsService from "../../service/faults";
import { Language } from "@digitraffic/common/dist/types/language";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { z, ZodError } from "zod";
import { logException } from "@digitraffic/common/dist/utils/logging";

const proxyHolder = ProxyHolder.create();

const FIXED_IN_HOURS_ERROR = {
    message: "fixedInHours must be between 0 and 2400"
};

const EmptyStringEnglish = z.literal("").transform(() => Language.EN);
const EmptyStringHours = z.literal("").transform(() => 168);

const GetFaultsSchema = z.object({
    language: z.string().optional().default("EN").transform(getLanguage).or(EmptyStringEnglish),
    fixed_in_hours: z.coerce
        .number()
        .gt(0, FIXED_IN_HOURS_ERROR)
        .lt(24 * 100, FIXED_IN_HOURS_ERROR)
        .optional()
        .default(168)
        .or(EmptyStringHours)
});

export const handler = async (event: Record<string, string>): Promise<LambdaResponse> => {
    const start = Date.now();

    try {
        const getFaultsEvent = GetFaultsSchema.parse(event);

        return proxyHolder
            .setCredentials()
            .then(() => FaultsService.findAllFaults(getFaultsEvent.language, getFaultsEvent.fixed_in_hours))
            .then((faults) => {
                return LambdaResponse.okJson(faults);
            });
    } catch (error) {
        if (error instanceof ZodError) {
            return LambdaResponse.badRequest(JSON.stringify(error.issues));
        }

        logException(logger, error, true);

        return LambdaResponse.internalError();
    } finally {
        logger.info({
            method: "GetFaults.handler",
            tookMs: Date.now() - start
        });
    }
};

function getLanguage(lang: string): Language {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return Language[lang.toUpperCase() as keyof typeof Language] ?? Language.EN;
}
