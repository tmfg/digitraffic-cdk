import {PreparedStatement} from "pg-promise";
import {DTDatabase} from "digitraffic-common/database/database";
import {AlarmType, AlarmTypes, alarmTypesParser} from "../model/road-condition-alarm-types";

const SQL_INSERT_ALARM_TYPE_VALUE =
    `insert into road_network_conditions_alarm_types("alarmId", "alarmText")
     values ($1, $2)`;

const SQL_FIND_ALARM_TYPES =
    `select "alarmId", "alarmText"
     from road_network_conditions_alarm_types`;

const PS_INSERT_ALARM_TYPES = new PreparedStatement({
    name: 'insert-alarm-type-value',
    text: SQL_INSERT_ALARM_TYPE_VALUE,
});

const PS_GET_ALARM_TYPES = new PreparedStatement({
    name: 'find-alarm-types',
    text: SQL_FIND_ALARM_TYPES,
});

export function insertAlarmType(db: DTDatabase, at: AlarmType): Promise<null> {
    return db.none(PS_INSERT_ALARM_TYPES, [at.alarmId, at.alarmText]);
}

export function insertAlarmTypes(alarmTypes: AlarmTypes): (db: DTDatabase) => () => Promise<void> {
    return (db) => () =>
        Promise
            .all(alarmTypes.map(at => insertAlarmType(db, at)))
            .then(() => undefined);
}

export function findAlarmTypes(db: DTDatabase): () => Promise<AlarmTypes> {
    return () =>
        db.manyOrNone(PS_GET_ALARM_TYPES)
            .then(alarmTypesParser);
}
