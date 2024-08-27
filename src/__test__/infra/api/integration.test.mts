import { DigitrafficIntegration } from "../../../aws/infra/api/integration.mjs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { App, Stack } from "aws-cdk-lib";
import { MediaType } from "../../../aws/types/mediatypes.mjs";

describe("integration tests", () => {
    function createTemplate(i: DigitrafficIntegration<string>): string {
        return i.createRequestTemplates()[MediaType.APPLICATION_JSON]!.trim();
    }

    function createIntegration(): DigitrafficIntegration<string> {
        const app = new App();
        const stack = new Stack(app);

        const f = new Function(stack, "id", {
            runtime: Runtime.NODEJS_20_X,
            code: Code.fromInline("placeholder"),
            handler: "handler",
        });

        return new DigitrafficIntegration(f);
    }

    function expectAssignmentInTemplate(t: string, name: string): void {
        expect(t).toContain(`"${name}":`);
    }

    test("no parameters", () => {
        const i = createIntegration();

        const t = createTemplate(i);
        expect(JSON.parse(t)).toEqual({});
    });

    test("query parameter", () => {
        const i = createIntegration()
            .addQueryParameter("q1");

        const t = createTemplate(i);
        expectAssignmentInTemplate(t, "q1");
    });

    test("multivaluequery parameter", () => {
        const i = createIntegration()
            .addMultiValueQueryParameter("m1");

        const t = createTemplate(i);
        expectAssignmentInTemplate(t, "m1");
    });

    test("all parameters", () => {
        const i = createIntegration()
            .passAllQueryParameters();

        const t = createTemplate(i);
        expectAssignmentInTemplate(t, "$paramName");
    });

    test("path parameter", () => {
        const i = createIntegration()
            .addPathParameter("p1");

        const t = createTemplate(i);
        expectAssignmentInTemplate(t, "p1");
    });

    test("context parameter", () => {
        const i = createIntegration()
            .addContextParameter("c1");

        const t = createTemplate(i);
        expectAssignmentInTemplate(t, "c1");
    });

    test("all parameters and header", () => {
        const i = createIntegration()
            .passAllQueryParameters()
            .addHeaderParameter("h1");

        const t = createTemplate(i);
        expectAssignmentInTemplate(t, "$paramName");
        expectAssignmentInTemplate(t, "h1");
    });

    test("all parameters & parameter - fail", () => {
        expect(() => {
            createIntegration()
                .passAllQueryParameters()
                .addQueryParameter("q1");
        }).toThrow();
    });
});
