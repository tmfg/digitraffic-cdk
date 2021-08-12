import * as sinon from 'sinon';
import * as StatusService from '../../lib/service/status';
import {NodePingApi, NodePingCheck, NodePingCheckState} from "../../lib/api/nodeping";
import {UpdateStatusSecret} from "../../lib/secret";
import {StatuspageApi, StatuspageComponentStatus} from "../../lib/api/statuspage";
import {randomString} from "digitraffic-common/test/testutils";

describe('status service', () => {

    function testGetNodePingAndStatuspageComponentStatuses(
        name: string,
        expectationFn: (statuses: string[]) => void,
        returnFromStatuspage: any = [],
        returnFromNodePing: any = []) {

        test(name, async () => {
            const secret = emptySecret();
            const statuspageApi = new StatuspageApi('', '');
            const nodePingApi = new NodePingApi('','');
            sinon.stub(statuspageApi, 'getStatuspageComponents').returns(Promise.resolve(returnFromStatuspage));
            sinon.stub(nodePingApi, 'getNodepingChecks').returns(Promise.resolve(returnFromNodePing));

            const statuses = await StatusService.getNodePingAndStatuspageComponentStatuses(secret, statuspageApi, nodePingApi);

            expectationFn(statuses);
        });
    }

    testGetNodePingAndStatuspageComponentStatuses('getNodePingAndStatuspageComponentStatuses - returns nothing',
        (statuses: string[]) => expect(statuses.length).toBe(0));

    testGetNodePingAndStatuspageComponentStatuses('getNodePingAndStatuspageComponentStatuses - missing Statuspage component',
        (statuses: string[]) => {
            expect(statuses.length).toBe(1);
            expect(statuses[0]).toBe('test: Statuspage component missing');
        }, [], [{label: 'test', state: NodePingCheckState.UP}]);

    testGetNodePingAndStatuspageComponentStatuses('getNodePingAndStatuspageComponentStatuses - missing NodePing check',
        (statuses: string[]) => {
            expect(statuses.length).toBe(1);
            expect(statuses[0]).toBe('testcomponent: NodePing check missing');
        }, [{
            name: 'testcomponent',
            id: 'someid',
            group_id: 'somegroupid',
            status: StatuspageComponentStatus.operational
        }], []);

    testGetNodePingAndStatuspageComponentStatuses(`getNodePingAndStatuspageComponentStatuses - component groups don't create checks`,
        (statuses: string[]) => {
            expect(statuses.length).toBe(0);
        }, [{
            name: 'testcomponent',
            id: 'someid',
            group_id: null,
            status: StatuspageComponentStatus.operational
        }], []);

    testGetNodePingAndStatuspageComponentStatuses(`getNodePingAndStatuspageComponentStatuses - NodePing check UP, Statuspage check DOWN`,
        (statuses: string[]) => {
            expect(statuses.length).toBe(1);
            expect(statuses[0]).toBe('testcomponent: NodePing check is UP, Statuspage component is DOWN');
        }, [{
            name: 'testcomponent',
            id: 'someid',
            group_id: 'somegroupid',
            status: StatuspageComponentStatus.major_outage
        }], [{
            label: 'testcomponent',
            state: NodePingCheckState.UP
        }]);

    testGetNodePingAndStatuspageComponentStatuses(`getNodePingAndStatuspageComponentStatuses - NodePing check DOWN, Statuspage check UP`,
        (statuses: string[]) => {
            expect(statuses.length).toBe(1);
            expect(statuses[0]).toBe('testcomponent: NodePing check is DOWN, Statuspage component is UP');
        }, [{
            name: 'testcomponent',
            id: 'someid',
            group_id: 'somegroupid',
            status: StatuspageComponentStatus.operational
        }], [{
            label: 'testcomponent',
            state: NodePingCheckState.DOWN
        }]);

    test('updateChecks - check is updated ', async () => {
        const nodePingApi = new NodePingApi('token','subAccountId', 30);
        const checks: NodePingCheck[] = [{
            _id: randomString(),
            label: randomString(),
            type: 'HTTPADV',
            state: NodePingCheckState.UP,
            parameters: {
                threshold: 20
            }
        }];
        const nodePingApiUpdateSpy = sinon.stub(nodePingApi, 'updateNodepingCheck').returns(Promise.resolve());

        await StatusService.updateChecks(checks, nodePingApi);

        expect(nodePingApiUpdateSpy.called);
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
