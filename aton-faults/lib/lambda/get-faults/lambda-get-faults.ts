import {findAllFaults, findAllFaultsS124} from "../../service/faults";
import {Language} from "../../../../common/model/language";

export const handler = async (event: any) : Promise <any> => {
    const language = getLanguage(event['language']);
    const start = Date.now();

    try {
        return await findAllFaults(language);
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

function getLanguage(lang: string): Language {
    const langvalue = lang == null || lang == undefined ? 'EN' : lang.toUpperCase();

    return (<any>Language)[langvalue] || Language.EN;
}
