import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "@aws-cdk/aws-apigateway";

const Tunniste: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    id: "urn:harja",
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['id'],
    properties: {
        id: {
            id: "urn:harja/id",
            type: JsonSchemaType.INTEGER,
            maximum: 2147483647,
        }
    }
}

const Organisaatio: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    id: "urn:harja",
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['ytunnus'],
    properties: {
        nimi: {
            id: "urn:harja/nimi",
            type: JsonSchemaType.STRING
        },
        ytunnus: {
            id: "urn:harja/ytunnus",
            type: JsonSchemaType.STRING
        }
    }
}

const Otsikko: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    id: "urn:harja",
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['lahettaja', 'viestintunniste', 'lahetysaika'],
    properties: {
        lahettaja: {
            id: "urn:harja/lahettaja",
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            required: ['jarjestelma', 'organisaatio'],
            properties: {
                jarjestelma: {
                    id: "urn:harja/lahettaja/jarjestelma",
                    type: JsonSchemaType.STRING,
                },
                organisaatio: {
                    id: "urn:harja/organisaatio",
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    ref: "Organisaatio"
                }
            }
        },
        viestintunniste: {
            id: "urn:harja/viestintunniste",
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            ref: 'Tunniste'
        },
        lahetysaika: {
            id: "urn:harja/lahetysaika",
            type: JsonSchemaType.STRING,
            format: "date-time",
        }
    }
}

const Koordinaattisijainti: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    id: "urn:harja",
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['x', 'y'],
    properties: {
        x: {
            id: "urn:harja/sijainti/koordinaatit/x",
            type: JsonSchemaType.NUMBER,
            minimum: 60000,
            maximum: 736400,
        },
        y: {
            id: "urn:harja/sijainti/koordinaatit/y",
            type: JsonSchemaType.NUMBER,
            minimum: 6500000,
            maximum: 7800000,
        },
        z: {
            id: "urn:harja/sijainti/koordinaatit/z",
            type: JsonSchemaType.NUMBER
        }
    }
}

const Viivageometriasijainti: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    id: "urn:harja",
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['id', 'coordinates'],
    properties: {
        type: {
            id: "#/properties/sijainti/properties/type",
            enum: [
                "LineString"
            ]
        },
        coordinates: {
            id: "#/properties/sijainti/properties/coordinates",
            type: JsonSchemaType.ARRAY,
            title: "Viivageometrian koordinaattitaulukko",
            items: {
                id: "#/properties/sijainti/properties/coordinates/items",
                type: JsonSchemaType.ARRAY,
                minItems: 2,
                maxItems: 2,
                items: [
                    {
                        id: "#/properties/sijainti/properties/coordinates/items/items/x",
                        type: "number",
                        minimum: 60000,
                        maximum: 736400
                    },
                    {
                        id: "#/properties/sijainti/properties/coordinates/items/items/y",
                        type: "number",
                        minimum: 6500000,
                        maximum: 7800000
                    }
                ]
            } as JsonSchema
        }
    }
}

const GeometriaSijainti: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    id: "urn:harja",
    type: JsonSchemaType.OBJECT,
    required: ['viivageometria'],
    properties: {
        koordinaatit: {
            id: "urn:harja/koordinaattisijainti",
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            ref: "Koordinaattisijainti"
        },
        viivageometria: {
            id: "urn:harja/viivageometria",
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            ref: "Viivageometriasijainti",
        }
    }
}

const Havainto: JsonSchema = {
    id: "http://example.com/item-schema",
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['havainto'],
    properties: {
        havainto: {
            id: "urn:harja/havainnot/0",
            type: JsonSchemaType.OBJECT,
            required: ['tyokone', 'sijainti', 'havaintoaika'],
            properties: {
                tyokone: {
                    id: "urn:harja/havainnot/0/tyokone",
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    required: ['id', 'tyokonetyyppi'],
                    properties: {
                        id: {
                            id: "urn:harja/havainnot/0/tyokone/id",
                            type: JsonSchemaType.INTEGER
                        },
                        tunnus: {
                            id: "urn:harja/havainnot/0/tyokone/tunnus",
                            type: JsonSchemaType.STRING
                        },
                        tyokonetyyppi: {
                            id: "urn:harja/havainnot/0/tyokone/tyyppi",
                            type: JsonSchemaType.STRING
                        }
                    }
                },
                sijainti: {
                    id: "urn:harja/havainnot/0/sijainti",
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    ref: "GeometriaSijainti",
                },
                suunta: {
                    id: "urn:harja/havainnot/0/suunta",
                    type: JsonSchemaType.NUMBER
                },
                urakkaid: {
                    id: "urn:harja/havainnot/0/urakkaid",
                    type: JsonSchemaType.INTEGER
                },
                havaintoaika: {
                    id: "urn:harja/havainnot/0/havaintoaika",
                    type: JsonSchemaType.STRING,
                    format: "date-time",
                },
                suoritettavatTehtavat: {
                    id: "urn:harja/havainnot/0/tyokonetehtava",
                    type: JsonSchemaType.ARRAY,
                    maxItems: 10,
                    items: {
                        enum: [
                            "asfaltointi",
                            "auraus ja sohjonpoisto",
                            "aurausviitoitus ja kinostimet",
                            "harjaus",
                            "jyrays",
                            "kelintarkastus",
                            "koneellinen niitto",
                            "koneellinen vesakonraivaus",
                            "kuumennus",
                            "l- ja p-alueiden puhdistus",
                            "liikennemerkkien puhdistus",
                            "liik. opast. ja ohjausl. hoito seka reunapaalujen kun.pito",
                            "linjahiekoitus",
                            "lumensiirto",
                            "lumivallien madaltaminen",
                            "muu",
                            "ojitus",
                            "paallysteiden juotostyot",
                            "paallysteiden paikkaus",
                            "paannejaan poisto",
                            "palteen poisto",
                            "pinnan tasaus",
                            "pistehiekoitus",
                            "paallystetyn tien sorapientareen taytto",
                            "sekoitus tai stabilointi",
                            "siltojen puhdistus",
                            "sorastus",
                            "sorapientareen taytto",
                            "sorateiden muokkaushoylays",
                            "sorateiden polynsidonta",
                            "sorateiden tasaus",
                            "sulamisveden haittojen torjunta",
                            "suolaus",
                            "tiemerkinta",
                            "tiestotarkastus",
                            "tilaajan laadunvalvonta",
                            "turvalaite"
                        ]
                    }
                }
            }
        }
    }
}

export const MaintenanceTrackingSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT4,
    id: "urn:harja",
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ['havainnot','otsikko'],
    properties: {
        otsikko: Otsikko,
        havainnot: {
            id: "urn:harja/havainnot",
            type: JsonSchemaType.ARRAY,
            maxItems: 4096,
            items: Havainto
        }
    }
}

