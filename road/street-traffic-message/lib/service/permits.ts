import {PermitsApi} from "../api/permits";
import {ApiPermit, DbPermit, PermitDetailedType, PermitType} from "../model/permit";
import {PermitElement, PermitResponse} from "../model/permit-xml";
import moment from "moment";
import * as xml2js from 'xml2js';
import {inDatabaseReadonly} from "digitraffic-common/database/database";
import * as PermitsDAO from "../db/permit";
import {Geometry, GeometryCollection, LineString, Point, Polygon} from "geojson";
import {createGmlLineString, positionToList} from "../../../../digitraffic-common/utils/geometry";

const PERMITS_PATH = "/api/v1/kartat/luvat/voimassa";

const PERMIT_TYPE_MAP: Record<string, PermitType> = {
    '2': PermitType.CONSTRUCTION_WORKS,
    '41': PermitType.GENERAL_INSTRUCTION_OR_MESSAGE_TO_ROAD_USERS,
    '60': PermitType.PUBLIC_EVENT,
};

const PERMIT_DETAILED_TYPE_MAP: Record<string, PermitDetailedType> = {
    [PermitType.CONSTRUCTION_WORKS] : PermitDetailedType.CONSTRUCTION_WORKS,
    [PermitType.PUBLIC_EVENT] : PermitDetailedType.OTHER,
    [PermitType.GENERAL_INSTRUCTION_OR_MESSAGE_TO_ROAD_USERS] : PermitDetailedType.OTHER,
};

export async function getPermitsFromSource(authKey: string, url: string): Promise<ApiPermit[]> {
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
    const situationRecord = createSituationRecords(permits);
    const publicationTime = new Date();

    return {
        modelBaseVersion: "3",
        situationPublicationLight: {
            lang: "fi",
            publicationTime,
            publicationCreator: {
                country: "fi",
                nationalIdentifier: "Fintraffic",
            },
            situationRecord,
        },
    };
}

function createSituationRecords(permits: DbPermit[]) {
    return permits.map(permit => {
        const detailedType = PERMIT_DETAILED_TYPE_MAP[permit.permitType];

        return {
            id: permit.id,
            version: permit.version,
            creationTime: permit.created,
            versionTime: permit.modified,
            startTime: permit.effectiveFrom,
            endTime: permit.effectiveTo,
            type: permit.permitType,
            detailedType: {
                value: detailedType,
            },
            detailedTypeText: detailedType,
            severity: "Medium",
            safetyRelatedMessage: false,
            sourceName: permit.source,
            generalPublicComment: permit.permitSubject,
            situationId: permit.id,
            location: createLocation(permit.geometry),
        };
    });
}

function createLocation(geometry: Geometry) {
    if (geometry.type != 'GeometryCollection') {
        throw new Error("GeometryCollection expected, got " + geometry.type);
    }

    const geometryCollection = geometry as GeometryCollection;

    if (geometryCollection.geometries.length === 1) {
        return convertGeometry(geometryCollection.geometries[0]);
    }

    return convertGeometry(geometryCollection);
}

function convertGeometry(geometry: Geometry) {
    if (geometry.type === 'Point') {
        const point = geometry as Point;

        return {
            locationDescription: 'Lahti',
            coordinatesForDisplay: positionToList(point.coordinates),
        };
    } else if (geometry.type === 'LineString') {
        const lineString = geometry as LineString;

        return {
            locationDescription: 'Lahti',
            coordinatesForDisplay: '',
            line: {
                gmlLinearRing: createGmlLineString(geometry),
            },
        };
    } else if (geometry.type === 'Polygon') {
        const polygon = geometry as Polygon;

        return {
            locationDescription: 'Lahti',
            coordinatesForDisplay: '',
            area: {
                gmlPolygon: [
                    createGmlPolygon(polygon),
                ],
            },
        };
    } else if (geometry.type === 'GeometryCollection') {
        const geometryCollection = geometry as GeometryCollection;

        return {
            locationDescription: 'Lahti',
            coordinatesForDisplay: '',
            area: {
                gmlPolygon: [
                    geometryCollection.geometries.map(g => createGmlPolygon(g)),
                ],
            },
        };
    }

    throw new Error("unknown geometry type " + JSON.stringify(geometry));
}

function createGmlPolygon(geometry: Geometry) {
    return {
        exterior: createGmlLineString(geometry),
    };
}

function isValidPermit(permitElement: PermitElement): boolean {
    return permitElement["GIS:YlAlLuvat"]["GIS:VoimassaolonAlkamispaiva"] != null
    && mapLupatyyppi(permitElement["GIS:YlAlLuvat"]["GIS:Lupatyyppi_koodi"]) != null;
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
    const mappedType = PERMIT_TYPE_MAP[lupatyyppiKoodi];

    if (lupatyyppiKoodi != '0' && mappedType == null) {
        console.info("method=PermitsService unmapped lupatyyppi " + lupatyyppiKoodi);
    }

    return mappedType;
}

function xmlToJs(xml: string): Promise<PermitResponse> {
    return xml2js.parseStringPromise(xml, {explicitArray: false});
}

function jsToXml(obj: Record<string, unknown>): string {
    const builder = new xml2js.Builder({headless: true, renderOpts: {pretty: false}});

    return builder.buildObject(obj);
}
