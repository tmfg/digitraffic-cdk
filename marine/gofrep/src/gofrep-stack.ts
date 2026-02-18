import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import type { Construct } from "constructs";
import type { GofrepProps } from "./app-props.js";
import * as IntegrationApi from "./integration-api.js";

export class GofrepStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, appProps: GofrepProps) {
    super(scope, id, appProps);

    IntegrationApi.create(this, appProps.apiKey);
  }
}
