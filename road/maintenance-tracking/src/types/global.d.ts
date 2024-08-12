declare module "sqs-extended-client" {
    import { SQS, ReceiveMessageCommandOutput } from "@aws-sdk/client-sqs";

    export interface ExtendedSqsClientOptions {
        readonly bucketName: string;
        readonly alwaysUseS3?: boolean;
        readonly sqsClientConfig?: {
            readonly region?: string;
        };
    }

    export class ExtendedSqsClient extends SQS {
        constructor(options: ExtendedSqsClientOptions = {});
        //sendMessage(message: Object): Promise<SendMessageCommandOutput>;
        async _processReceive(response: ReceiveMessageCommandOutput): Promise<ReceiveMessageCommandOutput>;
    }

    export default ExtendedSqsClient;
}
