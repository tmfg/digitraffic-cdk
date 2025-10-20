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

const DATEX2_SITUATION_PUBLICATION_35_TEMPLATE =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sit:situationPublication lang="fi" modelBaseVersion="3" 
    xmlns:com="http://datex2.eu/schema/3/common"
	  xmlns:loc="http://datex2.eu/schema/3/locationReferencing"
    xmlns:roa="http://datex2.eu/schema/3/roadTrafficData"
    xmlns:fst="http://datex2.eu/schema/3/faultAndStatus"
    xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure"
    xmlns:prk="http://datex2.eu/schema/3/parking"
    xmlns:fac="http://datex2.eu/schema/3/facilities"
    xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions"
    xmlns:locx="http://datex2.eu/schema/3/locationExtension"
    xmlns:d2="http://datex2.eu/schema/3/d2Payload"
    xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan"
    xmlns:comx="http://datex2.eu/schema/3/commonExtension"
    xmlns:vms="http://datex2.eu/schema/3/vms"
    xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced"
    xmlns:sit="http://datex2.eu/schema/3/situation">
    <publicationTime>PUBLICATION_TIME</publicationTime>
    <publicationCreator>
        <country>FI</country>
        <nationalIdentifier>FTA</nationalIdentifier>
    </publicationCreator>
    SITUATIONS
</sit:situationPublication>
`;

const DATEX2_VMS_PUBLICATION_35_TEMPLATE =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2:payload xsi:type="vms:VmsPublication"
    xmlns:com="http://datex2.eu/schema/3/common"
    xmlns:loc="http://datex2.eu/schema/3/locationReferencing"
    xmlns:roa="http://datex2.eu/schema/3/roadTrafficData"
    xmlns:fst="http://datex2.eu/schema/3/faultAndStatus"
    xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure"
    xmlns:prk="http://datex2.eu/schema/3/parking"
    xmlns:fac="http://datex2.eu/schema/3/facilities"
    xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions"
    xmlns:locx="http://datex2.eu/schema/3/locationExtension"
    xmlns:d2="http://datex2.eu/schema/3/d2Payload"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan"
    xmlns:comx="http://datex2.eu/schema/3/commonExtension"
    xmlns:vms="http://datex2.eu/schema/3/vms"
    xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced"
    xmlns:sit="http://datex2.eu/schema/3/situation">
    <publicationTime>PUBLICATION_TIME<publicationTime>
    <publicationCreator>
        <country>FI</country>
        <nationalIdentifier>FTA</nationalIdentifier>
    </publicationCreator>
    <headerInformation>
        <confidentiality>noRestriction</confidentiality>
        <informationStatus>real</informationStatus>
    </headerInformation>
    STATUSES
</d2:payload>`;

const DATEX2_VMS_TABLE_PUBLICATION_35_TEMPLATE =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2:payload xsi:type="vms:VmsTablePublication"
    xmlns:com="http://datex2.eu/schema/3/common"
    xmlns:loc="http://datex2.eu/schema/3/locationReferencing"
    xmlns:roa="http://datex2.eu/schema/3/roadTrafficData"
    xmlns:fst="http://datex2.eu/schema/3/faultAndStatus"
    xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure"
    xmlns:prk="http://datex2.eu/schema/3/parking"
    xmlns:fac="http://datex2.eu/schema/3/facilities"
    xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions"
    xmlns:locx="http://datex2.eu/schema/3/locationExtension"
    xmlns:d2="http://datex2.eu/schema/3/d2Payload"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan"
    xmlns:comx="http://datex2.eu/schema/3/commonExtension"
    xmlns:vms="http://datex2.eu/schema/3/vms"
    xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced"
    xmlns:sit="http://datex2.eu/schema/3/situation">
  	<publicationTime>PUBLICATION_TIME</publicationTime>
	  <publicationCreator>
		    <country>FI</country>
		    <nationalIdentifier>FTA</nationalIdentifier>
	  </publicationCreator>
	  <headerInformation>
		    <confidentiality>noRestriction</confidentiality>
		    <informationStatus>real</informationStatus>
	  </headerInformation>
	  <vmsControllerTable>
		    CONTROLLERS
	  </vmsControllerTable>
</d2:payload>`;

export function findControllersDatex2_35(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbSituations, lastModified] = await findAll(
      db,
      "DATEXII_3_5",
      "CONTROLLER",
    );
    const datex2: string[] = datex2DbSituations
      .map((d) => d.datex2);
    //      .filter((d) => isProductionMessage(d));

    return [createVmsTablePublication35(datex2, lastModified), lastModified];
  });
}

export function findStatusesDatex2_35(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbSituations, lastModified] = await findAll(
      db,
      "DATEXII_3_5",
      "CONTROLLER_STATUS",
    );
    const datex2: string[] = datex2DbSituations
      .map((d) => d.datex2);
    //      .filter((d) => isProductionMessage(d));

    return [createVmsPublication35(datex2, lastModified), lastModified];
  });
}

export function findSituationsDatex2_35(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbSituations, lastModified] = await findAll(
      db,
      "DATEXII_3_5",
      "SITUATION",
    );
    const datex2: string[] = datex2DbSituations
      .map((d) => d.datex2)
      .filter((d) => isProductionMessage(d));

    return [createSituationPublication35(datex2, lastModified), lastModified];
  });
}

export function findSituationsDatex2_223(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbSituations, lastModified] = await findAll(
      db,
      "DATEXII_2_2_3",
      "SITUATION",
    );
    const datex2: string[] = datex2DbSituations
      .map((d) => d.datex2)
      .filter((d) => isProductionMessage(d));

    return [createD2LogicalModel223(datex2, lastModified), lastModified];
  });
}

function createVmsTablePublication35(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const controllers = datex2.join("\n");

  return DATEX2_VMS_TABLE_PUBLICATION_35_TEMPLATE
    .replace("PUBLICATION_TIME", publicationTime.toISOString())
    .replace("CONTROLLERS", controllers);
}

function createVmsPublication35(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const statuses = datex2.join("\n");

  return DATEX2_VMS_PUBLICATION_35_TEMPLATE
    .replace("PUBLICATION_TIME", publicationTime.toISOString())
    .replace("STATUSES", statuses);
}

function createSituationPublication35(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const situations = datex2.join("\n");

  return DATEX2_SITUATION_PUBLICATION_35_TEMPLATE
    .replace("PUBLICATION_TIME", publicationTime.toISOString())
    .replace("SITUATIONS", situations);
}

function createD2LogicalModel223(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const situations = datex2.join("\n");

  return DATEX2_223_TEMPLATE
    .replace("PUBLICATION_TIME", publicationTime.toISOString())
    .replace("SITUATIONS", situations);
}
