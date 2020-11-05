import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../../db-testutil";
import {newEstimate} from "../../testdata";
import {EventType} from "../../../../lib/estimates/model/estimate";
import {findByLocodePublicShiplist} from "../../../../lib/estimates/db/db-shiplist-public";

describe('db-shiplist-public', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findByLocodePublicShiplist - ETA not returned if ATA exists', async () => {
        const locode = 'AA123';
        const portcallId = 1;
        const estimate1 = newEstimate({
            eventType: EventType.ETA,
            locode,
            eventTime: new Date(),
            source: 'Portnet',
            portcallId
        });
        const estimate2 = newEstimate({
            eventType: EventType.ATA,
            locode,
            eventTime: moment().add(1, 'hours').toDate(),
            source: 'S1',
            portcallId
        });
        await insert(db, [estimate1, estimate2]);

        const foundEstimates = await findByLocodePublicShiplist(db, locode);

        expect(foundEstimates.length).toBe(1);
        expect(foundEstimates[0].event_type).toBe(EventType.ATA);
    });

    test('findByLocodePublicShiplist - ETA without portcallId returned even if ATA exists', async () => {
        const locode = 'AA123';
        const portcallId = 1;
        const estimate1 = newEstimate({
            eventType: EventType.ETA,
            locode,
            eventTime: new Date(),
            source: 'Portnet',
        });
        const estimate2 = newEstimate({
            eventType: EventType.ATA,
            locode,
            eventTime: moment().add(1, 'hours').toDate(),
            source: 'S1',
            portcallId
        });
        await insert(db, [estimate1, estimate2]);

        const foundEstimates = await findByLocodePublicShiplist(db, locode);

        expect(foundEstimates.length).toBe(2);
        expect(foundEstimates[0].event_type).toBe(EventType.ETA);
        expect(foundEstimates[1].event_type).toBe(EventType.ATA);
    });

    test('findByLocodePublicShiplist - ETA and ETD', async () => {
        const locode = 'AA123';
        const portcallId = 1;
        const estimate1 = newEstimate({
            eventType: EventType.ETA,
            locode,
            eventTime: new Date(),
            source: 'Portnet',
            portcallId
        });
        const estimate2 = newEstimate({
            eventType: EventType.ETD,
            locode,
            eventTime: moment().add(1, 'hours').toDate(),
            source: 'S1',
            portcallId
        });
        await insert(db, [estimate1, estimate2]);

        const foundEstimates = await findByLocodePublicShiplist(db, locode);

        expect(foundEstimates.length).toBe(2);
        expect(foundEstimates[0].event_type).toBe(EventType.ETA);
        expect(foundEstimates[1].event_type).toBe(EventType.ETD);
    });

}));
