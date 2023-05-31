export interface DtRamiMessage {
    readonly id: string;
    readonly version: number;
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

export interface DtVideoContent {
    readonly textFi?: string;
    readonly textSv?: string;
    readonly textEn?: string;
    readonly deliveryType?: string;
    readonly startDateTime?: Date;
    readonly endDateTime?: Date;
    readonly startTime?: string;
    readonly endTime?: string;
    readonly daysOfWeek?: DayOfWeek[];
}

export interface DtAudioContent {
    readonly textFi?: string;
    readonly textSv?: string;
    readonly textEn?: string;
    readonly deliveryType?: string;
    readonly startDateTime?: Date;
    readonly endDateTime?: Date;
    readonly startTime?: string;
    readonly endTime?: string;
    readonly daysOfWeek?: DayOfWeek[];
    readonly deliveryAt?: Date;
}

const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type DayOfWeek = (typeof daysOfWeek)[number];

export enum RamiMessageType {
    MONITORED_JOURNEY_SCHEDULED_MESSAGE = "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
    SCHEDULED_MESSAGE = "SCHEDULED_MESSAGE"
}
