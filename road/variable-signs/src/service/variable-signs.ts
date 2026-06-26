import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { findAll } from "../db/datex2.js";
import { isProductionMessage } from "./filtering-service.js";

const DATEX2_223_TEMPLATE = `<d2LogicalModel modelBaseVersion="2"
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

const DATEX2_SITUATION_PUBLICATION_35_TEMPLATE = `<sit:situationPublication lang="fi" modelBaseVersion="3" 
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
    <com:publicationTime>PUBLICATION_TIME</com:publicationTime>
    <com:publicationCreator>
        <com:country>FI</com:country>
        <com:nationalIdentifier>FTA</com:nationalIdentifier>
    </com:publicationCreator>
    SITUATIONS
</sit:situationPublication>
`;

const DATEX2_VMS_PUBLICATION_35_TEMPLATE = `<d2:payload xsi:type="vms:VmsPublication"
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
    <com:publicationTime>PUBLICATION_TIME</com:publicationTime>
    <com:publicationCreator>
        <com:country>FI</com:country>
        <com:nationalIdentifier>FTA</com:nationalIdentifier>
    </com:publicationCreator>
    <vms:headerInformation>
        <com:confidentiality>noRestriction</com:confidentiality>
        <com:informationStatus>real</com:informationStatus>
    </vms:headerInformation>
    STATUSES
</d2:payload>`;

const DATEX2_VMS_TABLE_PUBLICATION_35_TEMPLATE = `<d2:payload xsi:type="vms:VmsTablePublication"
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
  	<com:publicationTime>PUBLICATION_TIME</com:publicationTime>
	  <com:publicationCreator>
		    <com:country>FI</com:country>
		    <com:nationalIdentifier>FTA</com:nationalIdentifier>
	  </com:publicationCreator>
	  <vms:headerInformation>
		    <com:confidentiality>noRestriction</com:confidentiality>
		    <com:informationStatus>real</com:informationStatus>
	  </vms:headerInformation>
	  <vms:vmsControllerTable>
		    CONTROLLERS
	  </vms:vmsControllerTable>
</d2:payload>`;

export function findControllersDatex2_35(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbSituations, lastModified] = await findAll(
      db,
      "DATEXII_3_5",
      "CONTROLLER",
    );
    const datex2: string[] = datex2DbSituations.map((d) => d.datex2);
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
    const datex2: string[] = datex2DbSituations.map((d) => d.datex2);
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

// Handles legacy data that was stored without namespace prefix.
// The database still contains records without namespace prefixes, so this function is still needed.
function addNamespaceIfMissing(
  datex2: string,
  tag: string,
  namespace: string,
): string {
  // (?=[\s>/]) ensures exact tag match — e.g. "situation" won't match "situationRecord"
  const openTagPattern = new RegExp(`<${tag}(?=[\\s>/])`, "g");
  if (!openTagPattern.test(datex2)) {
    return datex2;
  }
  return datex2
    .replaceAll(new RegExp(`<${tag}(?=[\\s>/])`, "g"), `<${namespace}:${tag}`)
    .replaceAll(`</${tag}>`, `</${namespace}:${tag}>`);
}

function createVmsTablePublication35(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const controllers = datex2
    .map((d) => addNamespaceIfMissing(d, "vmsController", "vms"))
    .join("\n");
  return DATEX2_VMS_TABLE_PUBLICATION_35_TEMPLATE.replace(
    "PUBLICATION_TIME",
    publicationTime.toISOString(),
  ).replace("CONTROLLERS", controllers);
}

function createVmsPublication35(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const statuses = datex2
    .map((d) => addNamespaceIfMissing(d, "vmsControllerStatus", "vms"))
    .join("\n");
  return DATEX2_VMS_PUBLICATION_35_TEMPLATE.replace(
    "PUBLICATION_TIME",
    publicationTime.toISOString(),
  ).replace("STATUSES", statuses);
}

function createSituationPublication35(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const situations = datex2
    .map((d) => addNamespaceIfMissing(d, "situation", "sit"))
    .join("\n");
  return DATEX2_SITUATION_PUBLICATION_35_TEMPLATE.replace(
    "PUBLICATION_TIME",
    publicationTime.toISOString(),
  ).replace("SITUATIONS", situations);
}

function createD2LogicalModel223(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const situations = datex2.join("\n");
  return DATEX2_223_TEMPLATE.replace(
    "PUBLICATION_TIME",
    publicationTime.toISOString(),
  ).replace("SITUATIONS", situations);
}

// Extra namespace declarations added in Datex II 3.7
const DATEX2_37_EXTRA_NAMESPACES =
  `    xmlns:afac="http://datex2.eu/schema/3/afirFacilities"` +
  `\n    xmlns:aegi="http://datex2.eu/schema/3/afirEnergyInfrastructure"` +
  `\n    xmlns:tro="http://datex2.eu/schema/3/trafficRegulation"` +
  `\n    xmlns:cz="http://datex2.eu/schema/3/controlledZone"` +
  `\n    xmlns:olrb="http://datex2.eu/schema/3/openLrBinary"`;

// Inject extra 3.7 namespaces into the 3.5 templates by inserting them before the closing `>`
// of the root element's namespace declarations (just before xmlns:d2)
const DATEX2_SITUATION_PUBLICATION_37_TEMPLATE =
  DATEX2_SITUATION_PUBLICATION_35_TEMPLATE.replace(
    '    xmlns:d2="http://datex2.eu/schema/3/d2Payload"',
    `${DATEX2_37_EXTRA_NAMESPACES}\n    xmlns:d2="http://datex2.eu/schema/3/d2Payload"`,
  );

const DATEX2_VMS_PUBLICATION_37_TEMPLATE =
  DATEX2_VMS_PUBLICATION_35_TEMPLATE.replace(
    '    xmlns:d2="http://datex2.eu/schema/3/d2Payload"',
    `${DATEX2_37_EXTRA_NAMESPACES}\n    xmlns:d2="http://datex2.eu/schema/3/d2Payload"`,
  );

const DATEX2_VMS_TABLE_PUBLICATION_37_TEMPLATE =
  DATEX2_VMS_TABLE_PUBLICATION_35_TEMPLATE.replace(
    '    xmlns:d2="http://datex2.eu/schema/3/d2Payload"',
    `${DATEX2_37_EXTRA_NAMESPACES}\n    xmlns:d2="http://datex2.eu/schema/3/d2Payload"`,
  );

export function findControllersDatex2_37(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbData, lastModified] = await findAll(
      db,
      "DATEXII_3_7",
      "CONTROLLER",
    );
    const datex2 = datex2DbData.map((d) => d.datex2);
    return [createVmsTablePublication37(datex2, lastModified), lastModified];
  });
}

export function findStatusesDatex2_37(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbData, lastModified] = await findAll(
      db,
      "DATEXII_3_7",
      "CONTROLLER_STATUS",
    );
    const datex2 = datex2DbData.map((d) => d.datex2);
    return [createVmsPublication37(datex2, lastModified), lastModified];
  });
}

export function findSituationsDatex2_37(): Promise<[string, Date]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const [datex2DbData, lastModified] = await findAll(
      db,
      "DATEXII_3_7",
      "SITUATION",
    );
    const datex2 = datex2DbData
      .map((d) => d.datex2)
      .filter((d) => isProductionMessage(d));
    return [createSituationPublication37(datex2, lastModified), lastModified];
  });
}

function createVmsTablePublication37(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const controllers = datex2
    .map((d) => addNamespaceIfMissing(d, "vmsController", "vms"))
    .join("\n");
  return DATEX2_VMS_TABLE_PUBLICATION_37_TEMPLATE.replace(
    "PUBLICATION_TIME",
    publicationTime.toISOString(),
  ).replace("CONTROLLERS", controllers);
}

function createVmsPublication37(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const statuses = datex2
    .map((d) => addNamespaceIfMissing(d, "vmsControllerStatus", "vms"))
    .join("\n");
  return DATEX2_VMS_PUBLICATION_37_TEMPLATE.replace(
    "PUBLICATION_TIME",
    publicationTime.toISOString(),
  ).replace("STATUSES", statuses);
}

function createSituationPublication37(
  datex2: string[],
  lastUpdated: Date | undefined,
): string {
  const publicationTime = lastUpdated ?? new Date();
  const situations = datex2
    .map((d) => addNamespaceIfMissing(d, "situation", "sit"))
    .join("\n");
  return DATEX2_SITUATION_PUBLICATION_37_TEMPLATE.replace(
    "PUBLICATION_TIME",
    publicationTime.toISOString(),
  ).replace("SITUATIONS", situations);
}
