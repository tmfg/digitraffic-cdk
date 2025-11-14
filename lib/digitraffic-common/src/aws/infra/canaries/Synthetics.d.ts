declare module "Synthetics" {
  import { type RequestOptions } from "node:http";
  import type { IncomingMessage } from "node:http";

  interface SyntheticsConfiguration {
    withIncludeRequestBody: (value: boolean) => SyntheticsConfiguration;
    withIncludeRequestHeaders: (value: boolean) => SyntheticsConfiguration;
    withIncludeResponseBody: (value: boolean) => SyntheticsConfiguration;
    withIncludeResponseHeaders: (value: boolean) => SyntheticsConfiguration;
    withFailedCanaryMetric: (value: boolean) => SyntheticsConfiguration;
    disableRequestMetrics: () => SyntheticsConfiguration;
  }

  export function executeHttpStep<T>(
    name: string,
    requestOptions: RequestOptions,
    callback: (t: T, body: string, message: IncomingMessage) => Promise<void>,
  ): Promise<void>;
  export function getConfiguration(): SyntheticsConfiguration;

  export function executeStep(
    s: string,
    f: () => void,
    c: Record<string, boolean>,
  ): void;
}
