import moment from 'moment';
import * as pgPromise from "pg-promise";
import {dbTestBase, insert} from "../db-testutil";
import {newTimestamp} from "../testdata";
import {EventType} from "../../lib/model/timestamp";
import {findByLocodePublicShiplist} from "../../lib/db/shiplist-public";
import {EventSource} from "../../lib/model/eventsource";

describe('db-shiplist-public', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    test('findByLocodePublicShiplist - ETA not returned if ATA exists', async () => {
        const locode = 'AA123';
        const portcallId = 1;
        const timestamp1 = newTimestamp({
            eventType: EventType.ETA,
            locode,
            eventTime: new Date(),
            source: EventSource.PORTNET,
            portcallId
        });
        const timestamp2 = newTimestamp({
            eventType: EventType.ATA,
            locode,
            eventTime: moment().add(1, 'hours').toDate(),
            source: 'S1',
            portcallId
        });
        await insert(db, [timestamp1, timestamp2]);

        const foundTimestamps = await findByLocodePublicShiplist(db, locode);

        expect(foundTimestamps.length).toBe(1);
        expect(foundTimestamps[0].event_type).toBe(EventType.ATA);
    });

    test('findByLocodePublicShiplist - ETA without portcallId returned even if ATA exists', async () => {
        const locode = 'AA123';
        const portcallId = 1;
        const timestamp1 = newTimestamp({
            eventType: EventType.ETA,
            locode,
            eventTime: new Date(),
            source: 'Portnet',
        });
        const timestamp2 = newTimestamp({
            eventType: EventType.ATA,
            locode,
            eventTime: moment().add(1, 'hours').toDate(),
            source: 'S1',
            portcallId
        });
        await insert(db, [timestamp1, timestamp2]);

        const foundTimestamps = await findByLocodePublicShiplist(db, locode);

        expect(foundTimestamps.length).toBe(2);
        expect(foundTimestamps[0].event_type).toBe(EventType.ETA);
        expect(foundTimestamps[1].event_type).toBe(EventType.ATA);
    });

    test('findByLocodePublicShiplist - ETA and ETD', async () => {
        const locode = 'AA123';
        const portcallId = 1;
        const timestamp1 = newTimestamp({
            eventType: EventType.ETA,
            locode,
            eventTime: new Date(),
            source: 'Portnet',
            portcallId
        });
        const timestamp2 = newTimestamp({
            eventType: EventType.ETD,
            locode,
            eventTime: moment().add(1, 'hours').toDate(),
            source: 'S1',
            portcallId
        });
        await insert(db, [timestamp1, timestamp2]);

        const foundTimestamps = await findByLocodePublicShiplist(db, locode);

        expect(foundTimestamps.length).toBe(2);
        expect(foundTimestamps[0].event_type).toBe(EventType.ETA);
        expect(foundTimestamps[1].event_type).toBe(EventType.ETD);
    });

    test('findByLocodePublicShiplist - outgoing pilotages are included', async () => {
        const destLocode = 'AA123';
        const fromLocode = 'BB456';
        const portcallId = 1;
        const timestamp = newTimestamp({
            eventType: EventType.ETA,
            locode: destLocode,
            from: fromLocode,
            eventTime: new Date(),
            source: EventSource.PILOTWEB,
            portcallId
        });
        await insert(db, [timestamp]);

        const foundTimestamps = await findByLocodePublicShiplist(db, fromLocode);

        expect(foundTimestamps.length).toBe(1);
    });

}));
