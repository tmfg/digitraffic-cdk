import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export interface AviationDataProps extends StackConfiguration {
    readonly bucketWriterArns: string[];
    readonly bucketReaderArns: string[];
}
