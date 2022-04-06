import * as FaultsService from "../../service/faults";
import {Language} from "digitraffic-common/types/language";
import {LambdaResponse} from "digitraffic-common/aws/types/lambda-response";
import {SecretHolder} from "digitraffic-common/aws/runtime/secrets/secret-holder";

const secretHolder = SecretHolder.create();

export const handler = async (event: Record<string, string>) => {
    await secretHolder.setDatabaseCredentials();

    const start = Date.now();
    const language = getLanguage(event.language);
    const fixedInHours = getFixed(event.fixed_in_hours);

    return FaultsService.findAllFaults(language, fixedInHours).then(faults => {
        return LambdaResponse.okJson(faults);
    }).catch(() => {
        return LambdaResponse.internalError();
    }).finally(() => {
        console.info("method=findAllFaults tookMs=%d", (Date.now() - start));
    });
};

function isNotSet(value: string): boolean {
    return (value == null || false || value.length === 0);
}

function getFixed(fixed: string): number {
    return isNotSet(fixed) ? 7*24 : Number(fixed);
}

function getLanguage(lang: string): Language {
    const langvalue = isNotSet(lang) ? 'EN' : lang.toUpperCase();

    return Language[langvalue as keyof typeof Language] || Language.EN;
}
