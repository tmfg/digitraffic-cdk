import {DbMaintenanceTrackingData, Status} from "../lib/db/maintenance-tracking";
import {createHash} from "../lib/service/maintenance-tracking";
import {getRandomNumberAsString} from "../../../common/test/testutils";

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
                "lahetysaika": "2019-01-30T12:00:04+02:00"
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
                                    [293358, 6889073],
                                    [293358, 6889075]
                                ]
                            }
                        },
                        "suunta": 45,
                        "havaintoaika": "2019-01-30T12:00:02+02:00",
                        "urakkaid": 999999,
                        "suoritettavatTehtavat": [
                            "auraus ja sohjonpoisto",
                            "suolaus"
                        ]
                    }
                }, {
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
                                    [293360, 6889072]
                                ]
                            }
                        },
                        "suunta": 40,
                        "havaintoaika": "2019-01-30T12:00:01+02:00",
                        "urakkaid": 999999,
                        "suoritettavatTehtavat": [
                            "auraus ja sohjonpoisto",
                            "suolaus"
                        ]
                    }
                }, {
                    "havainto": {
                        "tyokone": {
                            "id": TK_PLACEHOLDER,
                            "tyokonetyyppi": "aura-auto"
                        },
                        "sijainti": {
                            "viivageometria": {
                                "type": "LineString",
                                "coordinates": [
                                    [293359, 6889072],
                                    [293356, 6889078],
                                    [293356, 6889078]
                                ]
                            }
                        },
                        "suunta": 40,
                        "havaintoaika": "2019-01-30T12:00:03+02:00",
                        "urakkaid": 999999,
                        "suoritettavatTehtavat": [
                            "auraus ja sohjonpoisto",
                            "suolaus"
                        ]
                    }
                }
            ]
        }`;

export function getTrackingJson(id: string, tyokoneId?: string): string {
    if (tyokoneId) {
        return JSON.replace(new RegExp(ID_PLACEHOLDER, 'g'), id).replace(new RegExp(TK_PLACEHOLDER, 'g'), tyokoneId);
    }
    return JSON.replace(new RegExp(ID_PLACEHOLDER, 'g'), id).replace(new RegExp(TK_PLACEHOLDER, 'g'), '123456789');
}

export function assertData(saved: DbMaintenanceTrackingData, json: string) {
    expect(saved.hash).toBe(createHash(json));
    expect(saved.json).toBe(json);
    expect(saved.status).toBe(Status.UNHANDLED);
}

export function getRandompId(): string {
    return getRandomNumberAsString(100000, 100000000000)
}
