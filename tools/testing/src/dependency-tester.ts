import madge from "madge";

export class DependencyTester {
  private _instance: madge.MadgeInstance;

  private constructor(instance: madge.MadgeInstance) {
    this._instance = instance;
  }

  private static checkWhiteList(whitelist: string[], items: string[]): void {
    const missing = whitelist.filter(
      (whitelisted) => !items.includes(whitelisted),
    );

    if (missing.length !== 0) {
      throw new Error(
        `Whitelisted dependencies not found (${missing.length}):\n\n${missing.join("\n")}`,
      );
    }
  }

  assertNoCircularDependencies(whitelist: string[] = []): void {
    // This is a false positive from madge
    whitelist.push("esbuild.js");

    const circulars = this._instance.circular().map((c) => c.join(", "));

    const errors = circulars.filter(
      (circular) => !whitelist.includes(circular),
    );

    if (errors.length !== 0) {
      throw new Error(
        `Circular dependency check failed: ${errors.length} circular dependencies found:\n\n${errors.join("\n")}`,
      );
    }

    DependencyTester.checkWhiteList(whitelist, circulars);
  }

  assertNoOrphans(whitelist: string[] = []): void {
    // This is a false positive from madge
    whitelist.push("esbuild.js");
    const orphans = this._instance.circular().map((c) => c.join(", "));
    //const orphans = this._instance.circular().map((c) => c.join(", "));
    const errors = orphans.filter((circular) => !whitelist.includes(circular));

    if (errors.length !== 0) {
      throw new Error(
        `Orphans found: ${errors.length} circular dependencies found:\n\n${errors.join("\n")}`,
      );
    }

    DependencyTester.checkWhiteList(whitelist, orphans);
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
