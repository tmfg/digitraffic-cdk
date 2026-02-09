import { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";

export type Props = StackConfiguration;

interface BridgeLockDisruptionsProps {
  getDisruptionsLambda: {
    reservedConcurrency: number;
  };
}
