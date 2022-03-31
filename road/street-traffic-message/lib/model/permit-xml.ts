export interface PermitResponse {
    readonly "wfs:FeatureCollection": {
        readonly "gml:featureMember": PermitElement[]
    };
}

export interface PermitElement {
    readonly "GIS:YlAlLuvat": {
        readonly "GIS:Id": string,
        readonly "GIS:Lupatyyppi": string,
        readonly "GIS:Lupatyyppi_koodi": string,
        readonly "GIS:VoimassaolonAlkamispaiva": string,
        readonly "GIS:VoimassaolonAlkamisaika": string,
        readonly "GIS:VoimassaolonPaattymispaiva": string,
        readonly "GIS:VoimassaolonPaattymissaika": string,
        readonly "GIS:LuvanTarkoitus": string,
        readonly "GIS:Nimi": string,
        readonly "GIS:Geometry": Record<string, unknown>
    }
}
