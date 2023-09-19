import { parseGitStatusLine } from "../service/git.js";

describe("git service", () => {
    describe("parseGitStatusLine", () => {
        it("should throw error when unable to parse the status line", () => {
            expect(() => parseGitStatusLine("garbage")).toThrow();
        });

        it.each`
            input                     | status  | from         | target
            ${`A  .foobar`}           | ${"A "} | ${undefined} | ${".foobar"}
            ${` M .foobar`}           | ${" M"} | ${undefined} | ${".foobar"}
            ${` M bazbaz`}            | ${" M"} | ${undefined} | ${"bazbaz"}
            ${` M bazbaz`}            | ${" M"} | ${undefined} | ${"bazbaz"}
            ${`!! bazbaz`}            | ${"!!"} | ${undefined} | ${"bazbaz"}
            ${`?? oea/uoe/tuhoe`}     | ${"??"} | ${undefined} | ${"oea/uoe/tuhoe"}
            ${`?? "oeau oetuhoe"`}    | ${"??"} | ${undefined} | ${"oeau oetuhoe"}
            ${`XY fooo -> bar`}       | ${"XY"} | ${"fooo"}    | ${"bar"}
            ${`XY fooo -> "baz bar"`} | ${"XY"} | ${"fooo"}    | ${"baz bar"}
            ${`XY "fo oo" -> bar`}    | ${"XY"} | ${"fo oo"}   | ${"bar"}
        `(
            `should be able to parse status line: "$input"`,
            (props: { input: string; status: string; from?: string; target: string }) => {
                const { input, status, from, target } = props;
                const result = parseGitStatusLine(input);

                expect(result).toMatchObject({ status, from, target });
            }
        );
    });
});
