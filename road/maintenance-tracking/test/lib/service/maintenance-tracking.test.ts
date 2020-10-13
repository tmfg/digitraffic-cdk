import {dbTestBase, findAll} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {saveMaintenanceTrackingData, createHash} from "../../../lib/service/maintenance-tracking";
import {DbMaintenanceTrackingData, Status} from "../../../lib/db/db-maintenance-tracking";

describe('maintenance-tracking', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const ID_PLACEHOLDER = 'ID_PLACEHOLDER'
    const TK_PLACEHOLDER = 'TK_PLACEHOLDER'
    const JSON =
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
                    "id": ID_PLACEHOLDER
                },
                "lahetysaika": "2019-01-30T12:00:00+02:00"
            },
            "havainnot": [
                {
                    "havainto": {
                        "tyokone": {
                            "id": TK_PLACEHOLDER,
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
        const json = getTrackingJson('1');
        await saveMaintenanceTrackingData(json);

        const fetchedTrackings = await findAll(db);
        expect(fetchedTrackings.length).toBe(1);
        const saved = fetchedTrackings[0];
        assertData(saved, json);
    });


    test('saveMaintenanceTrackingData should succeed for two different messages', async () => {
        const json1 = getTrackingJson('1', '456');
        const json2 = getTrackingJson('2', '654');
        await saveMaintenanceTrackingData(json1);
        await saveMaintenanceTrackingData(json2);

        const fetchedTrackings = await findAll(db);
        expect(fetchedTrackings.length).toBe(2);
    });


    test('saveMaintenanceTrackingData should succeed only for first message with same content and different id', async () => {
        const json1 = getTrackingJson('1');
        const json2 = getTrackingJson('2');
        await saveMaintenanceTrackingData(json1);

        let failure = false;
        try {
            await saveMaintenanceTrackingData(json2);
        } catch (error) {
            // Expect error: duplicate key value violates unique constraint "maintenance_tracking_data_hash_ui"
            failure = true;
        }

        expect(failure).toBe(true);

        const fetchedTrackings = await findAll(db);
        expect(fetchedTrackings.length).toBe(1);
        const saved = fetchedTrackings[0];
        assertData(saved, json1);
    });

    test('createHash should equals for same message but different viestintunniste id', () => {
        const h1 = createHash(getTrackingJson('1'));
        const h2 = createHash(getTrackingJson('2'));
        // Assert has is same for same json with different viestitunniste
        expect(h1).toBe(h2);
    });

    test('createHash should differ for different message', () => {
        const h1 = createHash(getTrackingJson('1', '123'));
        const h2 = createHash(getTrackingJson('2', '321'));
        // Assert has is same for same json with different viestitunniste
        expect(h1).not.toBe(h2);
    });

    test('getTrackingJson with viestintunniste id', () => {
        expect(getTrackingJson('1')).toBe(getTrackingJson('1'));
        expect(getTrackingJson('1')).not.toBe(getTrackingJson('2'));
    });

    test('getTrackingJson with viestintunniste and tyokone id', () => {
        expect(getTrackingJson('1', '123')).toBe(getTrackingJson('1', '123'));
        expect(getTrackingJson('1', '123')).not.toBe(getTrackingJson('1', '321'));
    });

    function getTrackingJson(id: string, tyokoneId?: string) {
        if (tyokoneId) {
            return JSON.replace(ID_PLACEHOLDER, id).replace(TK_PLACEHOLDER, tyokoneId);
        }
        return JSON.replace(ID_PLACEHOLDER, id).replace(TK_PLACEHOLDER, '123456789');
    }

    function assertData(saved: DbMaintenanceTrackingData, json: string) {
        expect(saved.hash).toBe(createHash(json));
        expect(saved.json).toBe(json);
        expect(saved.status).toBe(Status.UNHANDLED);
    }

}));
