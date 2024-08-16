import { HandlerFactory } from "../../../aws/infra/api/handler-factory.js";
import type { ErrorHandler, LoggingHandler } from "../../../aws/infra/api/handler-factory.js";
import { DtLogger } from "../../../aws/runtime/dt-logger.js";
import { LambdaResponse } from "../../../aws/types/lambda-response.js";
import { jest } from "@jest/globals";

const logger = new DtLogger();

describe("handler-factory tests", () => {
    test("test defaults", async () => {
        const factory = new HandlerFactory();
        const method = jest.fn((method: unknown) => {
            return method as Promise<LambdaResponse>;
        });
        const handler = factory.createEventHandler(method, logger);

        await handler({});

        expect(method).toHaveBeenCalledTimes(1);
    });

    test("test logging", async () => {
        const loggingHandler: LoggingHandler = jest.fn((method: () => Promise<LambdaResponse>) => {
            return method();
        });
        const factory = new HandlerFactory().withLoggingHandler(loggingHandler);
        const method = jest.fn((method: unknown) => {
            return method as Promise<LambdaResponse>;
        });
        const handler = factory.createEventHandler(method, logger);

        await handler({});

        expect(method).toHaveBeenCalledTimes(1);
        expect(loggingHandler).toHaveBeenCalledTimes(1);
    });

    test("test error handling", async () => {
        const eh: ErrorHandler = jest.fn((method: unknown) => {
            return method as LambdaResponse;
        });
        const factory = new HandlerFactory().withErrorHandler(eh);
        const method = jest.fn(() => {
            throw new Error("MAGIC");
        });
        const handler = factory.createEventHandler(method, logger);

        await handler({});

        expect(method).toHaveBeenCalledTimes(1);
        expect(eh).toHaveBeenCalledTimes(1);
    });
});
