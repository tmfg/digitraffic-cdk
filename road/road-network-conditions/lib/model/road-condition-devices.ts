
export type Device = {
    readonly coordinates: {
        latitude: number,
        longitude: number
    };
    readonly deviceId: string;
    readonly deviceName: string;
    readonly deviceType: string;
}

export type Devices = {
    readonly devices: ReadonlyArray<Device>;
}

type MaybeDevice = {
    readonly coordinates?: {
        latitude?: number,
        longitude?: number
    };
    readonly deviceId?: string;
    readonly deviceName?: string;
    readonly deviceType?: string;
}

export type MaybeDevices = {
    readonly devices?: ReadonlyArray<MaybeDevice>;
}

function deviceParser(x: unknown): Device {
    const maybeDevice = x as MaybeDevice;

    if ("coordinates" in maybeDevice && typeof maybeDevice.coordinates === "object") {
        const unknownCoordinates = maybeDevice.coordinates;
        if (("latitude" in unknownCoordinates && typeof unknownCoordinates.latitude === "number") &&
            ("longitude" in unknownCoordinates && typeof unknownCoordinates.longitude === "number")) {
            const coordinates = {
                longitude: unknownCoordinates.longitude,
                latitude: unknownCoordinates.latitude,
            };
            if (("deviceId" in maybeDevice && typeof maybeDevice.deviceId === "string") &&
                ("deviceName" in maybeDevice && typeof maybeDevice.deviceName === "string") &&
                ("deviceType" in maybeDevice && typeof maybeDevice.deviceType === "string")) {
                return {
                    coordinates,
                    deviceId: maybeDevice.deviceId,
                    deviceName: maybeDevice.deviceName,
                    deviceType: maybeDevice.deviceType,
                };
            }
        }
    }

    throw new Error("unable to parse road condition device");
}

export function devicesParser(x: unknown): Devices {
    const maybeDevices = x as MaybeDevices;

    if ("devices" in maybeDevices && typeof maybeDevices.devices === "object") {
        return {
            devices: maybeDevices.devices.map(deviceParser),
        };
    }

    throw Error("unable to parse road condition devices");
}
