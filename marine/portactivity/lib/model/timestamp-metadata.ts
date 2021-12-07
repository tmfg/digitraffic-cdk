import {EventType} from "./timestamp";

export enum S211TimeType {
    Actual = 'Actual',
    Estimated = 'Estimated',
    Planned = 'Planned',
    Requested = 'Requested'
}

type TimestampType = {
    readonly timeType: S211TimeType
    readonly stateCode: string
}

const metadata: { [key: string] : TimestampType } = {};

metadata[EventType.APC] = {
    timeType: S211TimeType.Actual,
    stateCode: 'Pilotage_Completed',
};
metadata[EventType.APS] = {
    timeType: S211TimeType.Actual,
    stateCode: 'Pilotage_Commenced',
};
metadata[EventType.ATA] = {
    timeType: S211TimeType.Actual,
    stateCode: 'Arrival_Vessel_Berth',
};
metadata[EventType.ATD] = {
    timeType: S211TimeType.Actual,
    stateCode: 'Departure_Vessel_Berth',
};
metadata[EventType.ETA] = {
    timeType: S211TimeType.Estimated,
    stateCode: 'Arrival_Vessel_Berth',
};
metadata[EventType.ETB] = {
    timeType: S211TimeType.Estimated,
    stateCode: 'Arrival_Vessel_Berth',
};
metadata[EventType.ETP] = {
    timeType: S211TimeType.Estimated,
    stateCode: 'Arrival_Vessel_Pilotage',
};
metadata[EventType.ETD] = {
    timeType: S211TimeType.Estimated,
    stateCode: 'Departure_Vessel_Berth',
};
metadata[EventType.PPS] = {
    timeType: S211TimeType.Planned,
    stateCode: 'Pilotage_Confirmed',
};
metadata[EventType.RPS] = {
    timeType: S211TimeType.Requested,
    stateCode: 'Pilotage_Requested',
};

export const TimestampMetadata = metadata;
