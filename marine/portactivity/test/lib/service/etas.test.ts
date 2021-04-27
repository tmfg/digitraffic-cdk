import {ShipETA} from "../../../lib/api/etas";
import {etaToTimestamp} from "../../../lib/service/etas";

describe('etas', () => {

    test('etaToTimestamp', () => {
        const eta: ShipETA = {
            locode: 'AA123',
            imo: 123,
            mmsi: 456,
            eta: new Date().toISOString(),
            portcall_id: 1
        };
        const source = 'TestSource';

        const timestamp = etaToTimestamp(source)(eta);

        expect(timestamp.location.port).toBe(eta.locode);
        expect(timestamp.ship.imo).toBe(eta.imo);
        expect(timestamp.ship.mmsi).toBe(eta.mmsi);
        expect(timestamp.eventTime).toBe(eta.eta);
        expect(timestamp.portcallId).toBe(eta.portcall_id);
        expect(timestamp.source).toBe(source);
    });

});
