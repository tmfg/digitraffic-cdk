export const esQueries = [
    {
        name: "Http req",
        query: {
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "count"
    },
    {
        name: "Http req 200",
        query: {
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:* AND @fields.status:200",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "count"
    },
    {
        name: "Bytes out",
        query: {
            aggs: { agg: { sum: { field: "@fields.body_bytes_sent" } } },
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "agg"
    },
    {
        name: "Unique IPs",
        query: {
            aggs: { agg: { cardinality: { field: "@fields.remote_addr.keyword" } } },
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "agg"
    },
    {
        name: "Top 10 Referers",
        query: {
            aggs: {
                agg: {
                    terms: {
                        field: "@fields.http_referrer.keyword",
                        order: { _count: "desc" },
                        missing: "__missing__",
                        size: 10
                    }
                }
            },
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "field_agg"
    },
    {
        name: "Top 10 digitraffic-users",
        query: {
            aggs: {
                agg: {
                    terms: {
                        field: "@fields.http_digitraffic_user.keyword",
                        order: { _count: "desc" },
                        missing: "__missing__",
                        size: 100
                    }
                }
            },
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "field_agg"
    },
    {
        name: "Top digitraffic-users by bytes",
        query: {
            aggs: {
                agg: {
                    terms: {
                        field: "@fields.http_digitraffic_user.keyword",
                        order: { agg: "desc" },
                        missing: "__missing__",
                        size: 100
                    },
                    aggs: { agg: { sum: { field: "@fields.body_bytes_sent" } } }
                }
            },
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "sub_agg"
    },
    {
        name: "Top 10 User Agents",
        query: {
            aggs: {
                agg: {
                    terms: {
                        field: "@fields.http_user_agent.keyword",
                        order: { _count: "desc" },
                        missing: "__missing__",
                        size: 10
                    }
                }
            },
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "field_agg"
    },
    {
        name: "Top 10 IPs",
        query: {
            aggs: { agg: { terms: { field: "@fields.remote_addr.keyword", size: 10 } } },
            query: {
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "NOT log_line:* AND @transport_type:*",
                                analyze_wildcard: true,
                                time_zone: "Europe/Helsinki"
                            }
                        }
                    ],
                    must_not: [
                        {
                            term: {
                                skip_statistics: true
                            }
                        }
                    ],
                    filter: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: "START_TIME",
                                    lte: "END_TIME",
                                    format: "strict_date_optional_time"
                                }
                            }
                        }
                    ]
                }
            }
        },
        type: "field_agg"
    }
];
