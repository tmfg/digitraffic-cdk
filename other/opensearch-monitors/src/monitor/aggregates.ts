export interface TermsAggregate {
  [name: string]: {
    terms: {
      field: string;
    };
    aggregations?: BucketAggregate | TermsAggregate;
  };
}

export interface BucketAggregate {
  [name: string]: {
    bucket_selector?: {
      buckets_path: { [name: string]: string };
      script: string;
    };
  };
}

export interface AggregateFilter {
  name: string;
  bucketPaths: { [name: string]: string };
  script: string;
}
