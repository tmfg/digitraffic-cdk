import madge from "madge";

export class DependencyTester {
  private _instance: madge.MadgeInstance;

  private constructor(instance: madge.MadgeInstance) {
    this._instance = instance;
  }

  private checkWhiteList(whitelist: string[], circulars: string[]): string[] {
    return whitelist.filter((whitelisted) => !circulars.includes(whitelisted));
  }

  assertNoCircularDependencies(whitelist: string[] = []): void {
    const circulars = this._instance.circular().map((c) => JSON.stringify(c));
    const errors = circulars.filter((circular) => whitelist.includes(circular));

    if (errors.length !== 0) {
      throw new Error("Circular dependencies found!");
    }

    const missing = this.checkWhiteList(whitelist, circulars);
    if (missing.length !== 0) {
      throw new Error(
        "Whitelisted dependencies not found:" + JSON.stringify(missing),
      );
    }
  }

  assertNoOrphans(whitelist: string[] = []): void {
    const orphans = this._instance.circular().map((c) => JSON.stringify(c));
    const errors = orphans.filter((circular) => whitelist.includes(circular));

    if (errors.length !== 0) {
      throw new Error("Orphans found!");
    }

    const missing = this.checkWhiteList(whitelist, orphans);
    if (missing.length !== 0) {
      throw new Error(
        "Whitelisted orphans not found:" + JSON.stringify(missing),
      );
    }
  }

  static async create(
    paths: string | string[],
    fileExtensions: string[] = ["js"],
  ): Promise<DependencyTester> {
    const instance = await madge(paths, {
      fileExtensions,
    });

    return new DependencyTester(instance);
  }
}
