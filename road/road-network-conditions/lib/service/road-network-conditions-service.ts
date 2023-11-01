import { Feature, FeatureCollection } from "geojson";
import _ from "lodash";

import { RoadConditionApi } from "../api/road-condition";
import { Coordinates, Device, Devices } from "../model/devices";
import { Alarm, Alarms } from "../model/alarms";
import { AlarmType, AlarmTypes } from "../model/alarm-types";

function makeFeatureCollection(features: Array<Feature>): FeatureCollection {
    return {
        type: "FeatureCollection",
        features
    };
}

function makeGeoJson(properties: Record<string, string>, coordinates: Coordinates): Feature {
    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude]
        },
        properties
    };
}

function makeDeviceToGeoJSON(device: Device): Feature {
    const props = _.pick(device, ["deviceId", "deviceName", "deviceType"]);
    return makeGeoJson(props, device.coordinates);
}

function sortAlarmsByCreated(alarms: Array<Alarm>): Array<Alarm> {
    const clonedAlarms = _.clone(alarms);
    clonedAlarms.sort((a, b) => (a.created < b.created ? 0 : 1));
    return clonedAlarms;
}

export function getDevices(apiKey: string, url: string): Promise<Devices> {
    const api = new RoadConditionApi(apiKey, url);
    return api
        .getDevices()
        .then((xs) => xs.filter((x) => x.deviceType !== "Digitraffic"))
        .catch((e) => {
            console.error("method=road-network-conditions-service.getDevices couldn't reach api", e);
            return Promise.reject(e);
        });
}

export function getDevicesGeojson(apiKey: string, url: string): Promise<FeatureCollection> {
    return getDevices(apiKey, url)
        .then((devices) => devices.map(makeDeviceToGeoJSON))
        .then(makeFeatureCollection);
}

export async function getAlarms(apiKey: string, url: string): Promise<Alarms> {
    function _getAlarms(): Promise<Alarms> {
        const api = new RoadConditionApi(apiKey, url);
        return api.getAlarms().catch((e) => {
            console.error("method=road-network-conditions-service.getAlarms couldn't reach api", e);
            return Promise.reject(e);
        });
    }

    const [devices, alarms] = await Promise.all([getDevices(apiKey, url), _getAlarms()]);

    const deviceIds = devices.map((device) => device.deviceId);

    const nonDigitrafficAlarms = alarms.filter((alarm) => deviceIds.includes(alarm.station));
    const groupedByStationId = _.values(_.groupBy(nonDigitrafficAlarms, "station"));
    return groupedByStationId.map(sortAlarmsByCreated).flatMap(([alarm]) => alarm);
}

export function getAlarmTypes(apiKey: string, url: string): Promise<AlarmTypes> {
    const api = new RoadConditionApi(apiKey, url);
    return api.getAlarmTypes().catch((e) => {
        console.error("method=road-network-conditions-service.getAlarmTypes couldn't reach api", e);
        return Promise.reject(e);
    });
}

const combineAlarmsAndTypes =
    (alarmTypes: AlarmTypes) =>
    (alarm: Alarm): Alarm & AlarmType => {
        return {
            ...alarm,
            ...alarmTypes.filter((x) => x.alarmId === alarm.alarm)[0]
        };
    };

const withDevices =
    (devices: Devices) =>
    (alarm: Alarm & AlarmType): Feature | null => {
        const device = devices.filter((d) => d.deviceId === alarm.station)[0];

        // If corresponding device is missing, return null.
        // i.e. digitraffic devices have been removed from the device listing and not from alarms.
        if (device === undefined || device === null) {
            return null;
        }

        const deviceProps = _.pick(device, ["deviceId", "deviceName", "deviceType"]);
        const alarmProps = _.pick(alarm, ["alarmId", "alarmText", "created"]);
        const props = { ...deviceProps, ...alarmProps };

        return makeGeoJson(props, device.coordinates);
    };

export async function getAlarmsGeojson(apiKey: string, url: string): Promise<FeatureCollection> {
    const [devices, alarms, alarmTypes] = await Promise.all([
        getDevices(apiKey, url),
        getAlarms(apiKey, url),
        getAlarmTypes(apiKey, url)
    ]);

    const alarmsAndAlarmTypes: ReadonlyArray<Alarm & AlarmType> = alarms.map(
        combineAlarmsAndTypes(alarmTypes)
    );

    const features = alarmsAndAlarmTypes
        .map(withDevices(devices))
        .filter(<T>(x: T | null | undefined): x is T => x !== null && x !== undefined);

    return {
        type: "FeatureCollection",
        features
    };
}
