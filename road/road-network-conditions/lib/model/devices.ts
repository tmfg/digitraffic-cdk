import _ from "lodash";
import { RecursivePartial } from "../util/utils";

export type Coordinates = {
    readonly latitude: number;
    readonly longitude: number;
};

export type Device = {
    readonly coordinates: Coordinates;
    readonly deviceId: string;
    readonly deviceName: string;
    readonly deviceType: string;
};

export type Devices = ReadonlyArray<Device>;

type MaybeDevice = RecursivePartial<Device>;

export type MaybeDevices = {
    readonly devices?: ReadonlyArray<MaybeDevice>;
};

function deviceParser(x: unknown): Device {
    const maybeDevice = x as MaybeDevice;

    if ("coordinates" in maybeDevice && typeof maybeDevice.coordinates === "object") {
        const maybeCoordinates = maybeDevice.coordinates;
        if (
            "latitude" in maybeCoordinates &&
            typeof maybeCoordinates.latitude === "number" &&
            "longitude" in maybeCoordinates &&
            typeof maybeCoordinates.longitude === "number" &&
            "deviceId" in maybeDevice &&
            typeof maybeDevice.deviceId === "string" &&
            "deviceName" in maybeDevice &&
            typeof maybeDevice.deviceName === "string" &&
            "deviceType" in maybeDevice &&
            typeof maybeDevice.deviceType === "string"
        ) {
            const coordinates = _.pick(maybeCoordinates, ["latitude", "longitude"]) as Coordinates;

            return {
                coordinates,
                ..._.pick(maybeDevice, ["deviceId", "deviceName", "deviceType"])
            } as Device;
        }
    }

    throw new Error("unable to parse road condition device");
}

export function devicesParser(x: unknown): Devices {
    const maybeDevices = x as MaybeDevices;

    if ("devices" in maybeDevices && typeof maybeDevices.devices === "object") {
        return maybeDevices.devices.map(deviceParser);
    }

    throw Error("unable to parse road condition devices");
}
