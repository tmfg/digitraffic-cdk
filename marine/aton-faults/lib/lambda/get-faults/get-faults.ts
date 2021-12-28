import {findAllFaults} from "../../service/faults";
import {Language} from "digitraffic-common/model/language";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID} from "digitraffic-common/model/lambda-environment";
import {LambdaResponse} from "digitraffic-common/lambda/lambda-response";

const secretId = process.env[SECRET_ID] as string;

export const handler = (event: Record<string, string>) => {
    const start = Date.now();

    try {
        return withDbSecret(secretId, async () => {
            const language = getLanguage(event.language);
            const fixedInHours = getFixed(event.fixed_in_hours);

            const faults = await findAllFaults(language, fixedInHours);
            return LambdaResponse.ok(JSON.stringify(faults));
        }).finally(() => {
            console.info("method=findAllFaults tookMs=%d", (Date.now() - start));
        });
    } catch (error) {
        return LambdaResponse.internalError();
    }
};

function isNotSet(value: string): boolean {
    return (value == null || value == undefined || value.length === 0);
}

function getFixed(fixed: string): number {
    return isNotSet(fixed) ? 7*24 : Number(fixed);
}

function getLanguage(lang: string): Language {
    const langvalue = isNotSet(lang) ? 'EN' : lang.toUpperCase();

    return Language[langvalue as keyof typeof Language] || Language.EN;
}
