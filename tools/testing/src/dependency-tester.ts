import madge from "madge";

export class DependencyTester {
  private _instance: madge.MadgeInstance;

  private constructor(instance: madge.MadgeInstance) {
    this._instance = instance;
  }

  private static checkWhiteList(whitelist: string[], items: string[]): void {
    const missing = whitelist.filter((whitelisted) =>
      !items.includes(whitelisted)
    );

    if (missing.length !== 0) {
      throw new Error(
        "Whitelisted dependencies not found:" + JSON.stringify(missing),
      );
    }
  }

  assertNoCircularDependencies(whitelist: string[] = []): void {
    const circulars = this._instance.circular().map((c) => JSON.stringify(c));
    const errors = circulars.filter((circular) =>
      !whitelist.includes(circular)
    );

    if (errors.length !== 0) {
      throw new Error("Circular dependencies found:" + errors.join("\n"));
    }

    DependencyTester.checkWhiteList(whitelist, circulars);
  }

  assertNoOrphans(whitelist: string[] = []): void {
    const orphans = this._instance.circular().map((c) => JSON.stringify(c));
    const errors = orphans.filter((circular) => !whitelist.includes(circular));

    if (errors.length !== 0) {
      throw new Error("Orphans found!");
    }

    DependencyTester.checkWhiteList(whitelist, orphans);
  }

  static async assertNoCdkLibDependenciesInLambdas(
    paths: string | string[],
    fileExtensions: string[] = ["js"],
    whiteList: string[] = [],
  ): Promise<void> {
    const instance = await madge(paths, {
      includeNpm: true,
      fileExtensions,
    });

    const errors = [];
    const fields = [];

    for (const [field, list] of Object.entries(instance.obj())) {
      if (field.includes("lambda/")) {
        const deps = list.filter((d) => d.includes("aws-cdk-lib"));

        if (deps.length > 0 && !whiteList.includes(field)) {
          errors.push(
            `${field} has aws-cdk-lib dependency: ${JSON.stringify(deps)}`,
          );
        }

        fields.push(field);
      }
    }

    if (errors.length > 0) {
      throw new Error(
        "Lambdas have aws-cdk-lib dependencies: " + errors.join("\n"),
      );
    }

    DependencyTester.checkWhiteList(whiteList, fields);
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
