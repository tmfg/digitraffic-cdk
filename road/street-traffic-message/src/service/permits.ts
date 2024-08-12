import { PermitsApi } from "../api/permits.js";
import { type ApiPermit, type DbPermit, PermitDetailedType, PermitType } from "../model/permit.js";
import type { PermitElement, PermitResponse } from "../model/permit-xml.js";
import { parse } from "date-fns";
import * as xml2js from "xml2js";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as PermitsDAO from "../db/permit.js";
import type { FeatureCollection, Geometry, GeometryCollection, Point } from "geojson";
import { createGmlLineString, positionToList } from "@digitraffic/common/dist/utils/geometry";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const PERMITS_PATH = "/api/v1/kartat/luvat/voimassa";

const PERMIT_TYPE_MAP: Record<string, PermitType> = {
    "2": PermitType.CONSTRUCTION_WORKS,
    "41": PermitType.GENERAL_INSTRUCTION_OR_MESSAGE_TO_ROAD_USERS,
    "60": PermitType.PUBLIC_EVENT
};

const PERMIT_DETAILED_TYPE_MAP: Record<string, PermitDetailedType> = {
    [PermitType.CONSTRUCTION_WORKS]: PermitDetailedType.CONSTRUCTION_WORKS,
    [PermitType.PUBLIC_EVENT]: PermitDetailedType.OTHER,
    [PermitType.GENERAL_INSTRUCTION_OR_MESSAGE_TO_ROAD_USERS]: PermitDetailedType.OTHER
};

const ALLOWED_PERMIT_PROCESSING_STAGES = ["Lupa myönnetty", "Jatkolupa", "Alueen käyttölupa myönnetty"];

export async function getPermitsFromSource(authKey: string, url: string): Promise<ApiPermit[]> {
    const api = new PermitsApi(url, PERMITS_PATH, authKey);
    const xmlPermits = await api.getPermitsXml();
    const jsonPermits = await xmlToJs(xmlPermits);

    return jsonPermits["wfs:FeatureCollection"]["gml:featureMember"]
        .filter((permitElement) => isValidPermit(permitElement))
        .map((permitElement) => convertPermit(permitElement));
}

export function findPermitsInGeojson() {
    return inDatabaseReadonly(async (db) => {
        const geojsonPermits: FeatureCollection = await PermitsDAO.getActivePermitsGeojson(db);
        // return a separate permit object for each geometry instead of a GeometryCollection in one object
        const separateObjectsPerGeometry = geojsonPermits.features.flatMap((permit) => {
            const permitGeometryCollection = permit.geometry as GeometryCollection;
            return permitGeometryCollection.geometries.flatMap((singleGeometry) => {
                return { ...permit, geometry: singleGeometry };
            });
        });
        return {
            type: "FeatureCollection",
            features: separateObjectsPerGeometry
        };
    });
}

export function findPermitsInD2Light() {
    return inDatabaseReadonly((db) => {
        return PermitsDAO.getActivePermits(db).then((permits) => convertD2Light(permits));
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
                nationalIdentifier: "Fintraffic"
            },
            situationRecord
        }
    };
}

function createSituationRecords(permits: DbPermit[]) {
    return permits.map((permit) => {
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
                value: detailedType
            },
            detailedTypeText: detailedType,
            severity: "Unknown",
            safetyRelatedMessage: false,
            sourceName: permit.source,
            generalPublicComment: permit.permitSubject,
            situationId: permit.id,
            location: createLocation(permit)
        };
    });
}

function createLocation(permit: DbPermit) {
    if (permit.geometry.type !== "GeometryCollection") {
        throw new Error("GeometryCollection expected, got " + permit.geometry.type);
    }

    if (permit.geometry.geometries.length === 1) {
        // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
        const geometry = permit.geometry.geometries[0] as Geometry;
        return convertGeometry(geometry, permit.centroid);
    }

    return convertGeometry(permit.geometry, permit.centroid);
}

function convertGeometry(geometry: Geometry, centroid: Point) {
    const locationDescription = "Lahti";
    const coordinatesForDisplay = positionToList(centroid.coordinates);

    if (geometry.type === "Point") {
        return {
            locationDescription,
            coordinatesForDisplay
        };
    } else if (geometry.type === "LineString") {
        return {
            locationDescription,
            coordinatesForDisplay,
            line: {
                gmlLinearRing: createGmlLineString(geometry)
            }
        };
    } else if (geometry.type === "Polygon") {
        return {
            locationDescription,
            coordinatesForDisplay,
            area: {
                gmlPolygon: [createGmlPolygon(geometry)]
            }
        };
    } else if (geometry.type === "GeometryCollection") {
        return {
            locationDescription,
            coordinatesForDisplay,
            area: {
                gmlPolygon: [geometry.geometries.map((g) => createGmlPolygon(g))]
            }
        };
    }

    throw new Error("unknown geometry type " + JSON.stringify(geometry));
}

function createGmlPolygon(geometry: Geometry) {
    return {
        exterior: createGmlLineString(geometry)
    };
}

function isValidPermit(permitElement: PermitElement): boolean {
    return (
        // eslint-disable-next-line eqeqeq
        permitElement["GIS:YlAlLuvat"]["GIS:VoimassaolonAlkamispaiva"] != null &&
        ALLOWED_PERMIT_PROCESSING_STAGES.includes(permitElement["GIS:YlAlLuvat"]["GIS:Kasittelyvaihe"]) &&
        // eslint-disable-next-line eqeqeq
        mapLupatyyppi(permitElement["GIS:YlAlLuvat"]["GIS:Lupatyyppi_koodi"]) != null
    );
}

function convertPermit(permitElement: PermitElement): ApiPermit {
    const permitObject = permitElement["GIS:YlAlLuvat"];
    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
    const permitType = mapLupatyyppi(permitObject["GIS:Lupatyyppi_koodi"]) as PermitType;
    const permitSubject = convertSubject(
        permitType,
        permitObject["GIS:LuvanTarkoitus"],
        permitObject["GIS:Nimi"]
    );

    return {
        sourceId: permitObject["GIS:Id"],
        source: "Lahden kaupunki",
        permitSubject,
        permitType,
        gmlGeometryXmlString: jsToXml(permitObject["GIS:Geometry"]),
        effectiveFrom: parse(
            `${permitObject["GIS:VoimassaolonAlkamispaiva"]} ${permitObject["GIS:VoimassaolonAlkamisaika"]}`,
            "dd.MM.yyyy HH:mm",
            new Date()
        ),
        effectiveTo:
            // eslint-disable-next-line eqeqeq
            permitObject["GIS:VoimassaolonPaattymispaiva"] != null
                ? parse(
                      `${permitObject["GIS:VoimassaolonPaattymispaiva"]} ${permitObject["GIS:VoimassaolonPaattymissaika"]}`,
                      "dd.MM.yyyy HH:mm",
                      new Date()
                  )
                : undefined
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

    // eslint-disable-next-line eqeqeq
    if (lupatyyppiKoodi !== "0" && mappedType == null) {
        logger.info({
            method: "permits.mapLupatyyppi",
            message: `unmapped lupatyyppi ${lupatyyppiKoodi}`
        });
    }

    return mappedType;
}

function xmlToJs(xml: string): Promise<PermitResponse> {
    return xml2js.parseStringPromise(xml, { explicitArray: false }) as Promise<PermitResponse>;
}

function jsToXml(obj: Record<string, unknown>): string {
    const builder = new xml2js.Builder({
        headless: true,
        renderOpts: { pretty: false }
    });

    return builder.buildObject(obj);
}
