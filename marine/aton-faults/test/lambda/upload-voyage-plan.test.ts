import {dbTestBase, insert} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {handlerFn, UploadVoyagePlanEvent} from '../../lib/lambda/upload-voyage-plan/lambda-upload-voyage-plan';
import {newFault} from "../testdata";
import {SNS} from "aws-sdk";
import * as sinon from 'sinon';
import {SinonStub} from "sinon";

const sandbox = sinon.createSandbox();

describe('upload-voyage-plan', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    afterEach(() => sandbox.restore());

    test('publishes to SNS per fault id', async () => {
        const fault1 = newFault({
            geometry: {
                lat: 60.285807,
                lon: 27.321659
            }
        });
        const fault2 = newFault({
            geometry: {
                lat: 60.285817,
                lon: 27.321660
            }
        });
        await insert(db, [fault1, fault2]);
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan,
            callbackEndpoint: 'some-endpoint'
        };
        const [sns, snsPublishStub] = makeSnsPublishStub();

        await handlerFn(sns, async () => {})(uploadEvent);

        expect(snsPublishStub.calledTwice).toBe(true);
    });

    test('no publish with no callback endpoint', async () => {
        await insertFault(db);
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan
        };
        const [sns, snsPublishStub] = makeSnsPublishStub();

        await handlerFn(sns, async () => {})(uploadEvent);

        expect(snsPublishStub.notCalled).toBe(true);
    });

    test('ack on received voyage plan', async () => {
        await insertFault(db);
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan,
            deliveryAckEndPoint: 'ack-endpoint'
        };
        const [sns] = makeSnsPublishStub();
        const ackStub = sandbox.stub().returns(Promise.resolve());

        await handlerFn(sns, ackStub)(uploadEvent);

        expect(ackStub.calledWith(uploadEvent.deliveryAckEndPoint)).toBe(true);
    });

    test('no ack with no ack endpoint', async () => {
        await insertFault(db);
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan
        };
        const [sns] = makeSnsPublishStub();
        const ackStub = sandbox.stub().returns(Promise.resolve());

        await handlerFn(sns, ackStub)(uploadEvent);

        expect(ackStub.notCalled).toBe(true);
    });

    test('no ack with failed route parsing', async () => {
        const uploadEvent: UploadVoyagePlanEvent = {
            voyagePlan: 'asdfasdf'
        };
        const [sns] = makeSnsPublishStub();
        const ackStub = sandbox.stub().returns(Promise.resolve());

        await expect(handlerFn(sns, ackStub)(uploadEvent)).rejects.toThrow();

        expect(ackStub.notCalled).toBe(true);
    });

}));

async function insertFault(db: pgPromise.IDatabase<any, any>) {
    const fault = newFault({
        geometry: {
            lat: 60.285807,
            lon: 27.321659
        }
    });
    await insert(db, [fault]);
}

function makeSnsPublishStub(): [SNS, SinonStub] {
    const sns = new SNS();
    const publishStub = sandbox.stub().returns(Promise.resolve());
    sandbox.stub(sns, 'publish').returns({promise: publishStub} as any);
    return [sns, publishStub];
}

const voyagePlan = `
<?xml version="1.0" encoding="UTF-8"?>
<route xmlns:stm="http://stmvalidation.eu/STM/1/0/0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1" xmlns="http://www.cirm.org/RTZ/1/1">
    <routeInfo routeName="Pilot Boarding" vesselVoyage="urn:mrn:stm:voyage:id:sma:123" >
        <extensions>
            <extension xsi:type="stm:RouteInfoExtension" manufacturer="STM" name="routeInfoEx" version="1.0.0" routeStatusEnum="1" />
        </extensions>
    </routeInfo>
    <waypoints>
        <defaultWaypoint >
            <leg />
        </defaultWaypoint>
        <waypoint id="1" >
            <position lat="60.474496" lon="27.029835" />
            <leg />
        </waypoint>
        <waypoint id="2" >
            <position lat="60.400138" lon="27.224842" />
            <leg />
        </waypoint>
    </waypoints>
</route>
`;
