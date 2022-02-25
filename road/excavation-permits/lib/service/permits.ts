import {getXml} from "../api/permits";
import {ApiExcavationPermit} from "../model/excavation-permit";
import moment from "moment";
import * as xml2js from 'xml2js';

const API_URL = "https://lahti.infraweb.fi:1880";
const PATH = "/api/v1/kartat/luvat/voimassa";
const AUTH_KEY = process.env.AUTH_KEY as string;

interface PermitResponse {
    'wfs:FeatureCollection': {
        'gml:featureMember': PermitElement[]
    };
}

interface PermitElement {
    "GIS:YlAlLuvat": {
        "GIS:Id": string,
        "GIS:Lupatyyppi": string,
        "GIS:VoimassaolonAlkamispaiva": string,
        "GIS:VoimassaolonAlkamisaika": string,
        "GIS:VoimassaolonPaattymispaiva": string,
        "GIS:VoimassaolonPaattymissaika": string,
        "GIS:LuvanTarkoitus": string,
        "GIS:Geometry": Record<string, unknown>
    }
}

export async function getExcavationPermits(): Promise<ApiExcavationPermit[]> {
    const xmlPermits = await getXml(API_URL, PATH, AUTH_KEY);
    const jsonPermits = await xmlToJs(xmlPermits);
    return jsonPermits["wfs:FeatureCollection"]["gml:featureMember"]
        .filter(permitElement => permitElement["GIS:YlAlLuvat"]["GIS:Lupatyyppi"] === "Kaivulupa"
            && permitElement["GIS:YlAlLuvat"]["GIS:VoimassaolonAlkamispaiva"] != null)
        .map(permitElement => {
            const permitObject = permitElement["GIS:YlAlLuvat"];
            return <ApiExcavationPermit>({
                id: permitObject["GIS:Id"],
                subject: permitObject["GIS:LuvanTarkoitus"],
                gmlGeometryXmlString: jsToXml(permitObject["GIS:Geometry"]),
                effectiveFrom: moment(`${permitObject["GIS:VoimassaolonAlkamispaiva"]} ${permitObject["GIS:VoimassaolonAlkamisaika"]}`, "DD.MM.YYYY HH:mm").toDate(),
                effectiveTo: moment(`${permitObject["GIS:VoimassaolonPaattymispaiva"]} ${permitObject["GIS:VoimassaolonPaattymissaika"]}`, "DD.MM.YYYY HH:mm").toDate(),
            });
        });
}

async function xmlToJs(xml: string): Promise<PermitResponse> {
    return xml2js.parseStringPromise(xml, {explicitArray: false});
}

function jsToXml(obj: Record<string, unknown>): string {
    const builder = new xml2js.Builder({headless: true, renderOpts: {pretty: false}});
    const xmlString = builder.buildObject(obj);
    return xmlString;
}
