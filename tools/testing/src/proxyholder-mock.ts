import { jest } from "@jest/globals";

// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "";

import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

export function mockProxyHolder(): void {    
    jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() => Promise.resolve());
}