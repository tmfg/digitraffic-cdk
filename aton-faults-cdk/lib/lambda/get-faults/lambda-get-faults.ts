import {findAllFaults} from "../../service/faults";
import {Language} from "../../../../common/model/language";

export const handler = async (event: any) : Promise <any> => {
    const language = getLanguage(event['language']);

    console.info("parameter %s, language %s", event['language'], language.toString());

    return await findAllFaults(language);
};

function getLanguage(lang: string): Language {
    const langvalue = lang == null || lang == undefined ? 'EN' : lang.toUpperCase();

    return (<any>Language)[langvalue] || Language.EN;
}
