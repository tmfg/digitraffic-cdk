import * as DeviceDB from "../db/datex2";
import * as LastUpdatedDB from "digitraffic-common/db/last-updated";
import {inDatabase} from "digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";
import {StatusCodeValue} from "../lambda/update-datex2/update-datex2";

const REG_PAYLOAD = /<payloadPublication/g;

const DATEX2_SITUATION_TAG_START = '<situation ';
const DATEX2_SITUATION_TAG_END = '</situation>';
const DATEX2_OVERALL_STARTTIME_TAG_START = '<overallStartTime>';
const DATEX2_OVERALL_STARTTIME_TAG_END = '</overallStartTime>';
const DATEX2_VERSION_ATTRIBUTE = 'version=';
const XML_TAG_START = '<?xml';

export interface Situation {
    readonly id: string,
    readonly datex2: string,
    readonly effect_date: Date
}

export async function updateDatex2(datex2: string): Promise<StatusCodeValue> {
    const start = Date.now();
    const timestamp = new Date(start);

    if(!validate(datex2)) {
        return {statusCode: 400}
    }

    const situations = parseSituations(datex2);

    try {
        await inDatabase(async (db: IDatabase<any, any>) => {
            return db.tx((tx: any) => {
                return tx.batch([
                    ...DeviceDB.saveDatex2(tx, situations, timestamp),
                    LastUpdatedDB.updateLastUpdated(tx, LastUpdatedDB.DataType.VS_DATEX2, timestamp)
                ]);
            })
        });

        return {statusCode: 200};
    } finally {
        console.info("method=updateDatex2 updatedCount=%d tookMs=%d", situations.length, (Date.now() - start));
    }
}

export function parseSituations(datex2: string): Situation[] {
    const situations: Situation[] = [];
    let index = 0;
    let sitIndex = 0;

    // go through the document and find all situation-blocks
    // add them to the list and return them
    do {
        sitIndex = datex2.indexOf(DATEX2_SITUATION_TAG_START, index);

        if (sitIndex !== -1) {
            const sitEndIndex = datex2.indexOf(DATEX2_SITUATION_TAG_END, sitIndex + DATEX2_SITUATION_TAG_START.length);
            index = sitEndIndex;

            situations.push(parseSituation(datex2.substr(sitIndex, sitEndIndex - sitIndex + DATEX2_SITUATION_TAG_END.length)));
        }
    } while(sitIndex !== -1)

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
        console.error('no xml-tag')
        return false;
    }

    const ppCount = occurrences(datex2, REG_PAYLOAD);
    if(ppCount !== 1) {
        console.error('%d payloadPublications', ppCount);
        return false;
    }

    return true;
}

function occurrences(string: string, regexp: RegExp): number {
    return (string.match(regexp)||[]).length;
}
