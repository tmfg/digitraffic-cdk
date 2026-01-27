import { v4 as uuidv4 } from "uuid";
import type { DbFault } from "../model/fault.js";
import { FaultState } from "../model/fault.js";

export function someNumber(): number {
  return Math.floor(Math.random() * 999999);
}

export function newFaultWithGeometry(lat: number, lon: number): DbFault {
  return newFault({ geometry: { lat, lon } });
}

export function newFault(props?: {
  geometry?: { lat: number; lon: number };
  state?: FaultState;
  entryTimestamp?: Date;
  fixedTimestamp?: Date;
}): DbFault {
  const entryTimestamp = props?.entryTimestamp ?? new Date();
  entryTimestamp.setMilliseconds(0);
  const fixedTimestamp = props?.fixedTimestamp ?? new Date();
  fixedTimestamp.setMilliseconds(0);
  return {
    id: -someNumber(), // ids in real system are negative for some obscure reason
    entry_timestamp: entryTimestamp,
    fixed_timestamp: fixedTimestamp,
    domain: "C_NA",
    state: props?.state ?? FaultState.Avoin,
    aton_fault_type: "Valo pimeä",
    fixed: false,
    aton_id: someNumber(),
    aton_name_fi: uuidv4(),
    aton_name_sv: uuidv4(),
    aton_type: "Poiju",
    fairway_number: someNumber(),
    fairway_name_fi: "name in finnish",
    fairway_name_sv: "name in swedish",
    area_number: 1,
    area_description: "area 51",
    geometry: `POINT(${props?.geometry?.lon ?? someNumber()} ${
      props?.geometry?.lat ?? someNumber()
    })`,
  };
}
