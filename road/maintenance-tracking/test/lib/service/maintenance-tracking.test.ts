import {dbTestBase} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {saveMaintenanceTrackingData} from "../../../lib/service/maintenance-tracking";

describe('maintenance-tracking', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const json =
        `{
            "otsikko": {
                "lahettaja": {
                    "jarjestelma": "Urakoitsijan järjestelmä",
                    "organisaatio": {
                        "nimi": "Urakoitsija viivageometrialla",
                        "ytunnus": "6547365-0"
                    }
                },
                "viestintunniste": {
                    "id": 123
                },
                "lahetysaika": "2019-01-30T12:00:00+02:00"
            },
            "havainnot": [
                {
                    "havainto": {
                        "tyokone": {
                            "id": 1111111111,
                            "tyokonetyyppi": "aura-auto"
                        },
                        "sijainti": {
                            "viivageometria": {
                                "type": "LineString",
                                "coordinates": [
                                    [293359, 6889071],
                                    [293358, 6889073],
                                    [293358, 6889075],
                                    [293359, 6889072],
                                    [293356, 6889078]
                                ]
                            }
                        },
                        "suunta": 45,
                        "havaintoaika": "2019-01-30T12:00:00+02:00",
                        "urakkaid": 999999,
                        "suoritettavatTehtavat": [
                            "auraus ja sohjonpoisto",
                            "suolaus"
                        ]
                    }
                }
            ]
        }`;

    test('saveMaintenanceTrackingData', async () => {

        const result = await saveMaintenanceTrackingData(json);

        console.info(`Returned ${result}`)

    });

}));
