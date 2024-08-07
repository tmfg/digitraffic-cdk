import _ from "lodash";
import { getRandomIntegerAsString } from "@digitraffic/common/dist/test/testutils";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { type DbObservationData } from "../dao/maintenance-tracking-dao.js";
import { type TyokoneenseurannanKirjaus } from "../model/models.js";
import { MaintenanceTrackingEnvKeys } from "../keys.js";
import { type SQSEvent, type SQSRecord } from "aws-lambda";
const REGEXP_ID = new RegExp("ID_PLACEHOLDER", "g");
const REGEXP_TK = new RegExp("TK_PLACEHOLDER", "g");

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

export function getTrackingJsonWith3Observations(id: string, tyokoneId?: string): string {
    if (tyokoneId) {
        return TRACKING_JSON_WITH_3_OBSERVATIONS.replace(REGEXP_ID, id).replace(REGEXP_TK, tyokoneId);
    }
    return TRACKING_JSON_WITH_3_OBSERVATIONS.replace(REGEXP_ID, id).replace(REGEXP_TK, "123456789");
}

export function getTrackingJsonWith3ObservationsAndMissingSendingSystem(
    id: string,
    tyokoneId?: string
): string {
    const validJson = getTrackingJsonWith3Observations(id, tyokoneId);
    const trackingJson = JSON.parse(validJson) as TyokoneenseurannanKirjaus;
    return JSON.stringify(_.omit(trackingJson, "otsikko.lahettaja.jarjestelma"));
}

export function assertObservationData(
    srcObservations: DbObservationData[],
    results: DbObservationData[]
): void {
    results.forEach((resultObservation) => {
        const resultObservationWithoutId = _.omit(resultObservation, "id");

        const foundSrcObservations = srcObservations.filter(
            (o) => o.observationTime.getTime() === resultObservationWithoutId.observationTime.getTime()
        );
        expect(foundSrcObservations.length).toBe(1);

        const srcObservation = foundSrcObservations[0];
        expect(resultObservationWithoutId).toEqual(srcObservation);
    });
}

export function getRandompId(): string {
    return getRandomIntegerAsString(100000, 100000000000);
}

export function createSQSEventWithBodies(bodies: string[] = []): SQSEvent {
    const records = bodies.map((body) => {
        return {
            body,
            messageId: "",
            receiptHandle: `s3://${getEnvVariable(
                MaintenanceTrackingEnvKeys.SQS_BUCKET_NAME
            )}/${getEnvVariable(MaintenanceTrackingEnvKeys.SQS_QUEUE_URL)}/${getRandompId()}`,
            messageAttributes: {},
            md5OfBody: "",
            attributes: {
                ApproximateReceiveCount: "",
                SentTimestamp: "",
                SenderId: "",
                ApproximateFirstReceiveTimestamp: ""
            },
            eventSource: "",
            eventSourceARN: "",
            awsRegion: ""
        } satisfies SQSRecord;
    });

    return { Records: records } satisfies SQSEvent;
}
