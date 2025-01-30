import type { Construct } from "constructs";
import {
  DigitrafficStack,
  type StackConfiguration,
} from "@digitraffic/common/dist/aws/infra/stack/stack";
import * as PublicApi from "./public-api.js";

export class TestApiStack extends DigitrafficStack {
  constructor(scope: Construct, id: string, configuration: StackConfiguration) {
    super(scope, id, configuration);

    PublicApi.create(this);
  }
}
