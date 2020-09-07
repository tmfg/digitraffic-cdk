import {findAllFaults, findAllFaultsS124} from "../../service/faults";
import {Language} from "../../../../../common/model/language";

export const handler = async (event: any) : Promise <any> => {
    const language = getLanguage(event['language']);
    const fixedInHours = getFixed(event['fixed_in_hours']);
    const start = Date.now();

    try {
        return await findAllFaults(language, fixedInHours);
    } finally {
        console.info("method=findAllFaults tookMs=%d", (Date.now()-start));
    }
};

export const handlers124 = async () : Promise <any> => {
    const start = Date.now();

    try {
        return await findAllFaultsS124();
    } finally {
        console.info("method=findAllFaultsS124 tookMs=%d", (Date.now()-start));
    }
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
