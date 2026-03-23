import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type Props = StackConfiguration;

export interface BridgeLockDisruptionsProps {
  getDisruptionsLambda: {
    reservedConcurrency: number;
  };
}
