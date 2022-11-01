import * as FaultsService from "../../service/faults";
import { Language } from "@digitraffic/common/dist/types/language";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

const proxyHolder = ProxyHolder.create();

interface GetFaultsEvent {
    language?: string;
    fixed_in_hours?: string;
}

export const handler = (event: GetFaultsEvent) => {
    const start = Date.now();
    const language = getLanguage(event.language);
    const fixedInHours = getFixed(event.fixed_in_hours);

    if (fixedInHours < 0 || fixedInHours > 24 * 100) {
        return LambdaResponse.badRequest(
            "fixedInHours must be between 0 and 2400"
        );
    }

    return proxyHolder
        .setCredentials()
        .then(() => FaultsService.findAllFaults(language, fixedInHours))
        .then((faults) => {
            return LambdaResponse.okJson(faults);
        })
        .catch(() => {
            return LambdaResponse.internalError();
        })
        .finally(() => {
            console.info("method=findAllFaults tookMs=%d", Date.now() - start);
        });
};

function isNotSet(value?: string): boolean {
    return value == undefined || value.length === 0;
}

function getFixed(fixed?: string): number {
    return isNotSet(fixed) ? 7 * 24 : Number(fixed);
}

function getLanguage(lang?: string): Language {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- lang is defined
    const langValue = isNotSet(lang) ? "EN" : lang!.toUpperCase();

    return Language[langValue as keyof typeof Language] ?? Language.EN;
}
