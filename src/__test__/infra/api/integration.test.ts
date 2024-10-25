import { DigitrafficIntegration } from "../../../aws/infra/api/integration.js";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { App, Stack } from "aws-cdk-lib";
import { MediaType } from "../../../aws/types/mediatypes.js";
import velocity from "velocityjs";

describe("integration tests", () => {
    function createTemplate(i: DigitrafficIntegration<string>): unknown {
        const template = i.createRequestTemplates()[MediaType.APPLICATION_JSON]!.trim();

        // assert template parses
        const response = createResponseFromTemplate(template);

        // assert response parses
        console.info("response " + response);

        return JSON.parse(response);
    }

    function createResponseFromTemplate(template: string): string {
        console.info("compile " + template);
        const compile = new velocity.Compile(velocity.parse(template));
        return compile.render({
            method: {
                request: {
                    multivaluequerystring: {
                        m1: ["multi1", "multi2"]
                    }
                }
            },
            input: {
                params: () => ({
                    header: {
                        h1: "header1",
                    },
                    querystring: {
                        q1: "querystring1",
                        q2: "querystring2"
                    },
                    path: {
                        p1: "path1"        
                    },
    
                })
            },
            util: {
                base64Decode: (data: string) => Buffer.from(data, "base64").toString(),
                escapeJavaScript: (data: string) => encodeURIComponent(data),
                parseJson: (data: unknown) => JSON.stringify(data)
            },
            context: {
                c1: "context1"
            }
        });
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

    test("no parameters", () => {
        const i = createIntegration();

        const t = createTemplate(i);
        expect(t).toEqual({});
    });

    test("query parameter", () => {
        const i = createIntegration()
            .addQueryParameter("q1");

        const t = createTemplate(i);
        expect(t).toEqual({
            q1: "querystring1"
        });
    });

    test("two query parameters", () => {
        const i = createIntegration()
            .addQueryParameter("q1")
            .addQueryParameter("q2")

        const t = createTemplate(i);
        expect(t).toEqual({
            q1: "querystring1",
            q2: "querystring2"
        });
    });

    test("multivaluequery parameter", () => {
        const i = createIntegration()
            .addMultiValueQueryParameter("m1");

        const t = createTemplate(i);
        expect(t).toEqual({
            m1: ["multi1", "multi2"]
        });
    });

    test("all parameters", () => {
        const i = createIntegration()
            .passAllQueryParameters();

        const t = createTemplate(i);
        expect(t).toEqual({
            q1: "querystring1",
            q2: "querystring2"
        });
    });

    test("path parameter", () => {
        const i = createIntegration()
            .addPathParameter("p1");

        const t = createTemplate(i);
        expect(t).toEqual({
            p1: "path1"
        });
    });

    test("context parameter", () => {
        const i = createIntegration()
            .addContextParameter("c1");

        const t = createTemplate(i);
        expect(t).toEqual({
            c1: "context1"
        });
    });

    test("all parameters and header", () => {
        const i = createIntegration()
            .passAllQueryParameters()
            .addHeaderParameter("h1");

        const t = createTemplate(i);
        expect(t).toEqual({
            h1: "header1",
            q1: "querystring1",
            q2: "querystring2"
        });
    });

    test("all parameters & parameter - fail", () => {
        expect(() => {
            createIntegration()
                .passAllQueryParameters()
                .addQueryParameter("q1");
        }).toThrow();
    });

    test("path parameters & pass all ", () => {
        const i = createIntegration()
                .addPathParameter("p1")
                .passAllQueryParameters();

        const t = createTemplate(i);
        expect(t).toEqual({
            p1: "path1",
            q1: "querystring1",
            q2: "querystring2"
        })
    });

});
