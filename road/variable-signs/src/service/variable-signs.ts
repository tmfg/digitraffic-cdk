import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { isProductionMessage } from "./filtering-service.js";
import { findAll } from "../db/datex2.js";

const DATEX2_223_TEMPLATE =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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

const DATEX2_35_TEMPLATE =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns3:situationPublication lang="fi" modelBaseVersion="3" xmlns="http://datex2.eu/schema/3/common" xmlns:ns2="http://datex2.eu/schema/3/roadTrafficData" xmlns:ns4="http://datex2.eu/schema/3/urbanExtensions" xmlns:ns3="http://datex2.eu/schema/3/situation" xmlns:ns6="http://datex2.eu/schema/3/facilities" xmlns:ns5="http://datex2.eu/schema/3/commonExtension" xmlns:ns8="http://datex2.eu/schema/3/locationExtension" xmlns:ns7="http://datex2.eu/schema/3/parking" xmlns:ns13="http://datex2.eu/schema/3/vms" xmlns:ns9="http://datex2.eu/schema/3/locationReferencing" xmlns:ns12="http://datex2.eu/schema/3/reroutingManagementEnhanced" xmlns:ns11="http://datex2.eu/schema/3/trafficManagementPlan" xmlns:ns10="http://datex2.eu/schema/3/faultAndStatus" xmlns:ns15="http://datex2.eu/schema/3/d2Payload" xmlns:ns14="http://datex2.eu/schema/3/energyInfrastructure">
    <publicationTime>PUBLICATION_TIME</publicationTime>
    <publicationCreator>
        <country>FI</country>
        <nationalIdentifier>FTA</nationalIdentifier>
    </publicationCreator>
    SITUATIONS
</ns3:situationPublication>
`;

export function findActiveSignsDatex2_35(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbSituations, lastModified] = await findAll(db, "DATEXII_3_5");
    const datex2: string[] = datex2DbSituations
      .map((d) => d.datex2)
      .filter((d) => isProductionMessage(d, true));

    return [createResponse35(datex2, lastModified), lastModified];
  });
}

export function findActiveSignsDatex2_223(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbSituations, lastModified] = await findAll(
      db,
      "DATEXII_2_2_3",
    );
    const datex2: string[] = datex2DbSituations
      .map((d) => d.datex2)
      .filter((d) => isProductionMessage(d, false));

    return [createResponse223(datex2, lastModified), lastModified];
  });
}

function createResponse35(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const situations = datex2.join("\n");

  return DATEX2_35_TEMPLATE
    .replace("PUBLICATION_TIME", publicationTime.toISOString())
    .replace("SITUATIONS", situations);
}

function createResponse223(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const situations = datex2.join("\n");

  return DATEX2_223_TEMPLATE
    .replace("PUBLICATION_TIME", publicationTime.toISOString())
    .replace("SITUATIONS", situations);
}
