import ky from "ky";
import type { SchedulesResponse } from "../../api/schedules.js";
import { SchedulesApi, SchedulesDirection } from "../../api/schedules.js";
import { assertDefined } from "../test-utils.js";
import { jest } from "@jest/globals";
import { mockKyResponse } from "@digitraffic/common/dist/test/mock-ky";

const uuid = "123123123";
const vesselName = "TEST";
const callsign = "TEST_CALLSIGN";
const mmsi = "123456789";
const imo = "1234567";
const locode = "ASDFG";
const etaEventTime = "2021-04-27T20:00:00Z";
const etaTimestamp = "2021-04-27T06:17:36Z";
const fakeSchedules = `
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<schedules>
    <schedule UUID="${uuid}">
        <vessel vesselName="${vesselName}" callsign="${callsign}" mmsi="${mmsi}" imo="${imo}"/>
        <timetable>
            <destination locode="${locode}"/>
            <eta time="${etaEventTime}" uts="${etaTimestamp}"/>
        </timetable>
    </schedule>
</schedules>
`.trim();

describe("api-schedules", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("getSchedulesTimestamps - in VTS control", async () => {
        const api = new SchedulesApi(`http:/something/schedules`);
        jest.spyOn(ky, "get").mockImplementation(() => mockKyResponse(200, fakeSchedules));
        const resp = await api.getSchedulesTimestamps(SchedulesDirection.EAST, false);
        verifyXmlResponse(resp);
    });
});

function verifyXmlResponse(resp: SchedulesResponse): void {
    const s = resp.schedules.schedule[0];
    assertDefined(s);
    expect(s.$.UUID).toBe(uuid);

    expect(s.timetable.length).toBe(1);
    const tt = s.timetable[0];
    assertDefined(tt);

    expect(tt.eta?.length).toBe(1);

    if (tt.eta === undefined) {
        fail("missing eta!");
    }

    const eta = tt.eta[0];
    assertDefined(eta);
    expect(eta.$.time).toBe(etaEventTime);
    expect(eta.$.uts).toBe(etaTimestamp);

    expect(tt.destination?.length).toBe(1);
    const dest = tt.destination?.[0];
    expect(dest?.$.locode).toBe(locode);

    const v = s.vessel[0];
    assertDefined(v);
    expect(v.$.vesselName).toBe(vesselName);
    expect(v.$.callsign).toBe(callsign);
    expect(v.$.mmsi).toBe(mmsi);
    expect(v.$.imo).toBe(imo);
}
