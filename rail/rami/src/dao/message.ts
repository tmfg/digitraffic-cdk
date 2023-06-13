import type { Connection } from "mysql2/promise.js";
import { DtRamiMessage, WEEKDAYS, WeekDay } from "../model/dt-rami-message.js";
import { inDatabase, inTransaction } from "../util/database.js";
import { formatInTimeZone } from "../util/date.js";

export interface DbRamiMessage {
    readonly id: string;
    readonly version: number;
    readonly created_source: Date;
    readonly start_validity: Date;
    readonly end_validity: Date;
    readonly train_number: number | null;
    readonly train_departure_date: string | null;
    readonly stations: string | null;
    readonly audio_text_fi?: string | null;
    readonly audio_text_sv?: string | null;
    readonly audio_text_en?: string | null;
    readonly audio_start_date?: Date | null;
    readonly audio_end_date?: Date | null;
    readonly audio_start_time?: string | null;
    readonly audio_end_time?: string | null;
    readonly audio_days?: string | null;
    readonly audio_delivery_type?: string | null;
    readonly audio_event_type?: string | null;
    readonly audio_delivery_at?: Date | null;
    readonly audio_repetitions?: number | null;
    readonly audio_repeat_every?: number | null;
    readonly video_text_fi?: string | null;
    readonly video_text_sv?: string | null;
    readonly video_text_en?: string | null;
    readonly video_start_date?: Date | null;
    readonly video_end_date?: Date | null;
    readonly video_start_time?: string | null;
    readonly video_end_time?: string | null;
    readonly video_days?: string | null;
    readonly video_delivery_type?: string | null;
}

const INSERT_RAMI_MESSAGE =
    "INSERT INTO rami_message(id, version, message_type, created_source, start_validity, end_validity, train_number, train_departure_date, journey_ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

const INSERT_RAMI_MESSAGE_STATIONS =
    "INSERT INTO rami_message_station(rami_message_id, rami_message_version, station_short_code) VALUES ?";

const INSERT_RAMI_MESSAGE_VIDEO =
    "INSERT INTO rami_message_video(rami_message_id, rami_message_version, text_fi, text_sv, text_en, delivery_type, start_date_time, end_date_time, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, b?)";

const INSERT_RAMI_MESSAGE_AUDIO =
    "INSERT INTO rami_message_audio(rami_message_id, rami_message_version, text_fi, text_sv, text_en, delivery_type, event_type, start_date_time, end_date_time, start_time, end_time, days_of_week, delivery_at, repetitions, repeat_every) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, b?, ?, ?, ?)";

const SET_DELETED = "UPDATE rami_message SET deleted = NOW() WHERE id = ?";

const FIND_ACTIVE = `
SELECT
    rm.id,
    rm.version,
    rm.created_source,
    rm.start_validity,
    rm.end_validity,
    rm.train_number,
    DATE_FORMAT(rm.train_departure_date, '%Y-%m-%d') as train_departure_date,
    GROUP_CONCAT(rms.station_short_code) as stations,
    rma.text_fi as audio_text_fi,
    rma.text_sv as audio_text_sv,
    rma.text_en as audio_text_en,
    rma.start_date_time as audio_start_date,
    rma.end_date_time as audio_end_date,
    rma.start_time as audio_start_time,
    rma.end_time as audio_end_time,
    rma.delivery_type as audio_delivery_type,
    rma.event_type as audio_event_type,
    rma.delivery_at as audio_delivery_at,
    rma.repetitions as audio_repetitions,
    rma.repeat_every as audio_repeat_every,
    export_set(rma.days_of_week, '1', '0', '', 7) as audio_days,
    rmv.text_fi as video_text_fi,
    rmv.text_sv as video_text_sv,
    rmv.text_en as video_text_en,
    rmv.start_date_time as video_start_date,
    rmv.end_date_time as video_end_date,
    rmv.start_time as video_start_time,
    rmv.end_time as video_end_time,
    rmv.delivery_type as video_delivery_type,
    export_set(rmv.days_of_week, '1', '0', '', 7) as video_days
FROM
    rami_message rm
    JOIN (
        SELECT
            rmx.id,
            MAX(rmx.version) as version
        FROM
            rami_message rmx
        GROUP BY
            rmx.id
    ) latest ON rm.id = latest.id
    AND rm.version = latest.version
    JOIN rami_message_station rms ON rm.id = rms.rami_message_id
    AND rm.version = rms.rami_message_version
    JOIN rami_message_audio rma ON rm.id = rma.rami_message_id
    AND rm.version = rma.rami_message_version
    JOIN rami_message_video rmv ON rm.id = rmv.rami_message_id
    AND rm.version = rmv.rami_message_version
WHERE
    rm.deleted IS NULL
    AND
    rm.start_validity <= NOW()
    AND rm.end_validity >= NOW()
    AND (
        ? IS NULL
        OR rm.train_number = ?
    )
    AND (
        ? IS NULL
        OR rm.train_departure_date = ?
    )
    AND (
        ? IS NULL
        OR rm.id IN (
            SELECT
                rmx.id
            FROM
                rami_message rmx
                JOIN (
                    SELECT
                        rmx.id,
                        MAX(rmx.version) as version
                    from
                        rami_message rmx
                    group by
                        rmx.id
                ) latest ON rmx.id = latest.id
                AND rmx.version = latest.version
                JOIN rami_message_station rmsx ON rmx.id = rmsx.rami_message_id
                AND rmx.version = rmsx.rami_message_version
            WHERE
                rmsx.station_short_code = ?
        )
    )
GROUP BY
    rm.id,
    rm.version,
    rm.created_source,
    rm.start_validity,
    rm.end_validity,
    rm.train_number,
    rm.train_departure_date,
    rma.text_fi,
    rma.text_sv,
    rma.text_en,
    rma.start_date_time,
    rma.end_date_time,
    rma.start_time,
    rma.end_time,
    rma.days_of_week,
    rma.delivery_type,
    rma.event_type,
    rma.delivery_at,
    rma.repetitions,
    rma.repeat_every,
    rmv.text_fi,
    rmv.text_sv,
    rmv.text_en,
    rmv.start_date_time,
    rmv.end_date_time,
    rmv.start_time,
    rmv.end_time,
    rmv.days_of_week,
    rmv.delivery_type 
`;

export async function findActiveMessages(
    trainNumber: number | null = null,
    trainDepartureDate: string | null = null,
    station: string | null = null
): Promise<DbRamiMessage[]> {
    const [rows] = await inDatabase(async (conn: Connection) => {
        return conn.execute(FIND_ACTIVE, [
            trainNumber,
            trainNumber,
            trainDepartureDate,
            trainDepartureDate,
            station,
            station
        ]);
    });
    return rows as DbRamiMessage[];
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
        formatInTimeZone(message.created, "yyyy-MM-dd HH:mm", "UTC"),
        formatInTimeZone(message.startValidity, "yyyy-MM-dd HH:mm", "UTC"),
        formatInTimeZone(message.endValidity, "yyyy-MM-dd HH:mm", "UTC"),
        message.trainNumber ?? null,
        message.trainDepartureLocalDate ?? null,
        message.journeyRef ?? null
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
        message.video?.startDateTime
            ? formatInTimeZone(message.video.startDateTime, "yyyy-MM-dd HH:mm", "UTC")
            : null,
        message.video?.endDateTime
            ? formatInTimeZone(message.video.endDateTime, "yyyy-MM-dd HH:mm", "UTC")
            : null,
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
        message.audio?.startDateTime
            ? formatInTimeZone(message.audio.startDateTime, "yyyy-MM-dd HH:mm", "UTC")
            : null,
        message.audio?.endDateTime
            ? formatInTimeZone(message.audio.endDateTime, "yyyy-MM-dd HH:mm", "UTC")
            : null,
        message.audio?.startTime ?? null,
        message.audio?.endTime ?? null,
        message.audio?.daysOfWeek ? mapDaysToBits(message.audio.daysOfWeek) : "0000000",
        message.audio?.deliveryAt ?? null,
        message.audio?.repetitions ?? null,
        message.audio?.repeatEvery ?? null
    ];
}

export type WeekDayBitString = `${"0" | "1"}${"0" | "1"}${"0" | "1"}${"0" | "1"}${"0" | "1"}${"0" | "1"}${
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
