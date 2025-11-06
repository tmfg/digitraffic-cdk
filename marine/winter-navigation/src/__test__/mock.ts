import { jest } from "@jest/globals";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

export function mockProxyHolder(): void {
  jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() =>
    Promise.resolve()
  );
}
