import {findAllFaults} from "../../service/faults";
import {Language} from "../../../../../common/model/language";
import {withDbSecret} from "../../../../../common/secrets/dbsecret";

export const KEY_SECRET_ID = 'SECRET_ID'

const secretId = process.env[KEY_SECRET_ID] as string;

export const handler = async (event: any) : Promise <any> => {
    return await withDbSecret(secretId, async () => {
        const language = getLanguage(event['language']);
        const fixedInHours = getFixed(event['fixed_in_hours']);
        const start = Date.now();

        try {
            return await findAllFaults(language, fixedInHours);
        } finally {
            console.info("method=findAllFaults tookMs=%d", (Date.now() - start));
        }
    });
};

function isNotSet(value: string): boolean {
    return (value == null || value == undefined || value.length == 0);
}

function getFixed(fixed: string): number {
    return isNotSet(fixed) ? 7*24 : Number(fixed);
}

function getLanguage(lang: string): Language {
    const langvalue = isNotSet(lang) ? 'EN' : lang.toUpperCase();

    return (<any>Language)[langvalue] || Language.EN;
}
