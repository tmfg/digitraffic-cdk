import {dbTestBase, insert, TEST_ATON_SECRET} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {handlerFn} from '../../lib/lambda/send-s124/send-s124';
import {newFault} from "../testdata";
import * as sinon from 'sinon';
import {SQSEvent} from "aws-lambda";
import {TestHttpServer} from "digitraffic-common/test/httpserver";
import {S124Type, SendS124Event} from "../../lib/model/upload-voyageplan-event";
import {createSecretFunction} from "digitraffic-common/test/secret";
import {AtonSecret} from "../../lib/model/secret";

const sandbox = sinon.createSandbox();
const SERVER_PORT = 30123;

describe('send-fault', dbTestBase((db: pgPromise.IDatabase<any, any>) => {

    afterEach(() => sandbox.restore());

    test('faults are sent to endpoint', async () => {
        const server = new TestHttpServer();
        try {
            let receivedData: string | undefined;
            const fault = newFault({
                geometry: {
                    lat: 60.285807,
                    lon: 27.321659
                }
            });
            await insert(db, [fault]);
            const s124Event: SendS124Event = {
                type: S124Type.FAULT,
                id: fault.id,
                callbackEndpoint: `http://localhost:${SERVER_PORT}/area`
            };
            const withSecret = createSecretFunction<AtonSecret, void>(TEST_ATON_SECRET);
            server.listen(SERVER_PORT, {
                "/area": (url: string | undefined, data: string | undefined) => {
                    receivedData = data;
                    return '';
                }
            });

            await handlerFn(withSecret)(createSqsEvent(s124Event));

            // TODO better assertion
            expect(receivedData).toContain('S124:DataSet');
        } finally {
            server.close();
        }

    });
}));

function createSqsEvent(sendFaultEvent: SendS124Event): SQSEvent {
    return {
        Records: [{
            body: JSON.stringify(sendFaultEvent),
        }]
    } as SQSEvent;
}
