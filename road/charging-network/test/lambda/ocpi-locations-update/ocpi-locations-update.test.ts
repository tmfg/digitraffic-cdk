import {
    dbTestBase,
    insertOcpiCpo,
    insertOcpiVersion,
    roundToNearestSecond,
    setTestEnv,
    withServer
} from "../../db-testutil";
setTestEnv();
import { TestHttpServer } from "@digitraffic/common/dist/test/httpserver";
import {
    Capability,
    ConnectorFormat,
    ConnectorType,
    EVSE,
    GeoLocation,
    Location,
    LocationResponse,
    LocationType,
    PowerType,
    Status
} from "../../../lib/api/ocpi/2_1_1/ocpi-api-responses_2_1_1";
import { StatusCode } from "../../../lib/api/ocpi/ocpi-api-responses";
import * as OcpiDao from "../../../lib/dao/ocpi-dao";
import { handler } from "../../../lib/lambda/ocpi-locations-update/ocpi-locations-update";
import { OCPI_MODULE_LOCATIONS, VERSION_2_1_1, VERSION_2_2 } from "../../../lib/model/ocpi-constants";
import {
    CPO_2_1_1_ENPOINT,
    CPO_2_1_1_LOCATIONS_ENPOINT,
    CPO_NAME,
    CPO_PARTY_ID,
    CPO_TOKEN_A,
    CPO_VERSIONS_ENPOINT,
    DT_CPO_ID
} from "../../test-constants";
import _ from "lodash";

const GEO_LOCATIONS: GeoLocation[] = [
    { latitude: 61.1811616, longitude: 23.8851502 },
    { latitude: 60.4429492, longitude: 22.6057961 }
];
const CHARGER_NAMES = ["Tesla Supercharger Akaa", "Tesla Supercharger Paimio"];

describe(
    "lambda-ocpi-locations-update-test",
    dbTestBase((db) => {
        beforeEach(async () => {
            await insertOcpiCpo(
                db,
                DT_CPO_ID,
                CPO_NAME,
                CPO_TOKEN_A,
                "TOKEN_B",
                "TOKEN_C",
                CPO_VERSIONS_ENPOINT
            );
        });

        test("two-locations", async () => {
            await OcpiDao.upsertCpoVersion(db, {
                dt_cpo_id: DT_CPO_ID,
                ocpi_version: VERSION_2_1_1,
                endpoints_endpoint: CPO_2_1_1_ENPOINT
            });
            await OcpiDao.upsertCpoModuleEndpoint(db, {
                module: OCPI_MODULE_LOCATIONS,
                dt_cpo_id: DT_CPO_ID,
                ocpi_version: VERSION_2_1_1,
                endpoint: CPO_2_1_1_LOCATIONS_ENPOINT
            });

            const lastUpdated = roundToNearestSecond(new Date());

            const cpoLocationsResponse: LocationResponse = createLocationResponse(2, lastUpdated);

            await withServer(
                [[CPO_2_1_1_LOCATIONS_ENPOINT, cpoLocationsResponse]],
                async (server: TestHttpServer) => {
                    await handler(); // do locations update
                    expect(server.getCallCount()).toEqual(1); // Expect calls to: versions + version + credentials

                    const locations = await OcpiDao.findLocations(db, DT_CPO_ID);
                    expect(locations.length).toBe(2);

                    for (let i = 0; i < 2; i++) {
                        const location = locations[i];
                        expect(location.modified_cpo).toEqual(lastUpdated);
                        expect(location.dt_cpo_id).toEqual(DT_CPO_ID);
                        expect(location.id).toEqual(getLocationId(i));
                        expect(location.ocpi_version).toEqual(VERSION_2_1_1);
                        expect(location.geometry).toBeDefined();
                        expect(location.location_object).toBeDefined();
                        const locationObject = location.location_object as Location;
                        expect(locationObject.name).toEqual(CHARGER_NAMES[i]);
                        expect(locationObject.coordinates).toEqual(GEO_LOCATIONS[i]);
                        expect(location.geometry.coordinates[0]).toBeCloseTo(GEO_LOCATIONS[i].longitude, 5);
                        expect(location.geometry.coordinates[1]).toBeCloseTo(GEO_LOCATIONS[i].latitude, 5);
                    }
                }
            );
        });

        test("unsupported-version", async () => {
            await insertOcpiVersion(db, VERSION_2_2);
            await OcpiDao.upsertCpoVersion(db, {
                dt_cpo_id: DT_CPO_ID,
                ocpi_version: VERSION_2_2,
                endpoints_endpoint: CPO_2_1_1_ENPOINT
            });
            await OcpiDao.upsertCpoModuleEndpoint(db, {
                module: OCPI_MODULE_LOCATIONS,
                dt_cpo_id: DT_CPO_ID,
                ocpi_version: VERSION_2_2,
                endpoint: CPO_2_1_1_LOCATIONS_ENPOINT
            });
            const lastUpdated = roundToNearestSecond(new Date());
            const cpoLocationsResponse: LocationResponse = createLocationResponse(2, lastUpdated);

            await withServer(
                [[CPO_2_1_1_LOCATIONS_ENPOINT, cpoLocationsResponse]],
                async (server: TestHttpServer) => {
                    await handler(); // do locations update
                    expect(server.getCallCount()).toEqual(0); // Expect no calls as no common version

                    const locations = await OcpiDao.findLocations(db, DT_CPO_ID);
                    expect(locations.length).toBe(0);
                }
            );
        });
    })
);

function getPaddedNumberText(index: number): string {
    return `${index}`.padStart(3, "0");
}

function getLocationId(index: number): string {
    return `FI${CPO_PARTY_ID}${getPaddedNumberText(index)}`;
}

function getEvseId(locationIndex: number, evseIndex: number): string {
    return `FI*${CPO_PARTY_ID}*${getPaddedNumberText(locationIndex)}*${getPaddedNumberText(evseIndex)}`;
}

function createLocationResponse(count: number, lastUpdated: Date): LocationResponse {
    const locations: Location[] = _.range(count).map((i: number) => createLocation(i, 2, lastUpdated));

    return {
        type: "Success",
        status_code: StatusCode.success,
        status_message: "Success",
        timestamp: new Date(),
        data: locations
    };
}

function createLocation(locationIndex: number, evseCount: number, lastUpdated: Date): Location {
    // TODO: TS2802: Type IterableIterator<number> can only be iterated through when using the --downlevelIteration flag or with a --target of es2015 or higher.
    const evses: EVSE[] = _.range(evseCount).map((evseIndex: number) =>
        createEvses(locationIndex, evseIndex, lastUpdated)
    );

    return {
        /** (39) Uniquely identifies the location within the CPOs platform (and suboperator platforms). This field can never be changed, modified or renamed. */
        id: getLocationId(locationIndex),
        /** The general type of the charge point location. */
        type: LocationType.PARKING_LOT,
        /** (255) Display name of the location. */
        name: CHARGER_NAMES[locationIndex],
        /** (45) Street/block name and house number if available. */
        address: "Satamatie 43",
        /** (45) City or town. */
        city: "Akaa",
        /** (10) Postal code of the location. */
        postal_code: "37800",
        /** (3) ISO 3166-1 alpha-3 code for the country of this location. */
        country: "FIN",
        /**  */
        coordinates: GEO_LOCATIONS[locationIndex],
        related_locations: undefined, // AdditionalGeoLocation[];
        evses, // EVSE[];
        directions: undefined, // DisplayText[];
        operator: undefined, // BusinessDetails;
        suboperator: undefined, // BusinessDetails;
        owner: undefined, // BusinessDetails;
        facilities: undefined, // Facility[];
        /** One of IANA tzdata’s TZ-values representing the time zone of the location. Examples: “Europe/Oslo”, “Europe/Zurich”. (http://www.iana.org/time- zones) */
        time_zone: undefined, // string;
        opening_times: { twentyfourseven: true }, // Hours
        charging_when_closed: true,
        images: undefined, // Image[];
        energy_mix: undefined, // EnergyMix;
        last_updated: lastUpdated
    };
}

//const createEvse: (locationIndex, lastUpdated) => (evseIndex) => EVSE
function createEvses(locationIndex: number, evseIndex: number, lastUpdated: Date): EVSE {
    return {
        /** (39) Uniquely identifies the EVSE within the CPOs platform (and suboperator platforms). For example a database unique ID or the “EVSE ID”. This field can never be changed, modified or renamed. This is the ‘technical’ identification of the EVSE, not to be used as ‘human readable’ identification, use the field: evse_id for that. */
        uid: getEvseId(locationIndex, evseIndex),
        /** (48) Compliant with the following specification for EVSE ID from “eMI3 standard version V1.0” (http: //emi3group.com/documents-links/) “Part 2: business objects.” Optional because: if an EVSE ID is to be re-used the EVSE ID can be removed from an EVSE that is removed (status: REMOVED) */
        evse_id: undefined, // ?: string;
        status: Status.AVAILABLE,
        status_schedule: undefined, // ?: StatusSchedule[];
        capabilities: [
            Capability.REMOTE_START_STOP_CAPABLE,
            Capability.RFID_READER,
            Capability.CREDIT_CARD_PAYABLE
        ],
        connectors: [
            {
                id: "1",
                standard: ConnectorType.CHADEMO,
                format: ConnectorFormat.CABLE,
                power_type: PowerType.DC,
                voltage: 500,
                amperage: 100,
                /** (36) Identifier of the current charging tariff structure. For a “Free of Charge” tariff this field should be set, and point to a defined “Free of Charge” tariff. */
                tariff_id: undefined, //: string;
                terms_and_conditions: undefined, //?: URL;
                last_updated: lastUpdated
            },
            {
                id: "2",
                standard: ConnectorType.IEC_62196_T2_COMBO,
                format: ConnectorFormat.CABLE,
                power_type: PowerType.DC,
                voltage: 800,
                amperage: 350,
                /** (36) Identifier of the current charging tariff structure. For a “Free of Charge” tariff this field should be set, and point to a defined “Free of Charge” tariff. */
                tariff_id: undefined, //: string;
                terms_and_conditions: undefined, //?: URL;
                last_updated: lastUpdated
            }
        ],
        floor_level: "0", // (4)
        coordinates: GEO_LOCATIONS[locationIndex],
        /** A number/string printed on the outside of the EVSE for visual identification. */
        physical_reference: undefined, // ?: string;
        directions: undefined, // ?: DisplayText[];
        parking_restrictions: undefined, // ?: ParkingRestriction[];
        images: undefined, // ?: Image;
        last_updated: lastUpdated
    };
}
