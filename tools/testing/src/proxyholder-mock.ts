import { vi } from "vitest";

// biome-ignore lint/complexity/useLiteralKeys: nope
process.env["SECRET_ID"] = "";

import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

export function mockProxyHolder(): void {
  vi.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() =>
    Promise.resolve(),
  );
}
