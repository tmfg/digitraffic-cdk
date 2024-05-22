import madge from "madge";

export class DependencyTester {
    private _instance: madge.MadgeInstance;

    private constructor(instance: madge.MadgeInstance) {
        this._instance = instance;
    }

    assertNoCircularDependencies(whitelist: string[] = []): void {
        const circulars = this._instance.circular();
        const errors = circulars.filter((circular: string[]) => whitelist.includes(JSON.stringify(circular)));

        if (errors.length !== 0) {
            throw new Error("Circular dependencies found!");
        }
    }

    assertNoOrphans(whitelist: string[] = []): void {
        const orphans = this._instance.circular();
        const errors = orphans.filter((circular: string[]) => whitelist.includes(JSON.stringify(circular)));

        if (errors.length !== 0) {
            throw new Error("Orphans found!");
        }
    }

    static async create(
        paths: string | string[],
        fileExtensions: string[] = ["js"]
    ): Promise<DependencyTester> {
        const instance = await madge(paths, {
            fileExtensions
        });

        return new DependencyTester(instance);
    }
}
