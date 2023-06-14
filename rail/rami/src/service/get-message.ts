import { DbRamiMessage, WeekDayBitString, findActiveMessages, mapBitsToDays } from "../dao/message";
import type { WeekDay } from "../model/dt-rami-message";

interface PassengerInformationText {
    readonly fi?: string;
    readonly sv?: string;
    readonly en?: string;
}

interface PassengerInformationAudio {
    readonly text: PassengerInformationText;
    readonly deliveryRules: {
        readonly startDateTime?: Date;
        readonly endDateTime?: Date;
        readonly startTime?: string;
        readonly endTime?: string;
        readonly weekDays?: WeekDay[];
        readonly deliveryType?: string;
        readonly deliveryAt?: Date;
        readonly repetitions?: number;
        readonly repeatEvery?: number;
        readonly eventType?: string;
    };
}

interface PassengerInformationVideo {
    readonly text: PassengerInformationText;
    readonly deliveryRules: {
        readonly startDateTime?: Date;
        readonly endDateTime?: Date;
        readonly startTime?: string;
        readonly endTime?: string;
        readonly weekDays?: WeekDay[];
        readonly deliveryType?: string;
    };
}

interface PassengerInformationMessage {
    readonly id: string;
    readonly version: number;
    readonly creationDateTime: Date;
    readonly startValidity: Date;
    readonly endValidity: Date;
    readonly stations?: string[];
    readonly trainNumber?: number;
    readonly trainDepartureDate?: string;
    readonly audio?: PassengerInformationAudio;
    readonly video?: PassengerInformationVideo;
}

export async function getActiveMessages(
    trainNumber?: number,
    trainDepartureDate?: string,
    station?: string
): Promise<PassengerInformationMessage[]> {
    const activeMessages = await findActiveMessages(trainNumber, trainDepartureDate, station);
    return activeMessages.map(dbRamiMessageToPassengerInformationMessage);
}

function dbRamiMessageToPassengerInformationMessage(message: DbRamiMessage): PassengerInformationMessage {
    return {
        id: message.id,
        version: message.version,
        creationDateTime: message.created_source,
        startValidity: message.start_validity,
        endValidity: message.end_validity,
        trainNumber: message.train_number ?? undefined,
        trainDepartureDate: message.train_departure_date ?? undefined,
        stations: message.stations && message.stations.length > 0 ? message.stations.split(",") : undefined,
        audio: {
            text: {
                fi: message.audio_text_fi ?? undefined,
                sv: message.audio_text_sv ?? undefined,
                en: message.audio_text_en ?? undefined
            },
            deliveryRules: {
                startDateTime: message.audio_start_date ?? undefined,
                endDateTime: message.audio_end_date ?? undefined,
                startTime: message.audio_start_time ?? undefined,
                endTime: message.audio_end_time ?? undefined,
                weekDays: message.audio_days
                    ? mapBitsToDays(message.audio_days as WeekDayBitString)
                    : undefined,
                deliveryType: message.audio_delivery_type ?? undefined,
                repetitions: message.audio_repetitions ?? undefined,
                repeatEvery: message.audio_repeat_every ?? undefined,
                eventType: message.audio_event_type ?? undefined
            }
        },
        video: {
            text: {
                fi: message.video_text_fi ?? undefined,
                sv: message.video_text_sv ?? undefined,
                en: message.video_text_en ?? undefined
            },
            deliveryRules: {
                startDateTime: message.video_start_date ?? undefined,
                endDateTime: message.video_end_date ?? undefined,
                startTime: message.video_start_time ?? undefined,
                endTime: message.video_end_time ?? undefined,
                weekDays: message.video_days
                    ? mapBitsToDays(message.video_days as WeekDayBitString)
                    : undefined,
                deliveryType: message.video_delivery_type ?? undefined
            }
        }
    };
}
