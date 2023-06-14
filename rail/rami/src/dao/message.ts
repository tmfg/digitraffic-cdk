import type { Connection } from "mysql2/promise.js";
import { DtRamiMessage, WEEKDAYS, WeekDay } from "../model/dt-rami-message.js";
import { MysqlQueryResponse, inDatabase, inTransaction } from "../util/database.js";

const INSERT_RAMI_MESSAGE =
    "INSERT INTO rami_message(id, version, message_type, created_source, start_validity, end_validity, train_number, train_departure_date, journey_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ? , ?)";

const INSERT_RAMI_MESSAGE_STATIONS =
    "INSERT INTO rami_message_station(rami_message_id, rami_message_version, station_short_code) VALUES ?";

const INSERT_RAMI_MESSAGE_VIDEO =
    "INSERT INTO rami_message_video(rami_message_id, rami_message_version, text_fi, text_sv, text_en, delivery_type, start_date_time, end_date_time, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, b?)";

const INSERT_RAMI_MESSAGE_AUDIO =
    "INSERT INTO rami_message_audio(rami_message_id, rami_message_version, text_fi, text_sv, text_en, delivery_type, event_type, start_date_time, end_date_time, start_time, end_time, days_of_week, delivery_at, repetitions, repeat_every) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, b?, ?, ?, ?)";

const SET_DELETED = "UPDATE rami_message SET deleted = NOW() WHERE id = ?";

const SELECT_ALL_MESSAGES =
    "SELECT rm.*, GROUP_CONCAT(rms.station_short_code) as stations, rma.text_fi as audio_text_fi, rmv.text_fi as video_text_fi, rma.delivery_type as audio_delivery_type, rmv.delivery_type as video_delivery_type, export_set(rma.days_of_week,'1','0','',7) as audio_days, export_set(rmv.days_of_week,'1','0','',7) as video_days FROM rami_message rm JOIN rami_message_station rms ON rm.id = rms.rami_message_id AND rm.version = rms.rami_message_version JOIN rami_message_audio rma ON rm.id = rma.rami_message_id AND rm.version = rma.rami_message_version JOIN rami_message_video rmv ON rm.id = rmv.rami_message_id AND rm.version = rmv.rami_message_version group by rm.id, rm.version, rma.text_fi, rmv.text_fi, rma.delivery_type, rmv.delivery_type, rma.days_of_week, rmv.days_of_week ";

export async function findAll(): Promise<MysqlQueryResponse> {
    return inDatabase(async (conn: Connection) => {
        return conn.query(SELECT_ALL_MESSAGES);
    });
}

export async function insertMessage(message: DtRamiMessage): Promise<void> {
    return inTransaction(async (conn: Connection): Promise<void> => {
        await conn.query(INSERT_RAMI_MESSAGE, createDtRamiMessageInsertValues(message));
        if (message.stations)
            await conn.query(INSERT_RAMI_MESSAGE_STATIONS, createDtRamiMessageStationInsertValues(message));
        if (message.audio)
            await conn.query(INSERT_RAMI_MESSAGE_AUDIO, createDtRamiMessageAudioInsertValues(message));
        if (message.video)
            await conn.query(INSERT_RAMI_MESSAGE_VIDEO, createDtRamiMessageVideoInsertValues(message));
    });
}

export async function setMessageDeleted(message: DtRamiMessage): Promise<void> {
    return inTransaction(async (conn: Connection) => {
        await conn.query(SET_DELETED, [message.id]);
    });
}

function createDtRamiMessageInsertValues(message: DtRamiMessage): unknown[] {
    return [
        message.id,
        message.version,
        message.messageType,
        message.created,
        message.startValidity,
        message.endValidity,
        message.trainNumber,
        message.trainDepartureLocalDate,
        message.journeyRef
    ];
}

function createDtRamiMessageStationInsertValues(message: DtRamiMessage): (string | number)[][][] | null {
    return message.stations
        ? [message.stations.map((station) => [message.id, message.version, station])]
        : null;
}

function createDtRamiMessageVideoInsertValues(message: DtRamiMessage): unknown[] {
    return [
        message.id,
        message.version,
        message.video?.textFi ?? null,
        message.video?.textSv ?? null,
        message.video?.textEn ?? null,
        message.video?.deliveryType ?? null,
        message.video?.startDateTime ?? null,
        message.video?.endDateTime ?? null,
        message.video?.startTime ?? null,
        message.video?.endTime ?? null,
        message.video?.daysOfWeek ? mapDaysToBits(message.video.daysOfWeek) : "0000000"
    ];
}

function createDtRamiMessageAudioInsertValues(message: DtRamiMessage): unknown[] {
    return [
        message.id,
        message.version,
        message.audio?.textFi ?? null,
        message.audio?.textSv ?? null,
        message.audio?.textEn ?? null,
        message.audio?.deliveryType ?? null,
        message.audio?.eventType ?? null,
        message.audio?.startDateTime ?? null,
        message.audio?.endDateTime ?? null,
        message.audio?.startTime ?? null,
        message.audio?.endTime ?? null,
        message.audio?.daysOfWeek ? mapDaysToBits(message.audio.daysOfWeek) : "0000000",
        message.audio?.deliveryAt ?? null,
        message.audio?.repetitions ?? null,
        message.audio?.repeatEvery ?? null
    ];
}

type WeekDayBitString = `${"0" | "1"}${"0" | "1"}${"0" | "1"}${"0" | "1"}${"0" | "1"}${"0" | "1"}${
    | "0"
    | "1"}`;

function mapDaysToBits(days: WeekDay[]): WeekDayBitString {
    return WEEKDAYS.map((day) => (days.includes(day) ? "1" : "0")).join("") as WeekDayBitString;
}

export function mapBitsToDays(days: WeekDayBitString): WeekDay[] {
    const dayBits = days.split("").reverse();
    const dayStrings: WeekDay[] = [];
    for (let i = 0; i < dayBits.length; i++) {
        if (dayBits[i] === "1") dayStrings.push(WEEKDAYS[i] as unknown as WeekDay);
    }
    return dayStrings;
}
