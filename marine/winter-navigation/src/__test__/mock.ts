import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { vi } from "vitest";

export function mockProxyHolder(): void {
  vi.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() =>
    Promise.resolve(),
  );
}
