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

export interface MatchPhraseQuery {
    match_phrase: {
        [field: string]: { query: string };
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

export type Query = BoolQuery | MatchPhraseQuery | RangeQuery | ExistsQuery | ScriptQuery;

export type Order = "asc" | "desc";

export interface Sort {
    [field: string]: { order: Order };
}
