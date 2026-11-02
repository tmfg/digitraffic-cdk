import { LoggerFactory } from "@digitraffic/common/dist/aws/runtime/logging/http-logger";

export const loggerFactory = new LoggerFactory({
  context: "portactivity",
});
