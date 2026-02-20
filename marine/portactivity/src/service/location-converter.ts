import _ from "lodash";
import type { PilotageRoute } from "../model/pilotage.js";
import type { Location } from "../model/timestamp.js";

const pilotwebToPortnetLocodeMap = {
  FIKOY: "FIKOK",

  FIPIE: "FIPRS",

  FIVAS: "FIVAA",

  FIKAK: "FIKAS",

  FIMAN: "FIPOR",
  FITHK: "FIPOR",

  FIHEP: "FIUKI",
  FIKMR: "FIUKI",

  FILEV: "FIHKO",
  FIKVH: "FIHKO",

  FIVUH: "FIHEL",
  FI401: "FIHEL",
  FI402: "FIHEL",
  FI403: "FIHEL",
  FI404: "FIHEL",
  FI405: "FIHEL",
  FIVAL: "FIHEL",

  FIKHA: "FIKTK",
  FIKMU: "FIKTK",
  FIHMN: "FIKTK",

  FITRY: "FITOR",

  FIKAU: "FILPP",
  FILPM: "FILPP",
  FIMES: "FILPP",
  FIMUS: "FILPP",

  FILPP: "FINUI",

  FIVRA: "FIVRK",

  FIEUR: "FIEJO",
  FIOLK: "FIEJO",

  FIKEA: "FIKEM",
  FIKEV: "FIKEM",
} as const;

export function convertLocation(route: PilotageRoute): Location {
  return {
    port: convertPilotwebCodeToPortnetLocode(route.end.code),
    from: convertPilotwebCodeToPortnetLocode(route.start.code),
    berth: route.end.berth?.code,
  };
}

function convertPilotwebCodeToPortnetLocode(code: string): string {
  return _.get(pilotwebToPortnetLocodeMap, code, code);
}
