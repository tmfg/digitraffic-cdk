import {Feature, FeatureCollection} from "geojson";
import * as R from "ramda";

import {RoadConditionApi} from "../api/road-condition";
import {Coordinates, Device, Devices} from "../model/devices";
import {Alarm, Alarms} from "../model/alarms";
import {AlarmType, AlarmTypes} from "../model/alarm-types";


function makeFeatureCollection(xs: Array<Feature>): FeatureCollection {
    return {
        type: "FeatureCollection",
        features: xs,
    };
}

function makeGeoJson(props: Record<string, string>, coordinates: Coordinates): Feature {
    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude],
        },
        properties: props,
    };
}

function makeDeviceToGeoJSON(device: Device): Feature {
    const props = R.pick(["deviceId", "deviceName", "deviceType"], device);
    return makeGeoJson(props, device.coordinates);
}

function sortAlarmsByCreated(alarms: Array<Alarm>): Array<Alarm> {
    const clonedAlarms = R.clone(alarms);
    clonedAlarms.sort((a, b) => a.created < b.created ? 0 : 1);
    return clonedAlarms;
}

export function getDevices(apiKey: string, url: string): Promise<Devices> {
    const api = new RoadConditionApi(apiKey, url);
    return api.getDevices()
        .then(xs => xs.filter(x => x.deviceType !== "Digitraffic"))
        .catch(e => {
            console.error("method=road-network-conditions-service.getDevices couldn't reach api", e);
            return Promise.reject(e);
        });
}

export function getDevicesGeojson(apiKey: string, url: string): Promise<FeatureCollection> {
    return getDevices(apiKey, url)
        .then(devices => devices.map(makeDeviceToGeoJSON))
        .then(makeFeatureCollection);
}

export async function getAlarms(apiKey: string, url: string): Promise<Alarms> {
    function _getAlarms(): Promise<Alarms> {
        const api = new RoadConditionApi(apiKey, url);
        return api.getAlarms().catch(e => {
            console.error("method=road-network-conditions-service.getAlarms couldn't reach api", e);
            return Promise.reject(e);
        });
    }

    const [devices, alarms] = await Promise.all([
        getDevices(apiKey, url),
        _getAlarms(),
    ]);

    const deviceIds = devices.map(device => device.deviceId);

    const nonDigitrafficAlarms = alarms.filter(alarm => deviceIds.includes(alarm.station));
    const groupedByStationId = R.values(R.groupBy(R.prop("station"), nonDigitrafficAlarms));
    return groupedByStationId
        .map(sortAlarmsByCreated)
        .flatMap(([alarm]) => alarm);
}


export function getAlarmTypes(apiKey: string, url: string): Promise<AlarmTypes> {
    const api = new RoadConditionApi(apiKey, url);
    return api.getAlarmTypes()
        .catch(e => {
            console.error("method=road-network-conditions-service.getAlarmTypes couldn't reach api", e);
            return Promise.reject(e);
        });
}

const combineAlarmsAndTypes = (alarmTypes: AlarmTypes) => (alarm: Alarm): Alarm & AlarmType => {
    return {
        ...alarm,
        ...alarmTypes.filter(x => x.alarmId === alarm.alarm)[0],
    };
};

const withDevices = (devices: Devices) => (alarm: Alarm & AlarmType): Feature | null => {
    const device = devices.filter(d => d.deviceId === alarm.station)[0];

    // If corresponding device is missing, return null.
    // i.e. digitraffic devices have been removed from the device listing and not from alarms.
    if (device === undefined || device === null) {
        return null;
    }

    const deviceProps = R.pick(["deviceId", "deviceName", "deviceType"], device);
    const alarmProps = R.pick(["alarmId", "alarmText", "created"], alarm);
    const props = {...deviceProps, ...alarmProps};

    return makeGeoJson(props, device.coordinates);
};

export async function getAlarmsGeojson(apiKey: string, url: string): Promise<FeatureCollection> {
    const [devices, alarms, alarmTypes] =
        await Promise.all([
            getDevices(apiKey, url),
            getAlarms(apiKey, url),
            getAlarmTypes(apiKey, url),
        ]);

    const alarmsAndAlarmTypes: ReadonlyArray<Alarm & AlarmType> = alarms.map(combineAlarmsAndTypes(alarmTypes));

    const features = alarmsAndAlarmTypes
        .map(withDevices(devices))
        .filter(<T>(x: T | null | undefined): x is T => x !== null && x !== undefined);

    return {
        type: "FeatureCollection",
        features,
    };
}
