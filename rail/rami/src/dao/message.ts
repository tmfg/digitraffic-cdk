/* eslint-disable @rushstack/no-new-null */
import { MYSQL_DATETIME_FORMAT, dateToUTCString } from "@digitraffic/common/dist/utils/date-utils.js";
import type { Connection } from "mysql2/promise.js";
import type { DtRamiMessage } from "../model/dt-rami-message.js";
import { mapDaysToBits } from "../util/weekdays.js";
import { inDatabase, inTransaction } from "../util/database.js";

export interface DbRamiAudio {
    readonly text_fi: string | null;
    readonly text_sv: string | null;
    readonly text_en: string | null;
    readonly delivery_rules: {
        readonly start_date: Date | null;
        readonly end_date: Date | null;
        readonly start_time: string | null;
        readonly end_time: string | null;
        readonly days: string | null;
        readonly delivery_type: string | null;
        readonly event_type: string | null;
        readonly delivery_at: Date | null;
        readonly repetitions: number | null;
        readonly repeat_every: number | null;
    };
}

export interface DbRamiVideo {
    readonly text_fi: string | null;
    readonly text_sv: string | null;
    readonly text_en: string | null;
    readonly delivery_rules: {
        readonly start_date: Date | null;
        readonly end_date: Date | null;
        readonly start_time: string | null;
        readonly end_time: string | null;
        readonly days: string | null;
        readonly delivery_type: string | null;
    };
}

export interface DbRamiMessage {
    readonly id: string;
    readonly version: number;
    readonly created_source: Date;
    readonly start_validity: Date;
    readonly end_validity: Date;
    readonly train_number: number | null;
    readonly train_departure_date: string | null;
    readonly stations: string | null;
    readonly audio: DbRamiAudio;
    readonly video: DbRamiVideo;
}

const INSERT_RAMI_MESSAGE =
    "INSERT INTO rami_message(id, version, message_type, created_source, start_validity, end_validity, train_number, train_departure_date, journey_ref) VALUES (:id, :version, :messageType, :created, :startValidity, :endValidity, :trainNumber, :trainDepartureDate, :journeyRef)";

const INSERT_RAMI_MESSAGE_STATIONS =
    "INSERT INTO rami_message_station(rami_message_id, rami_message_version, station_short_code) VALUES ?";

const INSERT_RAMI_MESSAGE_VIDEO =
    "INSERT INTO rami_message_video(rami_message_id, rami_message_version, text_fi, text_sv, text_en, delivery_type, start_date_time, end_date_time, start_time, end_time, days_of_week) VALUES (:id, :version, :textFi, :textSv, :textEn, :deliveryType, :startDateTime, :endDateTime, :startTime, :endTime, b:days)";

const INSERT_RAMI_MESSAGE_AUDIO =
    "INSERT INTO rami_message_audio(rami_message_id, rami_message_version, text_fi, text_sv, text_en, delivery_type, start_date_time, end_date_time, start_time, end_time, days_of_week, event_type, delivery_at, repetitions, repeat_every) VALUES (:id, :version, :textFi, :textSv, :textEn, :deliveryType, :startDateTime, :endDateTime, :startTime, :endTime, b:days, :eventType, :deliveryAt, :repetitions, :repeatEvery)";

const SET_DELETED = "UPDATE rami_message SET deleted = NOW() WHERE id = ?";

const FIND_ACTIVE = `
SELECT
    rm.id,
    rm.version,
    DATE_FORMAT(rm.created_source, '%Y-%m-%dT%TZ') as created_source,
    DATE_FORMAT(rm.start_validity, '%Y-%m-%dT%TZ') as start_validity,
    DATE_FORMAT(rm.end_validity, '%Y-%m-%dT%TZ') as end_validity,
    rm.train_number,
    DATE_FORMAT(rm.train_departure_date, '%Y-%m-%d') as train_departure_date,
    GROUP_CONCAT(rms.station_short_code) as stations,
    JSON_OBJECT('text_fi', rma.text_fi, 'text_sv', rma.text_sv, 'text_en', rma.text_en, 'delivery_rules', JSON_OBJECT('start_date', DATE_FORMAT(rma.start_date_time, '%Y-%m-%dT%TZ'), 'end_date', DATE_FORMAT(rma.end_date_time, '%Y-%m-%dT%TZ'), 'start_time', DATE_FORMAT(rma.start_time, '%k:%i'), 'end_time', DATE_FORMAT(rma.end_time, '%k:%i'), 'delivery_type', rma.delivery_type, 'days', NULLIF(REVERSE(EXPORT_SET(rma.days_of_week, '1', '0', '', 7)), '0000000'), 'event_type', rma.event_type, 'delivery_at', rma.delivery_at, 'repetitions', rma.repetitions, 'repeat_every', rma.repeat_every)) as audio,
    JSON_OBJECT('text_fi', rmv.text_fi, 'text_sv', rmv.text_sv, 'text_en', rmv.text_en, 'delivery_rules', JSON_OBJECT('start_date', DATE_FORMAT(rmv.start_date_time, '%Y-%m-%dT%TZ'), 'end_date', DATE_FORMAT(rmv.end_date_time, '%Y-%m-%dT%TZ'), 'start_time', DATE_FORMAT(rmv.start_time, '%k:%i'), 'end_time', DATE_FORMAT(rmv.end_time, '%k:%i'), 'delivery_type', rmv.delivery_type, 'days', NULLIF(REVERSE(EXPORT_SET(rmv.days_of_week, '1', '0', '', 7)), '0000000'))) as video
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
    AND rm.end_validity > NOW()
    AND (
        :trainNumber IS NULL
        OR rm.train_number = :trainNumber
    )
    AND (
        :trainDepartureDate IS NULL
        OR rm.train_departure_date = :trainDepartureDate
    )
    AND IF(:onlyGeneral IS TRUE, rm.message_type = 'SCHEDULED_MESSAGE', TRUE)
    AND (
        :station IS NULL
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
                rmsx.station_short_code = :station
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

const FIND_UPDATED_AFTER = `
SELECT
    rm.id,
    rm.version,
    DATE_FORMAT(rm.created_source, '%Y-%m-%dT%TZ') as created_source,
    DATE_FORMAT(rm.start_validity, '%Y-%m-%dT%TZ') as start_validity,
    DATE_FORMAT(rm.end_validity, '%Y-%m-%dT%TZ') as end_validity,
    rm.train_number,
    DATE_FORMAT(rm.train_departure_date, '%Y-%m-%d') as train_departure_date,
    GROUP_CONCAT(rms.station_short_code) as stations,
    JSON_OBJECT('text_fi', rma.text_fi, 'text_sv', rma.text_sv, 'text_en', rma.text_en, 'delivery_rules', JSON_OBJECT('start_date', DATE_FORMAT(rma.start_date_time, '%Y-%m-%dT%TZ'), 'end_date', DATE_FORMAT(rma.end_date_time, '%Y-%m-%dT%TZ'), 'start_time', DATE_FORMAT(rma.start_time, '%k:%i'), 'end_time', DATE_FORMAT(rma.end_time, '%k:%i'), 'delivery_type', rma.delivery_type, 'days', NULLIF(REVERSE(EXPORT_SET(rma.days_of_week, '1', '0', '', 7)), '0000000'), 'event_type', rma.event_type, 'delivery_at', rma.delivery_at, 'repetitions', rma.repetitions, 'repeat_every', rma.repeat_every)) as audio,
    JSON_OBJECT('text_fi', rmv.text_fi, 'text_sv', rmv.text_sv, 'text_en', rmv.text_en, 'delivery_rules', JSON_OBJECT('start_date', DATE_FORMAT(rmv.start_date_time, '%Y-%m-%dT%TZ'), 'end_date', DATE_FORMAT(rmv.end_date_time, '%Y-%m-%dT%TZ'), 'start_time', DATE_FORMAT(rmv.start_time, '%k:%i'), 'end_time', DATE_FORMAT(rmv.end_time, '%k:%i'), 'delivery_type', rmv.delivery_type, 'days', NULLIF(REVERSE(EXPORT_SET(rmv.days_of_week, '1', '0', '', 7)), '0000000'))) as video
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
    rm.created_source >= :updatedAfter
    AND IF(:onlyActive IS TRUE, rm.start_validity <= NOW() AND rm.end_validity > NOW(), TRUE)
    AND IF(:onlyGeneral IS TRUE, rm.message_type = 'SCHEDULED_MESSAGE', TRUE)
    AND (
        :trainNumber IS NULL
        OR rm.train_number = :trainNumber
    )
    AND (
        :trainDepartureDate IS NULL
        OR rm.train_departure_date = :trainDepartureDate
    )
    AND (
        :station IS NULL
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
                rmsx.station_short_code = :station
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
    station: string | null = null,
    onlyGeneral: boolean | null = null
): Promise<DbRamiMessage[]> {
    const [rows] = await inDatabase(async (conn: Connection) => {
        return conn.query(FIND_ACTIVE, {
            trainNumber,
            trainDepartureDate,
            station,
            onlyGeneral
        });
    });
    return rows as DbRamiMessage[];
}

export async function findMessagesUpdatedAfter(
    updatedAfter: Date,
    trainNumber: number | null = null,
    trainDepartureDate: string | null = null,
    station: string | null = null,
    onlyGeneral: boolean | null = null,
    onlyActive: boolean = true
): Promise<DbRamiMessage[]> {
    const [rows] = await inDatabase(async (conn: Connection) => {
        return conn.query(FIND_UPDATED_AFTER, {
            updatedAfter,
            trainNumber,
            trainDepartureDate,
            station,
            onlyGeneral,
            onlyActive
        });
    });
    return rows as DbRamiMessage[];
}

export async function insertMessage(message: DtRamiMessage): Promise<void> {
    return inTransaction(async (conn: Connection): Promise<void> => {
        await conn.query(INSERT_RAMI_MESSAGE, createDtRamiMessageInsertValues(message));
        await conn.query(INSERT_RAMI_MESSAGE_STATIONS, createDtRamiMessageStationInsertValues(message));
        await conn.query(INSERT_RAMI_MESSAGE_AUDIO, createDtRamiMessageAudioInsertValues(message));
        await conn.query(INSERT_RAMI_MESSAGE_VIDEO, createDtRamiMessageVideoInsertValues(message));
    });
}

export async function setMessageDeleted(messageId: string): Promise<void> {
    return inTransaction(async (conn: Connection) => {
        await conn.query(SET_DELETED, [messageId]);
    });
}

function createDtRamiMessageInsertValues(message: DtRamiMessage): unknown {
    return {
        id: message.id,
        version: message.version,
        messageType: message.messageType,
        created: dateToUTCString(message.created, MYSQL_DATETIME_FORMAT),
        startValidity: dateToUTCString(message.startValidity, MYSQL_DATETIME_FORMAT),
        endValidity: dateToUTCString(message.endValidity, MYSQL_DATETIME_FORMAT),
        trainNumber: message.trainNumber ?? null,
        trainDepartureDate: message.trainDepartureLocalDate ?? null,
        journeyRef: message.journeyRef ?? null
    };
}

function createDtRamiMessageStationInsertValues(message: DtRamiMessage): (string | number)[][][] | null {
    return message.stations
        ? [message.stations.map((station) => [message.id, message.version, station])]
        : null;
}

function createDtRamiMessageVideoInsertValues(message: DtRamiMessage): unknown {
    return {
        id: message.id,
        version: message.version,
        textFi: message.video?.textFi ?? null,
        textSv: message.video?.textSv ?? null,
        textEn: message.video?.textEn ?? null,
        deliveryType: message.video?.deliveryType ?? null,
        startDateTime: message.video?.startDateTime
            ? dateToUTCString(message.video.startDateTime, MYSQL_DATETIME_FORMAT)
            : null,
        endDateTime: message.video?.endDateTime
            ? dateToUTCString(message.video.endDateTime, MYSQL_DATETIME_FORMAT)
            : null,
        startTime: message.video?.startTime ?? null,
        endTime: message.video?.endTime ?? null,
        days: message.video?.daysOfWeek ? mapDaysToBits(message.video.daysOfWeek) : "0000000"
    };
}

function createDtRamiMessageAudioInsertValues(message: DtRamiMessage): unknown {
    return {
        id: message.id,
        version: message.version,
        textFi: message.audio?.textFi ?? null,
        textSv: message.audio?.textSv ?? null,
        textEn: message.audio?.textEn ?? null,
        deliveryType: message.audio?.deliveryType ?? null,
        startDateTime: message.audio?.startDateTime
            ? dateToUTCString(message.audio.startDateTime, MYSQL_DATETIME_FORMAT)
            : null,
        endDateTime: message.audio?.endDateTime
            ? dateToUTCString(message.audio.endDateTime, MYSQL_DATETIME_FORMAT)
            : null,
        startTime: message.audio?.startTime ?? null,
        endTime: message.audio?.endTime ?? null,
        days: message.audio?.daysOfWeek ? mapDaysToBits(message.audio.daysOfWeek) : "0000000",
        eventType: message.audio?.eventType ?? null,
        deliveryAt: message.audio?.deliveryAt ?? null,
        repetitions: message.audio?.repetitions ?? null,
        repeatEvery: message.audio?.repeatEvery ?? null
    };
}
