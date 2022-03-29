
export type AlarmType = {
    readonly alarmId: string;
    readonly alarmText: string;
}

type MaybeAlarmType = {
    readonly alarmId?: number;
    readonly alarmText?: string;
}

type MaybeAlarmTypes = {
    readonly alarmTypes?: Array<MaybeAlarmType>;
}

export type AlarmTypes = ReadonlyArray<AlarmType>;

function alarmTypeParser(x: unknown): AlarmType {
    const maybeAlarmType = x as MaybeAlarmType;

    if (('alarmId' in maybeAlarmType && typeof maybeAlarmType.alarmId === 'number') &&
        ('alarmText' in maybeAlarmType && typeof maybeAlarmType.alarmText === 'string')) {
        return {
            alarmId: String(maybeAlarmType.alarmId),
            alarmText: maybeAlarmType.alarmText,
        };
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
