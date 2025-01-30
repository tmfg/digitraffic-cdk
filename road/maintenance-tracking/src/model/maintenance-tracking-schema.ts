import {
  type JsonSchema,
  JsonSchemaType,
  JsonSchemaVersion,
} from "aws-cdk-lib/aws-apigateway";

export const Organisaatio: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ["ytunnus"],
  properties: {
    nimi: {
      type: JsonSchemaType.STRING,
    },
    ytunnus: {
      type: JsonSchemaType.STRING,
    },
  },
};

export const Tunniste: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ["id"],
  properties: {
    id: {
      type: JsonSchemaType.INTEGER,
    },
  },
};

export function createSchemaOtsikko(
  organisaatioRef: string,
  tunnisteRef: string,
): JsonSchema {
  return {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ["lahettaja", "viestintunniste", "lahetysaika"],
    properties: {
      lahettaja: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        required: ["jarjestelma", "organisaatio"],
        properties: {
          jarjestelma: {
            type: JsonSchemaType.STRING,
          },
          organisaatio: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            ref: organisaatioRef,
          },
        },
      },
      viestintunniste: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        ref: tunnisteRef,
      },
      lahetysaika: {
        type: JsonSchemaType.STRING,
        format: "date-time",
      },
    },
  };
}

export const Koordinaattisijainti: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ["x", "y"],
  properties: {
    x: {
      type: JsonSchemaType.NUMBER,
    },
    y: {
      type: JsonSchemaType.NUMBER,
    },
    z: {
      type: JsonSchemaType.NUMBER,
    },
  },
};

export const Viivageometriasijainti: JsonSchema = {
  schema: JsonSchemaVersion.DRAFT4,
  type: JsonSchemaType.OBJECT,
  additionalProperties: false,
  required: ["type", "coordinates"],
  properties: {
    type: {
      enum: ["LineString"],
    },
    coordinates: {
      type: JsonSchemaType.ARRAY,
      title: "Viivageometrian koordinaattitaulukko",
      items: {
        type: JsonSchemaType.ARRAY,
        minItems: 2,
        maxItems: 2,
        items: [
          {
            type: JsonSchemaType.NUMBER,
          },
          {
            type: JsonSchemaType.NUMBER,
          },
        ],
      } as JsonSchema,
    },
  },
};

export function createSchemaGeometriaSijainti(
  koordinaattisijaintiRef: string,
  viivageometriasijaintiRef: string,
): JsonSchema {
  return {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    properties: {
      koordinaatit: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        ref: koordinaattisijaintiRef,
      },
      viivageometria: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        ref: viivageometriasijaintiRef,
      },
    },
  };
}

export function createSchemaHavainto(geometriaSijaintiRef: string): JsonSchema {
  return {
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ["havainto"],
    properties: {
      havainto: {
        type: JsonSchemaType.OBJECT,
        required: ["tyokone", "sijainti", "havaintoaika"],
        properties: {
          tyokone: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            required: ["id", "tyokonetyyppi"],
            properties: {
              id: {
                type: JsonSchemaType.INTEGER,
              },
              tunnus: {
                type: JsonSchemaType.STRING,
              },
              tyokonetyyppi: {
                type: JsonSchemaType.STRING,
              },
            },
          },
          sijainti: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            ref: geometriaSijaintiRef,
          },
          suunta: {
            type: JsonSchemaType.NUMBER,
          },
          urakkaid: {
            type: JsonSchemaType.INTEGER,
          },
          havaintoaika: {
            type: JsonSchemaType.STRING,
            format: "date-time",
          },
          suoritettavatTehtavat: {
            type: JsonSchemaType.ARRAY,
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
                "turvalaite",
              ],
            },
          },
        },
      },
    },
  };
}

export function createSchemaTyokoneenseurannanKirjaus(
  otsikkoRef: string,
  havainto: JsonSchema,
): JsonSchema {
  return {
    schema: JsonSchemaVersion.DRAFT4,
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    required: ["havainnot", "otsikko"],
    properties: {
      otsikko: {
        type: JsonSchemaType.OBJECT,
        additionalProperties: false,
        ref: otsikkoRef,
      },
      havainnot: {
        type: JsonSchemaType.ARRAY,
        items: havainto,
      },
    },
  };
}
