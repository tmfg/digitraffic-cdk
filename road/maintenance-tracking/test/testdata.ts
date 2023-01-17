import { getRandomIntegerAsString } from "@digitraffic/common/dist/test/testutils";
import * as R from "ramda";
import { DbObservationData } from "../lib/dao/maintenance-tracking-dao";
import { TyokoneenseurannanKirjaus } from "../lib/model/models";

const ID_PLACEHOLDER = "ID_PLACEHOLDER";
const TK_PLACEHOLDER = "TK_PLACEHOLDER";
const TRACKING_JSON_WITH_3_OBSERVATIONS = `{
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

export function getTrackingJsonWith3Observations(
    id: string,
    tyokoneId?: string
): string {
    if (tyokoneId) {
        return TRACKING_JSON_WITH_3_OBSERVATIONS.replace(
            new RegExp(ID_PLACEHOLDER, "g"),
            id
        ).replace(new RegExp(TK_PLACEHOLDER, "g"), tyokoneId);
    }
    return TRACKING_JSON_WITH_3_OBSERVATIONS.replace(
        new RegExp(ID_PLACEHOLDER, "g"),
        id
    ).replace(new RegExp(TK_PLACEHOLDER, "g"), "123456789");
}

export function getTrackingJsonWith3ObservationsAndMissingSendingSystem(
    id: string,
    tyokoneId?: string
): string {
    const validJson = getTrackingJsonWith3Observations(id, tyokoneId);
    const trackingJson: TyokoneenseurannanKirjaus = JSON.parse(validJson);
    return JSON.stringify(
        R.dissocPath(["otsikko", "lahettaja", "jarjestelma"], trackingJson)
    );
}

export function assertObservationData(
    srcObservations: DbObservationData[],
    results: DbObservationData[]
) {
    results.forEach((resultObservation) => {
        const resultObservationWithoutId = R.dissoc("id", resultObservation);

        const foundSrcObservations = srcObservations.filter(
            (o) =>
                o.observationTime.getTime() ===
                resultObservationWithoutId.observationTime.getTime()
        );
        expect(foundSrcObservations.length).toBe(1);

        const srcObservation = foundSrcObservations[0];
        expect(resultObservationWithoutId).toEqual(srcObservation);
    });
}

export function getRandompId(): string {
    return getRandomIntegerAsString(100000, 100000000000);
}
