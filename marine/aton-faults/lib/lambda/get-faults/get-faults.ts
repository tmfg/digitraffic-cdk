import * as FaultsService from "../../service/faults";
import { Language } from "@digitraffic/common/dist/types/language";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { z, ZodError } from "zod";

const proxyHolder = ProxyHolder.create();

const FIXED_IN_HOURS_ERROR = {
    message: "fixedInHours must be between 0 and 2400",
};

const GetFaultsSchema = z.object({
    language: z.string().optional().default("EN").transform(getLanguage),
    fixed_in_hours: z.coerce
        .number()
        .gt(0, FIXED_IN_HOURS_ERROR)
        .lt(24 * 100, FIXED_IN_HOURS_ERROR)
        .optional()
        .default(168),
});

export const handler = async (
    event: Record<string, string>
): Promise<LambdaResponse> => {
    const start = Date.now();

    try {
        const getFaultsEvent = GetFaultsSchema.parse(sanitizeEvent(event));

        return proxyHolder
            .setCredentials()
            .then(() =>
                FaultsService.findAllFaults(
                    getFaultsEvent.language,
                    getFaultsEvent.fixed_in_hours
                )
            )
            .then((faults) => {
                return LambdaResponse.okJson(faults);
            });
    } catch (error) {
        if (error instanceof ZodError) {
            return LambdaResponse.badRequest(JSON.stringify(error.issues));
        }

        console.info("error %s", error);
        console.info("stack %s", (error as Error).stack);

        return LambdaResponse.internalError();
    } finally {
        console.info("method=findAllFaults tookMs=%d", Date.now() - start);
    }
};

function getLanguage(lang: string): Language {
    return Language[lang.toUpperCase() as keyof typeof Language] ?? Language.EN;
}

/**
 * Remove empty strings from the event
 */
function sanitizeEvent(event: Record<string, string>) {
    return Object.fromEntries(
        Object.entries(event).filter(([, value]) => value != "")
    );
}
