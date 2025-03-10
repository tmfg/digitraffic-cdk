// lists of ports for which ETA and ETD predictions should be fetched from Voyages port API

import type { Locode } from "./locode.js";

export const ETA_PORTS: readonly Locode[] = [
  "FIKOK",
  "FIRAU",
  "FIOUL",
  "FIKEM",
  "FIKJO",
  "FIUKI",
  "FIPOR",
] as const;

export const ETD_PORTS: readonly Locode[] = [
  "FIHEL",
  "FIHKO",
  "FIKEM",
  "FIKOK",
  "FIKTK",
  "FIMHQ",
  "FINLI",
  "FIOUL",
  "FIPRS",
  "FIRAU",
  "FISKV",
  "FITKU",
  "FITOR",
  "FIUKI",
  "FIVSS",
] as const;
