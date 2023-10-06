import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type GofrepProps = StackConfiguration & {
    apiKey: string;
};
