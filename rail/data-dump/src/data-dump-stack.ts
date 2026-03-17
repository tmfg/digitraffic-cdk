import type { StackConfiguration } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import * as InternalLambdas from "./internal-lambdas.js";

export interface DataDumpProps extends StackConfiguration {
  readonly compositionDumpBucket: string;
  readonly trainDumpBucket: string;
  readonly trainLocationDumpBucket: string;
}

export class DataDumpStack extends DigitrafficStack {
  readonly dataDumpProps: DataDumpProps;

  constructor(scope: Construct, id: string, props: DataDumpProps) {
    super(scope, id, props);
    this.dataDumpProps = props;
    InternalLambdas.create(this);
  }
}
