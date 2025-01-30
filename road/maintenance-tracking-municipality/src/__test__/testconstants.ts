import { type ApiWorkeventIoDevice } from "../model/paikannin-api-data.js";

export const X_MIN = 19.0;
export const X_MAX = 32.0;
export const Y_MIN = 59.0;
export const Y_MAX = 72.0;

export const POINT_START = [24.357378937891166, 61.677682759232574];
export const POINT_450M_FROM_START = [24.365897599952387, 61.67781512377241];
export const POINT_550M_FROM_START = [24.36779658877416, 61.67777439983574];
export const POINT_750M_FROM_START = [24.371616214968363, 61.67767218298819];

export const DOMAIN_1 = "autori-oulu";
export const SOURCE_1 = "Autori / Oulu";

export const VEHICLE_TYPE = "my-vehicle-type";
export const CONTRACT_ID = "my-contract-1";

export const HARJA_BRUSHING = "BRUSHING";
export const HARJA_PAVING = "PAVING";
export const HARJA_SALTING = "SALTING";

export const AUTORI_OPERATION_BRUSHING = "harjaus";
export const AUTORI_OPERATION_PAVING = "päällystys";
export const AUTORI_OPERATION_SALTING = "suolaus";

export const PAIKANNIN_OPERATION_BRUSHING = {
  name: AUTORI_OPERATION_BRUSHING,
  id: 1,
} as ApiWorkeventIoDevice;
export const PAIKANNIN_OPERATION_PAVING = {
  name: AUTORI_OPERATION_PAVING,
  id: 2,
} as ApiWorkeventIoDevice;
export const PAIKANNIN_OPERATION_SALTING = {
  name: AUTORI_OPERATION_SALTING,
  id: 3,
} as ApiWorkeventIoDevice;
