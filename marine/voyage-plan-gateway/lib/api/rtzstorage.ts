import * as S3Utils from "digitraffic-common/stack/s3-utils";

export class RtzStorageApi {

    private readonly bucketName: string

    constructor(bucketName: string) {
        this.bucketName = bucketName;
    }

    async storeVoyagePlan(voyagePlan: string) {
        console.info('method=storeVoyagePlan Storing RTZ voyage plan');
        const objectName = `voyageplan-${new Date().toISOString()}.xml`;
        await S3Utils.uploadToS3(this.bucketName, voyagePlan, objectName);
        console.info('method=storeVoyagePlan RTZ storage complete');

    }

}
