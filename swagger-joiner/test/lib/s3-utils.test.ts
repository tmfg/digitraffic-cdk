import {uploadToS3} from "../../lib/s3-utils";
import * as sinon from 'sinon';
import * as AWS from 'aws-sdk';

describe('s3-utils', () => {

    test('uploadToS3', async () => {
        // @ts-ignore
        const s3UploadStub = sinon.stub(AWS.S3.prototype, 'upload').returns({
            promise: () => new Promise((resolve) => resolve())
        });

        const bucketName = 'some-bucket';
        const body = 'some-body';
        const filename = 'some-file.name';
        const cannedAcl = 'public-read';
        await uploadToS3(bucketName, body, filename, cannedAcl);

        const arg = s3UploadStub.getCall(0).args[0];
        expect(arg).toMatchObject({
           Bucket: bucketName,
           Body: body,
           Key: filename,
           ACL: cannedAcl
        });
    });

});
