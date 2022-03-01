import {PermitsApi} from "../api/permits";
import {ApiExcavationPermit} from "../model/excavation-permit";
import {PermitResponse, PermitElement} from "../model/permit-xml";
import moment from "moment";
import * as xml2js from 'xml2js';
import {inDatabaseReadonly} from "digitraffic-common/database/database";
import {getActivePermitsGeojson} from "../db/excavation-permit";

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
        return getActivePermitsGeojson(db);
    });
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
