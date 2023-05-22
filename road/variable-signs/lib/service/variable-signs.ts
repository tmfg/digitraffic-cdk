import { DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as DatexDB from "../db/datex2";

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

export function findActiveSignsDatex2(): Promise<[string, Date]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const [datex2DbSituations, lastModified] = await DatexDB.findAll(db);
        const datex2: string[] = datex2DbSituations.map((d) => d.datex2);

        return [createResponse(datex2, lastModified), lastModified];
    });
}

function createResponse(datex2: string[], lastUpdated: Date | undefined): string {
    const publicationTime = lastUpdated ?? new Date();
    const situations = datex2.join("\n");

    return DATEX2_TEMPLATE.replace("PUBLICATION_TIME", publicationTime.toISOString()).replace(
        "SITUATIONS",
        situations
    );
}
