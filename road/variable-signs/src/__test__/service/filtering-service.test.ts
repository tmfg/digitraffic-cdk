import { TEST_TIMES, isProductionMessage } from "../../service/filtering-service.js";

const BASE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2LogicalModel modelBaseVersion="2"
                xsi:schemaLocation="http://datex2.eu/schema/2/2_0 https://tie.digitraffic.fi/schemas/datex2/DATEXIISchema_2_2_3_with_definitions_FI.xsd"
                xmlns="http://datex2.eu/schema/2/2_0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <payloadPublication xsi:type="SituationPublication" lang="fi">
SITUATION
    </payloadPublication>
</d2LogicalModel>` as const;

const SITUATION_XML = `<situation id="TEST_ID" version="1715657405376">
    <overallSeverity>high</overallSeverity>
    <situationVersionTime>2024-05-14T03:30:05.376Z</situationVersionTime>
    <headerInformation>
        <areaOfInterest>regional</areaOfInterest>
        <confidentiality>noRestriction</confidentiality>
        <informationStatus>real</informationStatus>
    </headerInformation>
    <situationRecord xsi:type="SpeedManagement" id="TEST_ID" version="1715657405376">
        <situationRecordCreationTime>2024-05-14T03:30:05.376Z</situationRecordCreationTime>
        <situationRecordObservationTime>2024-05-14T03:30:05.376Z</situationRecordObservationTime>
        <situationRecordVersionTime>2024-05-14T03:30:05.376Z</situationRecordVersionTime>
        <confidentialityOverride>noRestriction</confidentialityOverride>
        <probabilityOfOccurrence>certain</probabilityOfOccurrence>
        <severity>high</severity>
        <validity>
            <validityStatus>active</validityStatus>
            <validityTimeSpecification>
            <overallStartTime>START_TIME</overallStartTime>
            </validityTimeSpecification>
        </validity>
    </situationRecord>
</situation>`;

/// interval in hours
function createTestXml(id: string, interval: number): string {
    const startTime = new Date(TEST_TIMES[0].start.getTime() + interval*1000*60*60);
    const situation = SITUATION_XML
        .replaceAll("TEST_ID", id)
        .replace("START_TIME", startTime.toUTCString());

    return BASE_XML.replace("SITUATION", situation);
}

describe("filtering-service-tests", (() => {   
    test.each`
        name                   | id             | interval  | success
        ${"filter before"}     | ${"VME01K502"} | ${-1}     | ${true}
        ${"filter start"}      | ${"VME01K502"} | ${0}      | ${false}
        ${"filter middle"}     | ${"VME01K502"} | ${2}      | ${false}
        ${"filter wrong id"}   | ${"wrong"}     | ${2}      | ${true}
    `("isProductionMessage - $name", ({ id, interval, success }) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const value = isProductionMessage(createTestXml(id, interval));

        if (success) {
            expect(value).toBeTruthy();
        } else {
            expect(value).toBeFalsy();
        }
    });
}));