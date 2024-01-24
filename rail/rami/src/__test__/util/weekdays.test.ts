import type { WeekDay } from "../../model/dt-rami-message.js";
import { mapBitsToDays, mapDaysToBits } from "../../util/weekdays.js";

const weekDays = ["MONDAY", "THURSDAY", "SATURDAY"] as WeekDay[];
const weekDaysAsBits = "1001010";

describe("weekday bitstring mapping", () => {
    test("mapDaysToBits and mapBitsToDays", () => {
        const bitString = mapDaysToBits(weekDays);
        expect(bitString).toEqual(weekDaysAsBits);
        const backToWeekDays = mapBitsToDays(bitString);
        expect(backToWeekDays).toEqual(weekDays);
    });
});
