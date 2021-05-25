import {Fault, FaultState} from "../lib/model/fault";

const { v4: uuidv4 } = require('uuid');

export function someNumber() {
     return Math.floor(Math.random() * 999999);
}

export function newFault(props?: {
     geometry?: {lat: number, lon: number},
     state?: FaultState,
     entryTimestamp?: Date,
     fixedTimestamp?: Date
}): Fault {
     const entryTimestamp = props?.entryTimestamp ?? new Date();
     entryTimestamp.setMilliseconds(0);
     const fixedTimestamp = props?.fixedTimestamp ?? new Date();
     fixedTimestamp.setMilliseconds(0);
    return {
         id: someNumber(),
         entry_timestamp: entryTimestamp,
         fixed_timestamp: fixedTimestamp,
         domain: 'C_NA',
         state: props?.state ?? FaultState.Avoin,
         type: 'Rikkoutunut',
         fixed: false,
         aton_id: someNumber(),
         aton_name_fi: uuidv4(),
         aton_name_se: uuidv4(),
         aton_type_fi: 'Poiju',
         fairway_number: someNumber(),
         fairway_name_fi: someNumber(),
         fairway_name_se: someNumber(),
         area_number: 1,
         geometry: `POINT(${props?.geometry?.lon ?? someNumber()} ${props?.geometry?.lat ?? someNumber()})`
    };
}
