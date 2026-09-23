declare module "node-ttl" {
  class Ttl {
    constructor({ ttl: number });
    push: (key: string, value: unknown) => boolean;

    get: <T>(key: string) => T;
  }

  export = Ttl;
}
