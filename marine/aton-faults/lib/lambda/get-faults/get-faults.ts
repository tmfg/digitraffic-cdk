import {findAllFaults} from "../../service/faults";
import {Language} from "digitraffic-common/model/language";
import {withDbSecret} from "digitraffic-common/secrets/dbsecret";
import {SECRET_ID_KEY} from "digitraffic-common/stack/lambda-configs";

const secretId = process.env[SECRET_ID_KEY] as string;

export const handler = (event: Record<string, string>) => {
    const start = Date.now();

    return withDbSecret(secretId, () => {
        const language = getLanguage(event['language']);
        const fixedInHours = getFixed(event['fixed_in_hours']);

        return findAllFaults(language, fixedInHours);
    }).finally(() => {
        console.info("method=findAllFaults tookMs=%d", (Date.now() - start));
    });
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
