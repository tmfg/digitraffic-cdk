import * as DeviceDB from "../db/db-datex2";
import * as LastUpdatedDB from "../../../common/db/last-updated";
import {inDatabase} from "../../../common/postgres/database";
import {IDatabase} from "pg-promise";

const REG_PAYLOAD = /\<payloadPublication/g;

const DATEX2_SITUATION_TAG_START = '<situation ';
const DATEX2_SITUATION_TAG_END = '</situation>';
const DATEX2_OVERALL_STARTTIME_TAG_START = '<overallStartTime>';
const DATEX2_OVERALL_STARTTIME_TAG_END = '</overallStartTime>';
const DATEX2_VERSION_ATTRIBUTE = 'version=';
const XML_TAG_START = '<?xml';

export const VS_DATEX2_DATA_TYPE = "VS_DATEX2";

export interface Situation {
    readonly id: string,
    readonly datex2: string,
    readonly effect_date: Date
}

export async function updateDatex2(datex2: string): Promise<any> {
    const start = Date.now();

    if(!validate(datex2)) {
        return {statusCode: 400}
    }

    const situations = parseDatex(datex2);

    await inDatabase(async (db: IDatabase<any,any>) => {
        await DeviceDB.saveDatex2(db, situations);
        await LastUpdatedDB.updateLastUpdated(db, VS_DATEX2_DATA_TYPE, new Date(start));
    }).then(() => {
        const end = Date.now();
        console.info("method=updateDatex2 updatedCount=%d tookMs=%d", situations.length, (end-start));
    })

    return {statusCode: 200};
}

function parseDatex(datex2: string): Situation[] {
    const situations: Situation[] = parseSituations(datex2);

    return situations;
}

function parseSituations(datex2: string): Situation[] {
    const situations: Situation[] = [];
    var index = 0;

    // go through the document and find all situation-blocks
    // add them to the list and return them
    while(true) {
        const sitIndex = datex2.indexOf(DATEX2_SITUATION_TAG_START, index)

        if(sitIndex == -1) {
            break;
        }

        const sitEndIndex = datex2.indexOf(DATEX2_SITUATION_TAG_END, sitIndex + DATEX2_SITUATION_TAG_START.length);
        index = sitEndIndex;

        situations.push(parseSituation(datex2.substr(sitIndex, sitEndIndex - sitIndex + DATEX2_SITUATION_TAG_END.length)));
    }

    return situations;
}

function parseSituation(datex2: string): Situation {
    return {
        id: parseId(datex2),
        datex2: datex2,
        effect_date: parseEffectDate(datex2)
    }
}

function parseId(datex2: string): string {
    const index = datex2.indexOf(DATEX2_VERSION_ATTRIBUTE);
    return datex2.substring(15, index-2);
}

function parseEffectDate(datex2: string): Date {
    const index = datex2.indexOf(DATEX2_OVERALL_STARTTIME_TAG_START) + DATEX2_OVERALL_STARTTIME_TAG_START.length;
    const index2 = datex2.indexOf(DATEX2_OVERALL_STARTTIME_TAG_END, index);
    const dateString = datex2.substring(index, index2);

    return new Date(dateString);
}

function validate(datex2: string): boolean {
    if(!datex2.includes(XML_TAG_START)) {
        console.log('does not contain xml-tag')
        return false;
    }

    const ppCount = occurances(datex2, REG_PAYLOAD);
    if(ppCount != 1) {
        console.log('contains %d payloadPublications', ppCount);
        return false;
    }

    return true;
}

function occurances(string: string, regexp: any): number {
    return (string.match(regexp)||[]).length;
}
