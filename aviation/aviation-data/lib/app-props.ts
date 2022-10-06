import {StackConfiguration} from "@digitraffic/common/aws/infra/stack/stack";

export type AviationDataProps = StackConfiguration & {
    readonly bucketWriterArns: string[]
    readonly bucketReaderArns: string[]
}
