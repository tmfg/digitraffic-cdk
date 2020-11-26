import * as pgPromise from "pg-promise";
import {
    dbTestBase,
    findAll,
    insert,
    insertPortAreaDetails,
    insertPortCall,
    insertVessel,
    insertVesselLocation
} from "../../db-testutil";
import * as sinon from 'sinon';
import {SNS} from "aws-sdk";
import {handlerFn} from "../../../../lib/estimates/lambda/update-eta-estimates/lambda-update-eta-estimates";
import moment from "moment";
import {newEstimate, newPortAreaDetails, newPortCall, newVessel, newVesselLocation} from "../../testdata";
import {EventType} from "../../../../lib/estimates/model/estimate";
import {ShipETA} from "../../../../lib/estimates/api/api-etas";

describe('update-eta-estimates', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    test('no ships - no notify', async () => {
        const sns = new SNS();
        const publishStub = sandbox.stub().returns(Promise.resolve());
        sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
        const updateETAEstimatesStub = sandbox.stub();

        await handlerFn(sns, updateETAEstimatesStub)();

        expect(publishStub.called).toBe(false);
    });

    test('one ship - one notification', async () => {
        const sns = new SNS();
        const publishStub = sandbox.stub().returns(Promise.resolve());
        sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
        const locode = 'FIHKO';
        const eventTime = moment().add(1, 'hours').toDate();
        const estimate = newEstimate({eventType: EventType.ETA, locode, eventTime, source: 'Portnet'});
        const portcall = newPortCall(estimate);
        const shipEta: ShipETA = {
            portcall_id: portcall.port_call_id,
            mmsi: estimate.ship.mmsi!,
            imo: estimate.ship.imo!,
            locode,
            eta: new Date().toISOString()
        };
        const updateETAEstimatesStub = sandbox.stub().returns([shipEta]);
        await insert(db, [estimate]);
        await insertVessel(db, newVessel(estimate));
        await insertVesselLocation(db, newVesselLocation(estimate, 0));
        await insertPortCall(db, portcall);
        await insertPortAreaDetails(db, newPortAreaDetails(estimate));

        await handlerFn(sns, updateETAEstimatesStub)();

        expect(publishStub.calledOnce).toBe(true);
        expect(updateETAEstimatesStub.calledOnce).toBe(true);
    });

}));
