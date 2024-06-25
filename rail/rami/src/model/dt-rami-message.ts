import type { RosmMessageOperation, RosmMessageType } from "./rosm-message.js";

export interface DtRosmMessage {
    readonly id: string;
    readonly version: number;
    readonly messageType: RosmMessageType;
    readonly operation: RosmMessageOperation;
    readonly created: Date;
    readonly startValidity: Date;
    readonly endValidity: Date;
    readonly trainNumber?: number;
    readonly trainDepartureLocalDate?: string;
    readonly journeyRef?: string;
    readonly stations?: string[];
    readonly video?: DtVideoContent;
    readonly audio?: DtAudioContent;
}

export interface StMonitoringData {
    readonly stationShortCode: string
    readonly arrivalTimeUnknown: boolean
    readonly arrivalQuayUnknown: boolean
    readonly departureTimeUnknown: boolean
    readonly departureQuayUnknown: boolean
}
export interface DtSmMessage {
    readonly trainNumber: number
    readonly departureDate: string // YYYYMMDD

    readonly data: StMonitoringData[]
}

export interface DtVideoContent {
  readonly textFi?: string;
  readonly textSv?: string;
  readonly textEn?: string;
  readonly deliveryType?: string;
  readonly startDateTime?: Date;
  readonly endDateTime?: Date;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly daysOfWeek?: WeekDay[];
}

export interface DtAudioContent {
  readonly textFi?: string;
  readonly textSv?: string;
  readonly textEn?: string;
  readonly deliveryType?: string;
  readonly eventType?: string;
  readonly startDateTime?: Date;
  readonly endDateTime?: Date;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly daysOfWeek?: WeekDay[];
  readonly deliveryAt?: Date;
  readonly repetitions?: number;
  readonly repeatEvery?: number;
}

export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type WeekDay = (typeof WEEKDAYS)[number];
