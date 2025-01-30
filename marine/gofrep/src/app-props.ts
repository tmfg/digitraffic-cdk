import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type GofrepProps = StackConfiguration & {
  readonly apiKey: string;
};
