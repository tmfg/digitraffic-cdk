import * as S3Utils from "digitraffic-common/stack/s3-utils";

export class RtzStorageApi {

    private readonly bucketName: string

    constructor(bucketName: string) {
        this.bucketName = bucketName;
    }

    async storeVoyagePlan(voyagePlan: string, passedValidation: boolean) {
        const folder = passedValidation ? 'valid' : 'invalid';
        const objectName = `${folder}/voyageplan-${new Date().toISOString()}.xml`;
        await S3Utils.uploadToS3(this.bucketName, voyagePlan, objectName);
    }

}
