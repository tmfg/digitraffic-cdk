import axios from 'axios';
import * as util from "util";
import * as xml2js from "xml2js";
import {Subject, SubjectLocale} from '../model/subject';

export async function getSubjects(
    endpointUser: string,
    endpointPass: string,
    endpointUrl: string,
    locale: SubjectLocale
): Promise<Subject[]> {
    const resp = await axios.get(`${endpointUrl}/subjects?locale=${locale}`, {
        headers: {
            'Accept': 'application/xml'
        },
        auth: {
            username: endpointUser,
            password: endpointPass
        }
    });
    if (resp.status != 200) {
        throw Error('Fetching subjects failed: ' + resp.statusText);
    }
    const parse = util.promisify(xml2js.parseString);
    const parsedSubjects = <SubjectsResponse> await parse(resp.data);
    return responseToSubjects(parsedSubjects)
        .filter(s => s.locale == locale); // integration returns mixed locales
}

interface SubjectsResponse {
    readonly subjects: SubjectResponseWrapper;
}

interface SubjectResponseWrapper {
    readonly subject: SubjectResponse[];
}

// properties deserialized as singleton arrays
interface SubjectResponse {
    readonly active: number[];
    readonly name: string[];
    readonly id: number[];
    readonly locale: string[];
}

function responseToSubjects(response: SubjectsResponse): Subject[] {
    return response.subjects.subject.map(s => ({
        active: s.active[0],
        name: s.name[0],
        id: s.id[0],
        locale: s.locale[0] as SubjectLocale
    }));
}
