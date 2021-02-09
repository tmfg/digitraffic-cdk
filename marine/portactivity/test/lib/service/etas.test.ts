import {dbTestBase, insert} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {newEstimate} from "../testdata";
import {
    findAllEstimates, saveEstimate, saveEstimates
} from "../../../lib/service/estimates";
import {ShipETA} from "../../../lib/api/api-etas";
import {etaToEstimate} from "../../../lib/service/etas";

describe('etas', () => {

    test('etaToEstimate', () => {
        const eta: ShipETA = {
            locode: 'AA123',
            imo: 123,
            mmsi: 456,
            eta: new Date().toISOString(),
            portcall_id: 1
        };
        const source = 'TestSource';

        const estimate = etaToEstimate(source)(eta);

        expect(estimate.location.port).toBe(eta.locode);
        expect(estimate.ship.imo).toBe(eta.imo);
        expect(estimate.ship.mmsi).toBe(eta.mmsi);
        expect(estimate.eventTime).toBe(eta.eta);
        expect(estimate.portcallId).toBe(eta.portcall_id);
        expect(estimate.source).toBe(source);
    });

});
