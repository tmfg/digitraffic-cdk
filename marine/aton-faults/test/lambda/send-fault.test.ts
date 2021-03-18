import {dbTestBase, insert} from "../db-testutil";
import * as pgPromise from "pg-promise";
import {handlerFn, SendFaultEvent} from '../../lib/lambda/send-fault/lambda-send-fault';
import {newFault} from "../testdata";
import * as sinon from 'sinon';
import {SNSEvent} from "aws-lambda";
import {TestHttpServer} from "../../../../common/test/httpserver";

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
            const snsFaultEvent: SendFaultEvent = {
                faultId: fault.id,
                callbackEndpoint: `http://localhost:${SERVER_PORT}/area`
            };
            const withSecret = () => {
            };
            server.listen(SERVER_PORT, {
                "/area": (url: string | undefined, data: string | undefined) => {
                    receivedData = data;
                    return '';
                }
            });

            await handlerFn(withSecret)(createSnsEvent(snsFaultEvent));

            // TODO better assertion
            expect(receivedData).toContain('S124:DataSet');
        } finally {
            server.close();
        }

    });

}));

function createSnsEvent(sendFaultEvent: SendFaultEvent): SNSEvent {
    return {
        Records: [{
            EventSource: '',
            EventSubscriptionArn: '',
            EventVersion: '',
            Sns: {
                Message: JSON.stringify(sendFaultEvent),
                MessageAttributes: {},
                MessageId: '',
                Signature: '',
                SignatureVersion: '',
                SigningCertUrl: '',
                Subject: '',
                Timestamp: '',
                TopicArn: '',
                Type: '',
                UnsubscribeUrl: ''
            }
        }]
    };
}
