import {getSchedulesTimestamps, SchedulesResponse} from "../../lib/api/schedules";
import {TestHttpServer} from "../../../../common/test/httpserver";

describe('api-schedules', () => {

    test('getSchedulesTimestamps - in VTS control', async (done) => {
        const port = 8089;
        const server = new TestHttpServer();
        server.listen(port, {
            "/schedules": () => {
                return fakeSchedules;
            }
        });
        try {
            const resp = await getSchedulesTimestamps(`http://localhost:${port}/schedules`, false);
            verifyXmlResponse(resp);
        } finally {
            server.close();
            done();
        }
    });

    test('getSchedulesTimestamps - calculated', async (done) => {
        const port = 8090;
        const server = new TestHttpServer();
        server.listen(port, {
            "/schedules/calculated": () => {
                return fakeSchedules;
            }
        });
        try {
            const resp = await getSchedulesTimestamps(`http://localhost:${port}/schedules`, true);
            verifyXmlResponse(resp);
        } finally {
            server.close();
            done();
        }
    });

});

function verifyXmlResponse(resp: SchedulesResponse) {
    const s = resp.schedules.schedule;
    expect(s.length).toBe(1);
    expect(s[0].$.UUID).toBe(uuid);

    expect(s[0].timetable.length).toBe(1);
    const tt = s[0].timetable[0];

    expect(tt.eta!!.length).toBe(1);
    const eta = tt.eta!![0];
    expect(eta.$.time).toBe(etaEventTime);
    expect(eta.$.uts).toBe(etaTimestamp);

    expect(tt.destination.length).toBe(1);
    const dest = tt.destination[0];
    expect(dest.$.locode).toBe(locode);

    const v = s[0].vessel;
    expect(v.length).toBe(1);
    expect(v[0].$.vesselName).toBe(vesselName);
    expect(v[0].$.callsign).toBe(callsign);
    expect(v[0].$.mmsi).toBe(mmsi);
    expect(v[0].$.imo).toBe(imo);
}

const uuid = '123123123';
const vesselName = 'TEST';
const callsign = 'TEST_CALLSIGN';
const mmsi = '123456789';
const imo = '1234567';
const locode = 'ASDFG';
const etaEventTime = '2021-04-27T20:00:00Z';
const etaTimestamp = '2021-04-27T06:17:36Z';
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