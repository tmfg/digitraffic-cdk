import {PermitsApi} from "../api/permits";
import {ApiPermit, DbPermit, PermitType} from "../model/permit";
import {PermitElement, PermitResponse} from "../model/permit-xml";
import moment from "moment";
import * as xml2js from 'xml2js';
import {inDatabaseReadonly} from "digitraffic-common/database/database";
import * as PermitsDAO from "../db/permit";
import {Geometry} from "geojson";

const PERMITS_PATH = "/api/v1/kartat/luvat/voimassa";

export async function getPermits(authKey: string, url: string): Promise<ApiPermit[]> {
    const api = new PermitsApi(url, PERMITS_PATH, authKey);
    const xmlPermits = await api.getPermitsXml();
    const jsonPermits = await xmlToJs(xmlPermits);

    return jsonPermits["wfs:FeatureCollection"]["gml:featureMember"]
        .filter(permitElement => isValidPermit(permitElement))
        .map(permitElement => convertPermit(permitElement));
}

export function findPermitsInGeojson() {
    return inDatabaseReadonly(db => {
        return PermitsDAO.getActivePermitsGeojson(db);
    });
}

export function findPermitsInD2Light() {
    return inDatabaseReadonly(db => {
        return PermitsDAO.getActivePermits(db).then(permits => convertD2Light(permits));
    });
}

function convertD2Light(permits: DbPermit[]) {
    const situationRecord = permits.map(permit => (
        {
            "id": permit.id,
            "version": permit.version,
            "creationTime": permit.createdAt,
            "versionTime": permit.updatedAt,
            "startTime": permit.effectiveFrom,
            "endTime": permit.effectiveTo,
            "type": permit.permitType,
            "detailedTypeText": permit.permitSubject,
            "severity": "Medium",
            "safetyRelatedMessage": false,
            "sourceName": permit.source,
            "generalPublicComment": permit.permitSubject,
            "situationId": permit.id,
            "location": convertLocation(permit.geometry),
        }
    ));

    return {
        "modelBaseVersion": "3",
        "situationPublicationLight": {
            "lang": "fi",
            "publicationTime": new Date(),
            "publicationCreator": {
                "country": "fi",
                "nationalIdentifier": "Fintraffic",
            },
            situationRecord,
        },
    };
}

function convertLocation(geometry: Geometry) {
    if (geometry.type === 'Point') {
        return {
            coordinatesForDisplay: {
                latitude: geometry.coordinates[1],
                longitude: geometry.coordinates[0],
            },
        };
    }

    if (geometry.type === 'Polygon') {
        return {
            area: {
                "gmlPolygon": [
                    {
                        "exterior": {
                            "srsName": "ESPG:3011",
                            "posList": geometry.coordinates.join(' '),
                        },
                    },
                ],
            },
        };
    }

    throw new Error("unknown geometry type " + JSON.stringify(geometry));
}

function isValidPermit(permitElement: PermitElement): boolean {
    // for some reason, duplicate 0-id permits
    return permitElement["GIS:YlAlLuvat"]["GIS:VoimassaolonAlkamispaiva"] != null
    && permitElement["GIS:YlAlLuvat"]["GIS:Id"] !== '0'
    && permitElement["GIS:YlAlLuvat"]["GIS:Lupatyyppi"] !== 'Alueen tilapäinen käyttölupa'; // duplicates, disabled for now
}

function convertPermit(permitElement: PermitElement): ApiPermit {
    const permitObject = permitElement["GIS:YlAlLuvat"];
    const permitType = mapLupatyyppi(permitObject["GIS:Lupatyyppi_koodi"]);
    const permitSubject = convertSubject(permitType, permitObject["GIS:LuvanTarkoitus"], permitObject["GIS:Nimi"]);

    return {
        sourceId: permitObject["GIS:Id"],
        source: "Lahden kaupunki",
        permitSubject,
        permitType,
        gmlGeometryXmlString: jsToXml(permitObject["GIS:Geometry"]),
        effectiveFrom: moment(`${permitObject["GIS:VoimassaolonAlkamispaiva"]} ${permitObject["GIS:VoimassaolonAlkamisaika"]}`, "DD.MM.YYYY HH:mm").toDate(),
        effectiveTo: permitObject["GIS:VoimassaolonPaattymispaiva"] != null ?
            moment(`${permitObject["GIS:VoimassaolonPaattymispaiva"]} ${permitObject["GIS:VoimassaolonPaattymissaika"]}`, "DD.MM.YYYY HH:mm").toDate()
            : undefined,
    };
}

function convertSubject(permitType: PermitType, tarkoitus: string, nimi: string) {
    if (permitType === PermitType.CONSTRUCTION_WORKS) {
        return tarkoitus;
    }

    return nimi || tarkoitus;
}

function mapLupatyyppi(lupatyyppiKoodi: string) {
    switch (lupatyyppiKoodi) {
        case '2': // kaivulupa
            return PermitType.CONSTRUCTION_WORKS;
        case '41': // tilapäinen käyttölupa
            return PermitType.GENERAL_INSTRUCTION_OR_MESSAGE_TO_ROAD_USERS;
        case '60': // käyttölupa tapahtuman järjestämiseen
            return PermitType.PUBLIC_EVENT;
        default:
            console.info("unknown lupatyyppi koodi " + lupatyyppiKoodi);
            return PermitType.OTHER;
    }
}

function xmlToJs(xml: string): Promise<PermitResponse> {
    return xml2js.parseStringPromise(xml, {explicitArray: false});
}

function jsToXml(obj: Record<string, unknown>): string {
    const builder = new xml2js.Builder({headless: true, renderOpts: {pretty: false}});

    return builder.buildObject(obj);
}
