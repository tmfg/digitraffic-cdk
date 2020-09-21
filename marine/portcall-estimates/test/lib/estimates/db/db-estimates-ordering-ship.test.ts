import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../../db-testutil";
import {newEstimate} from "../../testdata";
import {findByMmsi} from "../../../../lib/estimates/db/db-estimates";
import {shuffle} from "../../../../../../common/js/js-utils";
import {EventType} from "../../../../lib/estimates/model/estimate";

describe('db-estimates - ordering - ship id', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const mmsi = 12345;

    test(`mmsi - order by locode`, async () => {
        const estimate1 = newEstimate({
            mmsi,
            locode: 'ZZ123'
        });
        const estimate2 = newEstimate({
            mmsi,
            locode: 'CC123'
        });
        const estimate3 = newEstimate({
            mmsi,
            locode: 'GG123'
        });
        const estimates = shuffle([estimate1, estimate2, estimate3]);
        await insert(db, estimates);

        const foundEstimates = await findByMmsi(db, mmsi);
        expect(foundEstimates[0].location_locode).toBe(estimate2.location.port);
        expect(foundEstimates[1].location_locode).toBe(estimate3.location.port);
        expect(foundEstimates[2].location_locode).toBe(estimate1.location.port);
    });

    test(`mmsi - order by event type`, async () => {
        const locode = 'AA123';
        const estimateAtb = newEstimate({
            mmsi,
            eventType: EventType.ATB,
            locode
        });
        const estimateEta = newEstimate({
            mmsi,
            eventType: EventType.ETA,
            locode
        });
        const estimateEtd = newEstimate({
            mmsi,
            eventType: EventType.ETD,
            locode
        });
        const estimates = shuffle([estimateAtb, estimateEta, estimateEtd]);
        await insert(db, estimates);

        const foundEstimates = await findByMmsi(db, mmsi);
        expect(foundEstimates[0].event_type).toBe(EventType.ATB);
        expect(foundEstimates[1].event_type).toBe(EventType.ETA);
        expect(foundEstimates[2].event_type).toBe(EventType.ETD);
    });

}));
