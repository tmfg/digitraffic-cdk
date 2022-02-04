import {needToBrighten} from "../../lib/service/areatraffic";
import {DbAreaTraffic} from "../../lib/db/areatraffic";

// test file
/* eslint-disable camelcase */

describe('areatraffic service', () => {
    test('needToBrighten - never sent', () => {
        const area = createArea(1, 10);

        expect(needToBrighten(area)).toBe(true);
    });

    test('needToBrighten - ends in 1 hour', () => {
        const sent = new Date();
        const end = new Date();
        end.setHours(end.getHours() + 1);
        const area = createArea(1, 10, sent, end);

        expect(needToBrighten(area)).toBe(false);
    });

    test('needToBrighten - ended hour ago', () => {
        const sent = new Date();
        const end = new Date();
        end.setHours(end.getHours() - 1);
        const area = createArea(1, 10, sent, end);

        expect(needToBrighten(area)).toBe(true);
    });

    test('needToBrighten - ends in 30 seconds', () => {
        const sent = new Date();
        const end = new Date();
        end.setSeconds(end.getSeconds() + 30);
        const area = createArea(1, 10, sent, end);

        expect(needToBrighten(area)).toBe(true);
    });

    function createArea(id: number, brighten_duration_min: number, brighten_sent?: Date, brighten_end?: Date): DbAreaTraffic {
        return {
            id,
            name: id.toString(),
            brighten_duration_min,
            brighten_sent,
            brighten_end,
        };
    }
});