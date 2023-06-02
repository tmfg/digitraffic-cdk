export interface DtRamiMessage {
    readonly id: string;
    readonly version: number;
    readonly messageType: string;
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
    readonly repetitions?: number;
    readonly repeatEvery?: number;
}

export const daysOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
] as const;
export type DayOfWeek = (typeof daysOfWeek)[number];
