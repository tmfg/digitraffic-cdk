import {inDatabase} from '../../../../common/postgres/database';
import * as LastUpdatedDB from "../../../../common/db/last-updated";
import * as DatexDB from "../db/db-datex2";
import {IDatabase} from "pg-promise";

const DATEX2_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2LogicalModel modelBaseVersion="2"
                xsi:schemaLocation="http://datex2.eu/schema/2/2_0 https://tie.digitraffic.fi/schemas/datex2/DATEXIISchema_2_2_3_with_definitions_FI.xsd"
                xmlns="http://datex2.eu/schema/2/2_0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <exchange>
        <supplierIdentification>
            <country>fi</country>
            <nationalIdentifier>FTA</nationalIdentifier>
        </supplierIdentification>
    </exchange>
    <payloadPublication xsi:type="SituationPublication" lang="fi">
        <publicationTime>PUBLICATION_TIME</publicationTime>
        <publicationCreator>
            <country>fi</country>
            <nationalIdentifier>FTA</nationalIdentifier>
        </publicationCreator>
        SITUATIONS
    </payloadPublication>
</d2LogicalModel>
`;

export async function findActiveSignsDatex2(): Promise<any> {
    return await inDatabase(async (db: IDatabase<any,any>) => {
        const datex2 : string[] = (await DatexDB.findAll(db)).map(d => d.datex2);
        const lastUpdated = await LastUpdatedDB.getLastUpdated(db, LastUpdatedDB.DataType.VS_DATEX2);

        return { body: createResponse(datex2, lastUpdated) };
    });
}

function createResponse(datex2: string[], lastUpdated: Date | null): string {
    const publicationTime = lastUpdated || new Date();
    const situations = datex2.join('\n');

    return DATEX2_TEMPLATE
        .replace('PUBLICATION_TIME', publicationTime.toISOString())
        .replace('SITUATIONS', situations);
}
