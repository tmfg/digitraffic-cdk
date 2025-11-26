import { createHash } from "node:crypto";
import { Duration } from "aws-cdk-lib";
import {
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
} from "aws-cdk-lib/aws-cloudfront";
import type { Construct } from "constructs";
import type { CacheSeconds } from "../distribution/behavior.js";

export class CachePolicyFactory {
  readonly _cacheMap: Record<string, CachePolicy> = {};
  readonly _scope: Construct;

  constructor(scope: Construct) {
    this._scope = scope;
  }

  getCachePolicy(
    ttl: CacheSeconds,
    headers: string[],
    keys: string[],
  ): CachePolicy {
    const key = createHash("sha256")
      .update(`${ttl}_${JSON.stringify(headers)}_${JSON.stringify(keys)}`)
      .digest("hex");

    if (!this._cacheMap[key]) {
      this._cacheMap[key] = this.createCache(ttl, key, headers, keys);
    }

    return this._cacheMap[key];
  }

  private createCache(
    ttl: CacheSeconds,
    key: string,
    cacheHeaders: string[],
    cacheKeys: string[],
    enableCompression: boolean = true,
  ): CachePolicy {
    return new CachePolicy(this._scope, `Cache-${ttl}-${key}`, {
      minTtl: Duration.seconds(0),
      maxTtl: Duration.seconds(ttl),
      defaultTtl: Duration.seconds(ttl),
      headerBehavior: CacheHeaderBehavior.allowList(...cacheHeaders),
      // compression is enabled for CloudFront behaviors by default - enable compression support by default also here
      // enabling compression support for the cache will automatically include "accept-encoding" in the cache key
      enableAcceptEncodingGzip: enableCompression,
      enableAcceptEncodingBrotli: enableCompression,
      queryStringBehavior:
        cacheKeys.length > 0
          ? CacheQueryStringBehavior.allowList(...cacheKeys)
          : CacheQueryStringBehavior.all(),
    });
  }
}
