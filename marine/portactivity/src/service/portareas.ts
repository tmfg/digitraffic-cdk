export const DEFAULT_SHIP_APPROACH_THRESHOLD_MINUTES = 15;

export type PortFormat = `FI${string}`;

export const ports = [
  "FIOUL",
  "FIPOR",
  "FISKV",
  "FIHKO",
  "FIRAU",
  "FIUKI",
  "FIKOK",
  "FIMUS",
  "FIHEL",
  "FIKJO",
  "FIEJO",
  "FITOR",
  "FILPP",
  "FIVRK",
  "FIJOE",
  "FIVAA",
  "FIRAA",
  "FIPRS",
  "FIKAS",
  "FINLI",
  "FIKTK",
  "FITRY",
  "FIKUO",
  "FITKU",
  "FIKEM",
  "FIMHQ",
  "FILAN",
  "FIINK",
  "FILOV",
] as const satisfies Readonly<Array<PortFormat>>;

export type Port = (typeof ports)[number];
export type Ports = Readonly<Array<Port>>;
