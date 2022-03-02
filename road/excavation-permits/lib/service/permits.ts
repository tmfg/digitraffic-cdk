import {PermitsApi} from "../api/permits";
import {ApiExcavationPermit, DbPermit} from "../model/excavation-permit";
import {PermitResponse, PermitElement} from "../model/permit-xml";
import moment from "moment";
import * as xml2js from 'xml2js';
import {inDatabaseReadonly} from "digitraffic-common/database/database";
import * as ExcavationPermitsDAO  from "../db/excavation-permit";
import {Geometry, Point} from "geojson";

export async function getExcavationPermits(): Promise<ApiExcavationPermit[]> {
    const api = new PermitsApi();
    const xmlPermits = await api.getPermitsXml();
    const jsonPermits = await xmlToJs(xmlPermits);
    return jsonPermits["wfs:FeatureCollection"]["gml:featureMember"]
        .filter(permitElement => isValidExcavationPermit(permitElement))
        .map(permitElement => convertPermit(permitElement));
}

export function findPermitsInGeojson() {
    return inDatabaseReadonly(db => {
        return ExcavationPermitsDAO.getActivePermitsGeojson(db);
    });
}

export function findPermitsInD2Light() {
    return inDatabaseReadonly(db => {
        return ExcavationPermitsDAO.getActivePermits(db).then(permits => convertD2Light(permits));
    });
}

function convertD2Light(permits: DbPermit[]) {
    const situationRecord = permits.map(permit => (
        {
            "id": permit.id,
            "version": "1",
            "creationTime": "2018-09-10T10:29:04Z",
            "versionTime": "2018-09-10T10:29:04Z",
            "startTime": permit.effectiveFrom,
            "endTime": permit.effectiveTo,
            "type": {
                "value": "maintenanceWork",
            },
            "detailedTypeText": permit.subject,
            "severity": "Katutyölupa",
            "safetyRelatedMessage": false,
            "sourceName": "Lahden kaupunki, lisenssi CC 4.0 BY",
            "generalPublicComment": permit.subject,
            "situationId": permit.id,
            "situationVersionTime": "2018-09-10T10:29:04Z",
            "location": convertLocation(permit.geometry),
            /*                "line": {
                    "gmlLineString": {
                        "srsName": "EPSG:4326",
                        "srsDimension": 2,
                        "posList": "23.75274 61.49714 23.75473 61.49729 23.75475 61.49729 23.75484 61.4973 23.75722 61.49749 23.75805 61.49754 23.7593 61.49764 23.75987 61.49764 23.75988 61.49764 23.75994 61.49764 23.76072 61.49769 23.76077 61.49769 23.76165 61.49775 23.76171 61.49776 23.76231 61.49781 23.76306 61.49787 23.76408 61.49795 23.76415 61.49795 23.76424 61.49796 23.7643 61.49796 23.76431 61.49797 23.76448 61.49798 23.76449 61.49798 23.76468 61.498 23.76488 61.49801 23.76505 61.49802 23.76566 61.49806 23.76578 61.49807 23.76611 61.49813 23.76692 61.49818 23.76698 61.49818 23.76858 61.49829 23.77003 61.4984 23.7701 61.49841 23.77011 61.49841 23.77109 61.49847 23.77125 61.4984",
                    },
                },
            },*/
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

function isValidExcavationPermit(permitElement: PermitElement): boolean {
    return permitElement["GIS:YlAlLuvat"]["GIS:Lupatyyppi"] === "Kaivulupa"
        && permitElement["GIS:YlAlLuvat"]["GIS:VoimassaolonAlkamispaiva"] != null;
}

function convertPermit(permitElement: PermitElement): ApiExcavationPermit {
    const permitObject = permitElement["GIS:YlAlLuvat"];
    return <ApiExcavationPermit>({
        id: permitObject["GIS:Id"],
        subject: permitObject["GIS:LuvanTarkoitus"],
        gmlGeometryXmlString: jsToXml(permitObject["GIS:Geometry"]),
        effectiveFrom: moment(`${permitObject["GIS:VoimassaolonAlkamispaiva"]} ${permitObject["GIS:VoimassaolonAlkamisaika"]}`, "DD.MM.YYYY HH:mm").toDate(),
        effectiveTo: moment(`${permitObject["GIS:VoimassaolonPaattymispaiva"]} ${permitObject["GIS:VoimassaolonPaattymissaika"]}`, "DD.MM.YYYY HH:mm").toDate(),
    });
}

function xmlToJs(xml: string): Promise<PermitResponse> {
    return xml2js.parseStringPromise(xml, {explicitArray: false});
}

function jsToXml(obj: Record<string, unknown>): string {
    const builder = new xml2js.Builder({headless: true, renderOpts: {pretty: false}});
    const xmlString = builder.buildObject(obj);
    return xmlString;
}
