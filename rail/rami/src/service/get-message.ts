import type { DbRamiMessage } from "../dao/message.js";
import {
  findActiveMessages,
  findMessagesUpdatedAfter,
} from "../dao/message.js";
import type { WeekDay } from "../model/dt-rami-message.js";
import type { WeekDaysBitString } from "../util/weekdays.js";
import { mapBitsToDays } from "../util/weekdays.js";

export interface PassengerInformationText {
  readonly fi?: string;
  readonly sv?: string;
  readonly en?: string;
}

export interface PassengerInformationAudio {
  readonly text: PassengerInformationText;
  readonly deliveryRules?: {
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

export interface PassengerInformationVideo {
  readonly text: PassengerInformationText;
  readonly deliveryRules?: {
    readonly startDateTime?: Date;
    readonly endDateTime?: Date;
    readonly startTime?: string;
    readonly endTime?: string;
    readonly weekDays?: WeekDay[];
    readonly deliveryType?: string;
  };
}

export interface PassengerInformationMessage {
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
  station?: string,
  onlyGeneral?: boolean,
): Promise<PassengerInformationMessage[]> {
  const activeMessages = await findActiveMessages(
    trainNumber,
    trainDepartureDate,
    station,
    onlyGeneral,
  );
  return activeMessages.map(dbRamiMessageToPassengerInformationMessage);
}

export async function getMessagesUpdatedAfter(
  updatedAfter: Date,
  trainNumber?: number,
  trainDepartureDate?: string,
  station?: string,
  onlyGeneral?: boolean,
  onlyActive: boolean = true,
): Promise<PassengerInformationMessage[]> {
  const messagesUpdatedAfter = await findMessagesUpdatedAfter(
    updatedAfter,
    trainNumber,
    trainDepartureDate,
    station,
    onlyGeneral,
    onlyActive,
  );
  return messagesUpdatedAfter.map(dbRamiMessageToPassengerInformationMessage);
}

function dbRamiMessageToPassengerInformationMessage(
  message: DbRamiMessage,
): PassengerInformationMessage {
  return {
    id: message.id,
    version: message.version,
    creationDateTime: message.created_source,
    startValidity: message.start_validity,
    endValidity: message.end_validity,
    trainNumber: message.train_number ?? undefined,
    trainDepartureDate: message.train_departure_date ?? undefined,
    stations:
      message.stations && message.stations.length > 0
        ? message.stations.split(",")
        : undefined,
    ...(messageContainsAudio(message) && {
      audio: {
        text: {
          fi: message.audio?.text_fi ?? undefined,
          sv: message.audio?.text_sv ?? undefined,
          en: message.audio?.text_en ?? undefined,
        },
        ...(audioContainsDeliveryRules(message) && {
          deliveryRules: {
            startDateTime:
              message.audio?.delivery_rules?.start_date ?? undefined,
            endDateTime: message.audio?.delivery_rules?.end_date ?? undefined,
            startTime: message.audio?.delivery_rules?.start_time ?? undefined,
            endTime: message.audio?.delivery_rules?.end_time ?? undefined,
            weekDays: message.audio?.delivery_rules?.days
              ? mapBitsToDays(
                  message.audio.delivery_rules.days as WeekDaysBitString,
                )
              : undefined,
            deliveryType:
              message.audio?.delivery_rules?.delivery_type ?? undefined,
            repetitions:
              message.audio?.delivery_rules?.repetitions ?? undefined,
            repeatEvery:
              message.audio?.delivery_rules?.repeat_every ?? undefined,
            eventType: message.audio?.delivery_rules?.event_type ?? undefined,
          },
        }),
      },
    }),
    ...(messageContainsVideo(message) && {
      video: {
        text: {
          fi: message.video.text_fi ?? undefined,
          sv: message.video.text_sv ?? undefined,
          en: message.video.text_en ?? undefined,
        },
        ...(videoContainsDeliveryRules(message) && {
          deliveryRules: {
            startDateTime:
              message.video?.delivery_rules.start_date ?? undefined,
            endDateTime: message.video?.delivery_rules.end_date ?? undefined,
            startTime: message.video?.delivery_rules.start_time ?? undefined,
            endTime: message.video?.delivery_rules.end_time ?? undefined,
            weekDays: message.video?.delivery_rules.days
              ? mapBitsToDays(
                  message.video.delivery_rules.days as WeekDaysBitString,
                )
              : undefined,
            deliveryType:
              message.video?.delivery_rules.delivery_type ?? undefined,
          },
        }),
      },
    }),
  };
}

function messageContainsAudio(message: DbRamiMessage): boolean {
  return (
    !!message.audio.text_fi ||
    !!message.audio.text_en ||
    !!message.audio.text_sv
  );
}

function audioContainsDeliveryRules(message: DbRamiMessage): boolean {
  return !!Object.values(message.audio.delivery_rules).find((value) => !!value);
}

function messageContainsVideo(message: DbRamiMessage): boolean {
  return (
    !!message.video.text_fi ||
    !!message.video.text_en ||
    !!message.video.text_sv
  );
}

function videoContainsDeliveryRules(message: DbRamiMessage): boolean {
  return !!Object.values(message.video.delivery_rules).find((value) => !!value);
}
