declare module "sqs-extended-client" {
  import type { ReceiveMessageCommandOutput } from "@aws-sdk/client-sqs";
  import { SQS } from "@aws-sdk/client-sqs";

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
    _processReceive(
      _response: ReceiveMessageCommandOutput,
    ): Promise<ReceiveMessageCommandOutput>;
  }

  export default ExtendedSqsClient;
}
