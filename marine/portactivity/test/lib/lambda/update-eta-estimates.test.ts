import * as pgPromise from "pg-promise";
import {
    dbTestBase,
    findAll,
    insert,
    insertPortAreaDetails,
    insertPortCall,
    insertVessel
} from "../db-testutil";
import * as sinon from 'sinon';
import {SNS} from "aws-sdk";
import {handlerFn} from "../../../lib/lambda/update-eta-timestamps/lambda-update-eta-timestamps";
import moment from "moment";
import {newTimestamp, newPortAreaDetails, newPortCall, newVessel} from "../testdata";
import {EventType} from "../../../lib/model/timestamp";
import {ShipETA} from "../../../lib/api/api-etas";

// empty sec usage function for tests
const NOOP_WITH_SECRET = (secretId: string, fn: (secret: any) => Promise<void>) => fn({});

describe('update-eta-timestamps', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('no ships - no notify', async () => {
        const sns = new SNS();
        const publishStub = sandbox.stub().returns(Promise.resolve());
        sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
        const updateETATimestampsStub = sandbox.stub();

        await handlerFn(NOOP_WITH_SECRET, sns, updateETATimestampsStub)();

        expect(publishStub.called).toBe(false);
    });

    test('one ship - one notification', async () => {
        const sns = new SNS();
        const publishStub = sandbox.stub().returns(Promise.resolve());
        sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
        const locode = 'FIHKO';
        const eventTime = moment().add(1, 'hours').toDate();
        const timestamp = newTimestamp({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        const portcall = newPortCall(timestamp);
        const shipEta: ShipETA = {
            portcall_id: portcall.port_call_id,
            mmsi: timestamp.ship.mmsi!,
            imo: timestamp.ship.imo!,
            locode,
            eta: new Date().toISOString()
        };
        const updateETATimestampsStub = sandbox.stub().returns([shipEta]);
        await insert(db, [timestamp]);
        await insertVessel(db, newVessel(timestamp));
        await insertPortCall(db, portcall);
        await insertPortAreaDetails(db, newPortAreaDetails(timestamp));

        await handlerFn(NOOP_WITH_SECRET, sns, updateETATimestampsStub)();

        expect(publishStub.calledOnce).toBe(true);
        expect(updateETATimestampsStub.calledOnce).toBe(true);
    });

}));
