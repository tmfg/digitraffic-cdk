import { randomUUID } from "crypto";

export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
}

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

export function getTraceFields(context: TraceContext): {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
} {
  return {
    traceId: context.traceId,
    spanId: context.spanId,
    ...(context?.parentSpanId && { parentSpanId: context.parentSpanId }),
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
