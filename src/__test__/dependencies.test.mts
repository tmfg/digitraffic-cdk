const madge = await import("madge");

const WHITELISTED_DEPENDENCIES = [
    // aspect is using DigitrafficStack with instanceof, can't remove
    `["aws/infra/stack/stack.mjs","aws/infra/stack/stack-checking-aspect.mjs"]`
] as string[];

function whitelist(circular: string[]): boolean {
    return !WHITELISTED_DEPENDENCIES.includes(JSON.stringify(circular));
}

function assertNoErrors(errors: string[][]): void {
    expect(errors).toHaveLength(0);
}

test("circular dependencies", async () => {
    const instance = await madge.default("dist", {
        fileExtensions: ["mts", "mjs"]
    });

    const circulars = instance.circular();
    const errors = circulars.filter(whitelist);

    assertNoErrors(errors);
});