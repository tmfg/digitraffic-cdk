const { SQS, S3 } = require("aws-sdk"),
      { SQSExt, Config } = require("aws-sqs-xl-messages")(SQS); // inject the SQS client that will be decorated

export function createSQSExtClient(bucketName : string): any { // typeof SQSExt
    const config = new Config();
    // tell the client which S3 bucket to use.
    config.enableLargePayloadSupport(new S3(), bucketName);
    // optionally tell the client whether it must always upload messages to S3. This defaults to false.
    config.alwaysThroughS3 = false;
    // optionally tell the client whether it must prefix S3 objects with the QueueName. Useful if you
    // plan to use one single bucket for more than one SQS queue. This defaults to true.
    config.addQueueToS3Key = true;
    return new SQSExt({ extendedConfig: config });
}