// Domain types

export {
  type CollectedMetric,
  createCollectedMetric,
} from "./collected-metric.js";
export {
  type CollectionResult,
  createCollectionResult,
  hasPartialSuccess,
  isSuccess,
} from "./collection-result.js";
export {
  createMetricDefinition,
  type MetricDefinition,
} from "./metric-definition.js";
export {
  createEndpointScope,
  createServiceScope,
  type MetricScope,
} from "./metric-scope.js";
export {
  isCategoricalCountsValue,
  isScalarValue,
  type MetricRetrievalResult,
  type MetricValue,
  MetricValueType,
} from "./metric-value.js";
export {
  createMonitoredEndpoints,
  type MonitoredEndpoints,
} from "./monitored-endpoints.js";
export { parseService, Service } from "./service.js";
export {
  createTimePeriod,
  type DateRange,
  forMonth,
  lastMonth,
  type TimePeriod,
  toIsoDateRange,
} from "./time-period.js";
