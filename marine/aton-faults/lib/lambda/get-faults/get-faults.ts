import * as FaultsService from "../../service/faults";
import { Language } from "@digitraffic/common/dist/types/language";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { RefinementCtx, z } from "zod";

const proxyHolder = ProxyHolder.create();

const GetFaultsSchema = z.object({
    language: z.string().optional().default("EN").transform(getLanguage),
    fixed_in_hours: z.string().optional().default("168").transform(getFixed),
});

export const handler = async (event: unknown): Promise<LambdaResponse> => {
    const start = Date.now();

    try {
        const getFaultsEvent = GetFaultsSchema.safeParse(event);

        if (!getFaultsEvent.success) {
            return LambdaResponse.badRequest(
                JSON.stringify(getFaultsEvent.error.issues)
            );
        }

        return proxyHolder
            .setCredentials()
            .then(() =>
                FaultsService.findAllFaults(
                    getFaultsEvent.data.language,
                    getFaultsEvent.data.fixed_in_hours
                )
            )
            .then((faults) => {
                return LambdaResponse.okJson(faults);
            })
            .catch((error) => {
                console.info("error " + error);
                console.info("stack " + (error as Error).stack);

                return LambdaResponse.internalError();
            });
    } finally {
        console.info("method=findAllFaults tookMs=%d", Date.now() - start);
    }
};

function getFixed(fixed: string, ctx: RefinementCtx): number {
    const value = Number(fixed);

    if (value < 0 || value > 24 * 100 || Number.isNaN(value)) {
        ctx.addIssue({
            message: "fixedInHours must be between 0 and 2400",
            code: z.ZodIssueCode.custom,
        });

        return z.NEVER;
    }

    return value;
}

function getLanguage(lang: string): Language {
    return Language[lang.toUpperCase() as keyof typeof Language] ?? Language.EN;
}
