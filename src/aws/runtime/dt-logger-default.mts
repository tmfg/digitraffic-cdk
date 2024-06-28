import { DtLogger } from "./dt-logger.mjs";

/**
 * You can use this for method name definition to match DtLogger LoggableType.method parameter.
 */
export type { LoggerMethodType } from "./dt-logger.mjs";

/**
 * You can use this for your logging needs or create one locally and configure it as you wish.
 */
export const logger = new DtLogger();
