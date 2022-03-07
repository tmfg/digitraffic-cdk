import {MarwisData, convertMarwis} from '../../lib/sensors/marwis';
import {TeconerData, convertTeconer} from '../../lib/sensors/teconer';
import {SensorDataPoint} from '../../lib/sensors/sensor';

describe("road network condition tests", () => {
    test("Marwis should have a function to normalize data", () => {
describe("Road network condition", () => {
    it("should convert data from marwis sensor to normalized form", () => {
        const marwisData: MarwisData = {
            Friction: [{ ts: 1646744459709, value: "0.46989601850509644" }, { ts: 1646744458690, value: "0.4712735116481781" }],
            // eslint-disable-next-line camelcase
            Road_Condition: [{ ts: 1646744459709, value: "4" }, { ts: 1646744458690, value: "4" }],
            lat: [{ ts: 1646744459709, value: "62.117875" }, { ts: 1646744458690, value: "62.117873" }],
            lon: [{ ts: 1646744459709, value: "25.754419" }, { ts: 1646744458690, value: "25.754418" }],
        };

        const device = "someName";

        const expected: SensorDataPoint[] = [
            { device, friction: 0.46989601850509644, latitude: 62.117875, longitude: 25.754419, code: 4, state: "", timestamp: 1646744459709 },
            { device, friction: 0.4712735116481781, latitude: 62.117873, longitude: 25.754418, code: 4, state: "", timestamp: 1646744458690 },
        ];

        expect(convertMarwis(device)(marwisData)).toStrictEqual(expected);
    });

    it("should convert data from teconer sensor to normalized form", () => {
        const teconerData: TeconerData = {
            Friction: [{ ts: 1646744459709, value: "0.46989601850509644" }, { ts: 1646744458690, value: "0.4712735116481781" }],
            State: [{ ts: 1646744459709, value: "4" }, { ts: 1646744458690, value: "4" }],
            Latitude: [{ ts: 1646744459709, value: "62.117875" }, { ts: 1646744458690, value: "62.117873" }],
            Longitude: [{ ts: 1646744459709, value: "25.754419" }, { ts: 1646744458690, value: "25.754418" }],
        };

        const device = "someName";

        const expected: SensorDataPoint[] = [
            { device, friction: 0.46989601850509644, latitude: 62.117875, longitude: 25.754419, code: 4, state: "", timestamp: 1646744459709 },
            { device, friction: 0.4712735116481781, latitude: 62.117873, longitude: 25.754418, code: 4, state: "", timestamp: 1646744458690 },
        ];

        expect(convertTeconer(device)(teconerData)).toStrictEqual(expected);
    });
});
