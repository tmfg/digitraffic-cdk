import axios from "axios";

import * as rcs from "../../lib/service/road-network-conditions-service";
import {FeatureCollection} from "geojson";

jest.mock('axios');

describe("Road network condition service", () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should fetch devices from the api", () => {
        const data = {
            devices: [
                {
                    deviceId: "4025",
                    deviceName: "LTI - Tie 12 Lahti, Kärpäsenmäki - ID4025",
                    deviceType: "Digitraffic",
                    coordinates: {latitude: 60.980391, longitude: 25.601004},
                },
                {
                    deviceId: "18005",
                    deviceName: "LTI - Kivistönmäki - ID18005",
                    deviceType: "Digitraffic",
                    coordinates: {latitude: 61.000532, longitude: 25.675391},
                },
                {
                    deviceId: "1000108",
                    deviceName: "IRS - Vesijärvenkatu 9",
                    deviceType: "IRS",
                    coordinates: {latitude: 60.982431, longitude: 25.661484},
                },
            ],
        };

        const expected: FeatureCollection = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [60.982431, 25.661484],
                    },
                    properties: {
                        deviceId: "1000108",
                        deviceName: "IRS - Vesijärvenkatu 9",
                        deviceType: "IRS",
                    },
                },
            ],
        };

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data});

        return rcs.getDevicesFeatureCollection("", "")
            .then(d => expect(d).toEqual(expected))
            .then(() => expect(axios.get).toHaveBeenCalledWith(`/keli/laitetiedot?authKey=`));
    });

    it("should combine alarm, alarm types and device information", () => {
        const devices = {
            devices: [
                {
                    deviceId: "1000108",
                    deviceName: "IRS - Vesijärvenkatu 9",
                    deviceType: "IRS",
                    coordinates: {latitude: 60.982431, longitude: 25.661484},
                },
            ],
        };
        const alarmTypes = {
            alarmTypes: [
                {alarmId: 1, alarmText: "Tienpinta pakkaselle"},
                {alarmId: 2, alarmText: "Lumi alkaa kertyä tienpinnalle"},
                {alarmId: 3, alarmText: "Kitkahälytys"},
            ],
        };
        const alarms = [
            {
                created: "2022-01-17 10:36:00",
                station: "1000108",
                alarm: "1",
            },
            {
                created: "2022-01-17 10:15:58",
                station: "1000108",
                alarm: "3",
            },
        ];

        (axios.get as unknown as jest.Mock).mockImplementation((req) => {
            const data =
                req.includes("laitetiedot") ?
                    devices :
                    req.includes("halytykset") ?
                        alarms :
                        alarmTypes;

            return Promise.resolve({
                status: 200,
                data,
            });
        });

        const expected: FeatureCollection = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [60.982431, 25.661484],
                    },
                    properties: {
                        created: "2022-01-17 10:36:00",
                        alarmId: "1",
                        alarmText: "Tienpinta pakkaselle",
                        deviceId: "1000108",
                        deviceName: "IRS - Vesijärvenkatu 9",
                        deviceType: "IRS",
                    },
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [60.982431, 25.661484],
                    },
                    properties: {
                        created: "2022-01-17 10:15:58",
                        alarmId: "3",
                        alarmText: "Kitkahälytys",
                        deviceId: "1000108",
                        deviceName: "IRS - Vesijärvenkatu 9",
                        deviceType: "IRS",
                    },
                },
            ],
        };

        expect(rcs.getFeatureCollection("", "")).resolves.toEqual(expected);
    });

    it("should work with alarms without devices", () => {
        const devices = {
            devices: [
                {
                    deviceId: "1337",
                    deviceName: "IRS - Vesijärvenkatu 9",
                    deviceType: "IRS",
                    coordinates: {latitude: 60.982431, longitude: 25.661484},
                },
            ],
        };
        const alarmTypes = {
            alarmTypes: [
                {alarmId: 1, alarmText: "Tienpinta pakkaselle"},
                {alarmId: 2, alarmText: "Lumi alkaa kertyä tienpinnalle"},
                {alarmId: 3, alarmText: "Kitkahälytys"},
            ],
        };
        const alarms = [
            {
                created: "2022-01-17 10:36:00",
                station: "1000108",
                alarm: "1",
            },
            {
                created: "2022-01-17 10:15:58",
                station: "1000108",
                alarm: "3",
            },
        ];

        (axios.get as unknown as jest.Mock).mockImplementation((req) => {
            const data =
                req.includes("laitetiedot") ?
                    devices :
                    req.includes("halytykset") ?
                        alarms :
                        alarmTypes;

            return Promise.resolve({
                status: 200,
                data,
            });
        });

        const expected: FeatureCollection = {
            type: "FeatureCollection",
            features: [],
        };

        expect(rcs.getFeatureCollection("", "")).resolves.toEqual(expected);
    });

    it ("should return error if api sends malformed data", () => {
        const data = {
            devices: [
                {
                    fooId: "1000108",
                    fooName: "IRS - Vesijärvenkatu 9",
                    fooType: "IRS",
                    coordinates: {latitude: 60.982431, longitude: 25.661484},
                },
            ],
        };

        const expected = new Error("unable to parse road condition device");

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data});

        return expect(rcs.getDevicesFeatureCollection("", "")).rejects.toEqual(expected);
    });

    it("should fetch alarms", () => {
        const data = [
            {
                created: "2022-01-17 10:36:00",
                station: "1000117",
                alarm: "10",
            },
            {
                created: "2022-01-17 10:15:58",
                station: "1068",
                alarm: "4",
            },
            {
                created: "2022-01-17 03:19:28",
                station: "1000120",
                alarm: "5",
            },
        ];

        const expected = data;

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data});

        return rcs.getAlarms("", "")
            .then(d => expect(d).toEqual(expected))
            .then(() => expect(axios.get).toHaveBeenCalledWith(`/keli/halytykset?authKey=`));
    });

    it("should fail with malformed alarms", () => {
        const data = [
            {
                created: "2022-01-17 03:19:28",
                station: "1000120",
                alarm: "not-a-number",
            },
        ];

        const expected = new Error("unable to parse alarm type");

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data});

        return expect(rcs.getAlarms("", "")).rejects.toEqual(expected);
    });

    it("should fetch alarm type description", () => {
        const data = {
            alarmTypes: [
                {alarmId: 1, alarmText: "Tienpinta pakkaselle"},
                {alarmId: 2, alarmText: "Lumi alkaa kertyä tienpinnalle"},
                {alarmId: 3, alarmText: "Kitkahälytys"},
            ],
        };

        const expected = data.alarmTypes.map(x => ({...x, alarmId: String(x.alarmId)}));

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data});

        return rcs.getAlarmTypes("", "")
            .then(d => expect(d).toEqual(expected))
            .then(() => expect(axios.get).toHaveBeenCalledWith(`/keli/halytystyypit?authKey=`));
    });

    it("should fail with malformed alarm types", () => {
        const data = {
            alarmTypes: [
                {
                    unknown: "2022-01-17 03:19:28",
                    alarm: "not-a-number",
                },
            ],
        };

        const expected = new Error("unable to parse alarm type");

        (axios.get as unknown as jest.Mock).mockResolvedValueOnce({ status: 200, data});

        return expect(rcs.getAlarmTypes("", "")).rejects.toEqual(expected);
    });
});
