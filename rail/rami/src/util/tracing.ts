import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<TraceContext>();

export function createTraceContext(): TraceContext {
  const traceId = randomUUID();
  const spanId = randomUUID();
  return { traceId, spanId };
}

export function createChildSpan(parent: TraceContext): TraceContext {
  return {
    traceId: parent.traceId,
    spanId: randomUUID(),
    parentSpanId: parent.spanId,
  };
}

export function getCurrentTraceContext(): TraceContext | undefined {
  return asyncLocalStorage.getStore();
}

export function runWithTraceContext<T>(
  context: TraceContext,
  fn: () => Promise<T>,
): Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

export function runWithChildSpan<T>(fn: () => Promise<T>): Promise<T> {
  const currentContext = getCurrentTraceContext();
  if (!currentContext) {
    const newContext = createTraceContext();
    return asyncLocalStorage.run(newContext, fn);
  }
  const childContext = createChildSpan(currentContext);
  return asyncLocalStorage.run(childContext, fn);
}

export function getTraceFields(context?: TraceContext): {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
} {
  const ctx = context ?? getCurrentTraceContext();
  if (!ctx) {
    return {
      traceId: "no-trace-context",
      spanId: "no-trace-context",
    };
  }
  return {
    traceId: ctx.traceId,
    spanId: ctx.spanId,
    ...(ctx?.parentSpanId && { parentSpanId: ctx.parentSpanId }),
  };
}

export interface TrainInfo {
  trainNumber: number;
  trainDepartureDate: string;
  attapId?: number;
}

export function getTrainInfoFields(info: TrainInfo): {
  customTrainNumber: number;
  customTrainDepartureDate: string;
  customAttapId?: number;
} {
  return {
    customTrainNumber: info.trainNumber,
    customTrainDepartureDate: info.trainDepartureDate,
    ...(info.attapId !== undefined && { customAttapId: info.attapId }),
  };
}
