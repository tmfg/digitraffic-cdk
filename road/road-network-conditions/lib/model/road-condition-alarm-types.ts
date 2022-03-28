
type AlarmType = {
    alarmId: number;
    alarmText: string;
}

type MaybeAlarmType = {
    alarmId?: number;
    alarmText?: string;
}

type MaybeAlarmTypes = {
    alarmTypes?: Array<MaybeAlarmType>;
}

export type AlarmTypes = ReadonlyArray<AlarmType>;

function alarmTypeParser(x: unknown): AlarmType {
    const maybeAlarmType = x as MaybeAlarmType;

    if (('alarmId' in maybeAlarmType && typeof maybeAlarmType.alarmId === 'number') &&
        ('alarmText' in maybeAlarmType && typeof maybeAlarmType.alarmText === 'string')) {
        return maybeAlarmType as AlarmType;
    }

    throw new Error("unable to parse alarm type");
}

export function alarmTypesParser(x: unknown): AlarmTypes {
    const maybeAlarmTypes = x as MaybeAlarmTypes;

    if ("alarmTypes" in maybeAlarmTypes && maybeAlarmTypes.alarmTypes instanceof Array) {
        return maybeAlarmTypes.alarmTypes.map(alarmTypeParser);
    }

    throw new Error("unable to parse alarm types");
}
