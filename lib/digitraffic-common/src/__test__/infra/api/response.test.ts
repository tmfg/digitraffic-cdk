import { RESPONSE_DEFAULT_LAMBDA } from "../../../aws/infra/api/response.js";
import etag from "etag";

//const velocity = require("velocityjs");
import velocity from "velocityjs";

const TEST_BODY = "Hello world!";

interface VelocityContext {
    responseOverride: {
        status: number;
        header: Record<string, string>;
    };
}

describe("response tests", () => {
    function generateEtagValueFromString(body: string): string {
        return generateEtagValueFromBase64String(Buffer.from(body).toString("base64"));
    }
    function generateEtagValueFromBase64String(bodyBase64: string): string {
        return etag(bodyBase64);
    }

    function generateResponse(
        status: number,
        fileName?: string,
        timestamp?: Date,
    ): [string, VelocityContext] {
        const compile = new velocity.Compile(velocity.parse(RESPONSE_DEFAULT_LAMBDA));
        const output = compile.render({
            input: {
                path: () => ({
                    body: Buffer.from(TEST_BODY).toString("base64"),
                    status,
                    fileName,
                    timestamp: timestamp?.toUTCString(),
                    etag: generateEtagValueFromString(TEST_BODY),
                }),
            },
            util: {
                base64Decode: (data: string) => Buffer.from(data, "base64").toString(),
            },
            context: {
                responseOverride: {
                    status: undefined,
                    header: {
                        "Content-Type": undefined,
                        "Access-Control-Allow-Origin": undefined,
                        ETag: undefined,
                        "Last-Modified": undefined,
                        "Content-Disposition": undefined,
                    },
                },
            },
        });

        // @ts-expect-error: context is not in the type definition
        // eslint-disable-next-line
        return [output as string, compile.context.context];
    }

    function assertOutputAndContext(
        output: string,
        context: VelocityContext,
        status?: number,
        contentType?: string,
        fileName?: string,
        timestamp?: Date,
    ): void {
        expect(output).toEqual(TEST_BODY);
        expect(context).toMatchObject({
            responseOverride: {
                status,
                header: {
                    "Content-Type": contentType,
                    "Access-Control-Allow-Origin": "*",
                    "Content-Disposition": fileName,
                    "Last-Modified": timestamp?.toUTCString(),
                    ETag: generateEtagValueFromString(TEST_BODY),
                },
            },
        });
    }

    test("test 200", () => {
        const [output, context] = generateResponse(200);
        assertOutputAndContext(output, context);
    });

    test("test 200 - filename", () => {
        const [output, context] = generateResponse(200, "test.txt");

        assertOutputAndContext(output, context, undefined, undefined, 'attachment; filename="test.txt"');
    });

    test("test 200 - filename and timestamp", () => {
        const now = new Date();
        const [output, context] = generateResponse(200, "test.txt", now);

        assertOutputAndContext(output, context, undefined, undefined, 'attachment; filename="test.txt"', now);
    });

    test("test 204", () => {
        const [output, context] = generateResponse(204);

        assertOutputAndContext(output, context, 204, "text/plain");
    });
});
