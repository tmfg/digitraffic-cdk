export interface DtRamiMessage {
    readonly id: string;
    readonly version: number;
    readonly created: Date;
    readonly startValidity: Date;
    readonly endValidity: Date;
    readonly trainNumber?: number;
    readonly trainDepartureDate?: Date;
    readonly journeyRef?: string;
    readonly stations?: string[];
    readonly video?: VideoContent;
    readonly audio?: AudioContent;
}

export interface VideoContent {
    readonly textFi?: string;
    readonly textSv?: string;
    readonly textEn?: string;
    readonly deliveryType?: string;
    readonly startDateTime?: Date;
    readonly endDateTime?: Date;
    readonly daysOfWeek?: DayOfWeek[];
}

export interface AudioContent {
    readonly textFi?: string;
    readonly textSv?: string;
    readonly textEn?: string;
    readonly deliveryType?: string;
    readonly startDateTime?: Date;
    readonly endDateTime?: Date;
    readonly daysOfWeek?: DayOfWeek[];
    readonly deliveryAt?: Date;
}

const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export type DayOfWeek = (typeof daysOfWeek)[number];

export enum RamiMessageType {
    MONITORED_JOURNEY_SCHEDULED_MESSAGE = "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
    SCHEDULED_MESSAGE = "SCHEDULED_MESSAGE"
}
