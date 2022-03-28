import {Feature, FeatureCollection} from "geojson";

import {RoadConditionApi} from "../api/road-condition";
import {Device} from "../model/road-condition-devices";
import {Alarms} from "../model/road-condition-alarms";
import {AlarmTypes} from "../model/road-condition-alarm-types";


function makeFeatureCollection(xs: Array<Feature>): FeatureCollection {
    return {
        type: "FeatureCollection",
        features: xs,
    };
}

function makeDeviceToGeoJSON(device: Device): Feature {
    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [device.coordinates.latitude, device.coordinates.longitude],
        },
        properties: {
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            deviceType: device.deviceType,
        },
    };
}

export function getDevices(apiKey: string, url: string): Promise<FeatureCollection> {
    const api = new RoadConditionApi(apiKey, url);
    return api.getDevices()
        .then(x => x.devices
            .filter(xx => xx.deviceType !== "Digitraffic")
            .map(makeDeviceToGeoJSON))
        .then(makeFeatureCollection)
        .catch(e => {
            console.error("method=road-network-conditions-service.getDevices couldn't reach api", e);
            return Promise.reject(e);
        });
}

export function getAlarms(apiKey: string, url: string): Promise<Alarms> {
    const api = new RoadConditionApi(apiKey, url);
    return api.getAlarms()
        .catch(e => {
            console.error("method=road-network-conditions-service.getAlarms couldn't reach api", e);
            return Promise.reject(e);
        });
}

export function getAlarmTypes(apiKey: string, url: string): Promise<AlarmTypes> {
    const api = new RoadConditionApi(apiKey, url);
    return api.getAlarmTypes()
        .catch(e => {
            console.error("method=road-network-conditions-service.getAlarmTypes couldn't reach api", e);
            return Promise.reject(e);
        });
}
