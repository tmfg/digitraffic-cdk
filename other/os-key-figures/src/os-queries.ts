/* prettier-ignore */

// OpenSearch queries
// the json keys of queries are intentionally left quoted - easier to copy and paste for testing in the UI
export const osQueries = [
  {
    name: "Http req",
    query: {
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
    },
    type: "count",
  },
  {
    name: "Http req 200",
    query: {
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query":
                "NOT log_line:* AND accountName.keyword:* AND httpStatusCode:200",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
    },
    type: "count",
  },
  {
    name: "Bytes out",
    query: {
      "aggs": { "agg": { "sum": { "field": "bytes" } } },
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
      "size": 0,
    },
    type: "agg",
  },
  {
    name: "Unique IPs",
    query: {
      "aggs": { "agg": { "cardinality": { "field": "clientIp" } } },
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
      "size": 0,
    },
    type: "agg",
  },
  {
    name: "Top 10 Referers",
    query: {
      "aggs": {
        "agg": {
          "terms": {
            "field": "httpReferrer.keyword",
            "order": { "_count": "desc" },
            "missing": "__missing__",
            "size": 10,
          },
        },
      },
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
      "size": 0,
    },
    type: "field_agg",
  },
  {
    name: "Top 10 digitraffic-users",
    query: {
      "aggs": {
        "agg": {
          "terms": {
            "field": "httpDigitrafficUser.keyword",
            "order": { "_count": "desc" },
            "missing": "__missing__",
            "size": 100,
          },
        },
      },
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
      "size": 0,
    },
    type: "field_agg",
  },
  {
    name: "Top digitraffic-users by bytes",
    query: {
      "aggs": {
        "agg": {
          "terms": {
            "field": "httpDigitrafficUser.keyword",
            "order": { "agg": "desc" },
            "missing": "__missing__",
            "size": 100,
          },
          "aggs": { "agg": { "sum": { "field": "bytes" } } },
        },
      },
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
      "size": 0,
    },
    type: "sub_agg",
  },
  {
    name: "Top 10 User Agents",
    query: {
      "aggs": {
        "agg": {
          "terms": {
            "field": "agent.keyword",
            "order": { "_count": "desc" },
            "missing": "__missing__",
            "size": 10,
          },
        },
      },
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
      "size": 0,
    },
    type: "field_agg",
  },
  {
    name: "Top 10 IPs",
    query: {
      "aggs": { "agg": { "terms": { "field": "clientIp", "size": 10 } } },
      "query": {
        "bool": {
          "must": [{
            "query_string": {
              "query": "NOT log_line:* AND accountName.keyword:*",
              "analyze_wildcard": true,
              "time_zone": "Europe/Helsinki",
            },
          }],
          "must_not": [
            {
              "term": {
                "skip_statistics": true,
              },
            },
            {
              "wildcard": {
                "httpHost": "*.integration.digitraffic.fi",
              },
            },
          ],
          "filter": [{
            "range": {
              "@timestamp": {
                "gte": "START_TIME",
                "lte": "END_TIME",
                "format": "strict_date_optional_time",
              },
            },
          }],
        },
      },
      "size": 0,
    },
    type: "field_agg",
  },
];
