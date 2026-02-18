export const AllGranularities = [
  "PT15M",
  "PT1H",
  "P1D",
  "P1W",
  "P1M",
  "P1Y",
] as const;
export type Granularity = (typeof AllGranularities)[number];

export const AllTravelModes = [
  "pedestrian",
  "bike",
  "horse",
  "minibus",
  "bus",
  "motorbike",
  "car",
  "truck",
  "undefined",
  "kayak",
  "scooter",
  "cargobike",
] as const;
export type TravelMode = (typeof AllTravelModes)[number];

export const AllDirections = ["in", "out", "undefined"] as const;
export type Direction = (typeof AllDirections)[number];

export const AllDomains = ["Fintraffic"] as const;
export type Domain = (typeof AllDomains)[number];
