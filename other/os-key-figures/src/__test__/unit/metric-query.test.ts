import { describe, expect, test } from "@jest/globals";
import {
  CardinalityMetricQuery,
  CountMetricQuery,
  SumMetricQuery,
  TermsMetricQuery,
  TermsWithSubAggMetricQuery,
} from "../../adapters/driven/opensearch/metric-query.js";
import { createServiceScope } from "../../domain/types/metric-scope.js";
import { Service } from "../../domain/types/service.js";
import { createTimePeriod } from "../../domain/types/time-period.js";

const TEST_ACCOUNT_NAMES: Record<Service, string> = {
  [Service.ALL]: "*",
  [Service.RAIL]: "fintraffic-digitraffic-rail-prd",
  [Service.ROAD]: "fintraffic-digitraffic-road-prd",
  [Service.MARINE]: "fintraffic-digitraffic-marine-prd",
  [Service.AFIR]: "fintraffic-digitraffic-afir-prd",
};

const TEST_INDEX = "access-log-*";
const TEST_PERIOD = createTimePeriod(
  new Date("2025-12-01T00:00:00.000Z"),
  new Date("2026-01-01T00:00:00.000Z"),
);

describe("buildAccountFilter via buildQuery", () => {
  describe("Service.ALL scope", () => {
    const allScope = createServiceScope(Service.ALL);

    test("CountMetricQuery includes all account names with OR", () => {
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req",
        TEST_INDEX,
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);
      const queryString = parsed.query.bool.must[0].query_string.query;

      // Must use actual account names, not enum values
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-rail-prd",
      );
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-road-prd",
      );
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-marine-prd",
      );
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-afir-prd",
      );

      // Must NOT contain bare enum values as account names
      expect(queryString).not.toMatch(/accountName\.keyword:rail(?!-)/);
      expect(queryString).not.toMatch(/accountName\.keyword:road(?!-)/);
      expect(queryString).not.toMatch(/accountName\.keyword:marine(?!-)/);
      expect(queryString).not.toMatch(/accountName\.keyword:afir(?!-)/);

      // All joined with OR in parentheses
      expect(queryString).toContain("(accountName.keyword:fintraffic");
      expect(queryString).toContain(" OR ");
    });

    test("CountMetricQuery with additional condition appends correctly", () => {
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req 200",
        TEST_INDEX,
        "httpStatusCode:200",
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);
      const queryString = parsed.query.bool.must[0].query_string.query;

      expect(queryString).toContain("AND httpStatusCode:200");
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-rail-prd",
      );
    });

    test("SumMetricQuery produces correct aggregation query", () => {
      const query = new SumMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Bytes out",
        TEST_INDEX,
        "bytes",
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);

      expect(parsed.aggs.agg.sum.field).toBe("bytes");
      expect(parsed.size).toBe(0);

      const queryString = parsed.query.bool.must[0].query_string.query;
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-rail-prd",
      );
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-afir-prd",
      );
    });

    test("CardinalityMetricQuery produces correct aggregation query", () => {
      const query = new CardinalityMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Unique IPs",
        TEST_INDEX,
        "clientIp",
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);

      expect(parsed.aggs.agg.cardinality.field).toBe("clientIp");
      const queryString = parsed.query.bool.must[0].query_string.query;
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-marine-prd",
      );
    });

    test("TermsMetricQuery produces correct terms aggregation", () => {
      const query = new TermsMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Top 10 Referers",
        TEST_INDEX,
        "httpReferrer.keyword",
        10,
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);

      expect(parsed.aggs.agg.terms.field).toBe("httpReferrer.keyword");
      expect(parsed.aggs.agg.terms.size).toBe(10);

      const queryString = parsed.query.bool.must[0].query_string.query;
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-road-prd",
      );
    });

    test("TermsWithSubAggMetricQuery produces correct nested aggregation", () => {
      const query = new TermsWithSubAggMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Top digitraffic-users by bytes",
        TEST_INDEX,
        "httpDigitrafficUser.keyword",
        "bytes",
        "sum",
        100,
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);

      expect(parsed.aggs.agg.terms.field).toBe("httpDigitrafficUser.keyword");
      expect(parsed.aggs.agg.aggs.agg.sum.field).toBe("bytes");

      const queryString = parsed.query.bool.must[0].query_string.query;
      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-afir-prd",
      );
    });
  });

  describe("individual service scopes", () => {
    test("Service.RAIL uses single account name", () => {
      const railScope = createServiceScope(Service.RAIL);
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req",
        TEST_INDEX,
      );
      const queryJson = query.buildQuery(railScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);
      const queryString = parsed.query.bool.must[0].query_string.query;

      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-rail-prd",
      );
      expect(queryString).not.toContain("OR");
      expect(queryString).not.toContain("road");
      expect(queryString).not.toContain("marine");
    });

    test("Service.ROAD uses single account name", () => {
      const roadScope = createServiceScope(Service.ROAD);
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req",
        TEST_INDEX,
      );
      const queryJson = query.buildQuery(roadScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);
      const queryString = parsed.query.bool.must[0].query_string.query;

      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-road-prd",
      );
      expect(queryString).not.toContain("OR");
    });

    test("Service.MARINE uses single account name", () => {
      const marineScope = createServiceScope(Service.MARINE);
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req",
        TEST_INDEX,
      );
      const queryJson = query.buildQuery(marineScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);
      const queryString = parsed.query.bool.must[0].query_string.query;

      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-marine-prd",
      );
      expect(queryString).not.toContain("OR");
    });

    test("Service.AFIR uses single account name", () => {
      const afirScope = createServiceScope(Service.AFIR);
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req",
        TEST_INDEX,
      );
      const queryJson = query.buildQuery(afirScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);
      const queryString = parsed.query.bool.must[0].query_string.query;

      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-afir-prd",
      );
      expect(queryString).not.toContain("OR");
    });
  });

  describe("query structure matches expected format", () => {
    test("CountMetricQuery for ALL matches reference CSV format", () => {
      const allScope = createServiceScope(Service.ALL);
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req",
        TEST_INDEX,
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);

      // Verify structure matches: { query: { bool: { must, must_not, filter } } }
      expect(parsed).toHaveProperty("query.bool.must");
      expect(parsed).toHaveProperty("query.bool.must_not");
      expect(parsed).toHaveProperty("query.bool.filter");

      // No "aggs" or "size" for count queries
      expect(parsed).not.toHaveProperty("aggs");
      expect(parsed).not.toHaveProperty("size");

      // Verify must_not includes skip_statistics and integration filter
      expect(parsed.query.bool.must_not).toEqual([
        { term: { skip_statistics: true } },
        { wildcard: { httpHost: "*.integration.digitraffic.fi" } },
      ]);

      // Verify time range filter
      const rangeFilter = parsed.query.bool.filter[0].range["@timestamp"];
      expect(rangeFilter.gte).toBe("2025-12-01T00:00:00.000Z");
      expect(rangeFilter.lte).toBe("2026-01-01T00:00:00.000Z");
      expect(rangeFilter.format).toBe("strict_date_optional_time");

      // Verify query_string settings
      const qs = parsed.query.bool.must[0].query_string;
      expect(qs.analyze_wildcard).toBe(true);
      expect(qs.time_zone).toBe("Europe/Helsinki");
    });

    test("SumMetricQuery for ALL matches reference format", () => {
      const allScope = createServiceScope(Service.ALL);
      const query = new SumMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Bytes out",
        TEST_INDEX,
        "bytes",
      );
      const queryJson = query.buildQuery(allScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);

      // Has aggs and size:0
      expect(parsed.aggs.agg.sum.field).toBe("bytes");
      expect(parsed.size).toBe(0);
      expect(parsed).toHaveProperty("query.bool");
    });
  });

  describe("endpoint scope queries", () => {
    test("endpoint scope adds request filter to query string", () => {
      const endpointScope = {
        service: Service.RAIL,
        endpoint: "/api/v1/trains/",
        storageTag:
          '@transport_type:rail AND @fields.request_uri:"/api/v1/trains/"',
      };
      const query = new CountMetricQuery(
        TEST_ACCOUNT_NAMES,
        "Http req",
        TEST_INDEX,
      );
      const queryJson = query.buildQuery(endpointScope, TEST_PERIOD);
      const parsed = JSON.parse(queryJson);
      const queryString = parsed.query.bool.must[0].query_string.query;

      expect(queryString).toContain(
        "accountName.keyword:fintraffic-digitraffic-rail-prd",
      );
      expect(queryString).toContain('AND request:"/api/v1/trains*"');
    });
  });
});
