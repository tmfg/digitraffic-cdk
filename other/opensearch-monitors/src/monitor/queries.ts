export interface ExistsQuery {
  exists: {
    field: string;
  };
}
export interface MustQuery {
  must: Query[];
}

export interface MustNotQuery {
  must_not: Query[];
}

export interface ShouldQuery {
  should: Query[];
  minimum_should_match: number;
}

export interface BoolQuery {
  bool: {
    must: Query[];
    must_not: Query[];
  };
}

export interface BoolOrQuery {
  bool: {
    should: Query[];
  };
}

export interface ScriptedMetric {
  [field: string]: {
    scripted_metric: {
      init_script: string;
      map_script: string;
      combine_script: string;
      reduce_script: string;
    };
  };
}

export interface MatchPhraseQuery {
  match_phrase: {
    [field: string]: { query: string };
  };
}

export interface WildcardQuery {
  wildcard: {
    [field: string]: { value: string };
  };
}

export interface RegExpQuery {
  regexp: {
    [field: string]: { value: string };
  };
}

export interface RangeQuery {
  range: {
    [field: string]: {
      // eslint-disable-next-line @rushstack/no-new-null
      from: string | number | null;
      // eslint-disable-next-line @rushstack/no-new-null
      to: string | number | null;
      include_lower?: boolean;
      include_upper?: boolean;
    };
  };
}

export interface ScriptQuery {
  script: {
    script: string;
  };
}

export interface QueryStringQuery {
  query_string: {
    query: string;
  };
}

export type Query =
  | BoolQuery
  | BoolOrQuery
  | MatchPhraseQuery
  | WildcardQuery
  | RegExpQuery
  | RangeQuery
  | ExistsQuery
  | ScriptQuery
  | QueryStringQuery;

export type Order = "asc" | "desc";

export interface Sort {
  [field: string]: { order: Order };
}
