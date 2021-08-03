import * as sinon from 'sinon';
import * as StatusService from '../../lib/service/status';
import {NodePingApi, NodePingCheckState} from "../../lib/api/nodeping";
import {UpdateStatusSecret} from "../../lib/secret";
import {StatuspageApi, StatuspageComponentStatus} from "../../lib/api/statuspage";

describe('status service', () => {

    test('getNodePingAndStatuspageComponentStatuses - returns nothing', async () => {
        const secret = emptySecret();
        const statuspageApi = new StatuspageApi('', '');
        const nodePingApi = new NodePingApi('','');
        sinon.stub(statuspageApi, 'getStatuspageComponents').returns(Promise.resolve([]));
        sinon.stub(nodePingApi, 'getNodepingChecks').returns(Promise.resolve([]));

        const statuses = await StatusService.getNodePingAndStatuspageComponentStatuses(secret, statuspageApi, nodePingApi);

        expect(statuses.length).toBe(0);
    });

    test('getNodePingAndStatuspageComponentStatuses - missing Statuspage component', async () => {
        const secret = emptySecret();
        const statuspageApi = new StatuspageApi('', '');
        const nodePingApi = new NodePingApi('','');
        const checkName = 'test';
        sinon.stub(statuspageApi, 'getStatuspageComponents').returns(Promise.resolve([]));
        sinon.stub(nodePingApi, 'getNodepingChecks').returns(Promise.resolve([{label: checkName, state: NodePingCheckState.UP}]));

        const statuses = await StatusService.getNodePingAndStatuspageComponentStatuses(secret, statuspageApi, nodePingApi);

        expect(statuses.length).toBe(1);
        expect(statuses[0]).toBe(`${checkName}: Statuspage component missing`);
    });

    test('getNodePingAndStatuspageComponentStatuses - missing NodePing check', async () => {
        const secret = emptySecret();
        const statuspageApi = new StatuspageApi('', '');
        const nodePingApi = new NodePingApi('','');
        const componentName = 'test';
        sinon.stub(statuspageApi, 'getStatuspageComponents').returns(Promise.resolve([{
            name: componentName,
            id: 'someid',
            group_id: 'somegroupid',
            status: StatuspageComponentStatus.operational
        }]));
        sinon.stub(nodePingApi, 'getNodepingChecks').returns(Promise.resolve([]));

        const statuses = await StatusService.getNodePingAndStatuspageComponentStatuses(secret, statuspageApi, nodePingApi);

        expect(statuses.length).toBe(1);
        expect(statuses[0]).toBe(`${componentName}: NodePing check missing`);
    });

});

function emptySecret(): UpdateStatusSecret {
    return {
        statuspageApiKey: '',
        statuspagePageId: '',
        statusPageMarineComponentGroupId: 'marine',
        statusPageRailComponentGroupId: 'rail',
        statusPageRoadComponentGroupId: 'road',
        nodepingSubAccountId: '',
        nodePingToken: '',
        nodePingContactIdSlack1: '',
        nodePingContactIdSlack2: '',
        reportUrl: ''
    };
}
