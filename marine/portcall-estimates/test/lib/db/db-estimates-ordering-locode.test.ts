import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../db-testutil";
import {newEstimate} from "../testdata";
import {findByLocode} from "../../../lib/db/db-estimates";
import {shuffle} from "../../../../../common/js/js-utils";
import {EventType} from "../../../lib/model/estimate";

describe('db-estimates - ordering - locode', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const locode = 'AA123';

    test(`order by event type`, async () => {
        const estimateAtb = newEstimate({
            eventType: EventType.ATB,
            locode
        });
        const estimateEta = newEstimate({
            eventType: EventType.ETA,
            locode
        });
        const estimateEtd = newEstimate({
            eventType: EventType.ETD,
            locode
        });
        const estimates = shuffle([estimateAtb, estimateEta, estimateEtd]);
        await insert(db, estimates);

        const foundEstimates = await findByLocode(db, locode);
        expect(foundEstimates[0].event_type).toBe(EventType.ATB);
        expect(foundEstimates[1].event_type).toBe(EventType.ETA);
        expect(foundEstimates[2].event_type).toBe(EventType.ETD);
    });

    test(`order by ship`, async () => {
        const estimateShip1 = newEstimate({
            mmsi: 83432,
            locode,
            eventType: EventType.ATB
        });
        const estimateShip2 = newEstimate({
            mmsi: 43453,
            eventType: EventType.ATB,
            locode
        });
        const estimateShip3 = newEstimate({
            mmsi: 93532,
            eventType: EventType.ATB,
            locode
        });
        const estimates = shuffle([estimateShip1, estimateShip2, estimateShip3]);
        await insert(db, estimates);

        const foundEstimates = await findByLocode(db, locode);
        expect(foundEstimates[0].ship_id).toBe(estimateShip2.ship.mmsi);
        expect(foundEstimates[1].ship_id).toBe(estimateShip1.ship.mmsi);
        expect(foundEstimates[2].ship_id).toBe(estimateShip3.ship.mmsi);
    });

}));
