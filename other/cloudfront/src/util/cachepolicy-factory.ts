import {
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
} from "aws-cdk-lib/aws-cloudfront";
import type { CacheSeconds } from "../distribution/behavior.js";
import { createHash } from "node:crypto";
import { Duration } from "aws-cdk-lib";
import type { Construct } from "constructs";

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
    const key = createHash("sha256").update(
      `${ttl}_${JSON.stringify(headers)}_${JSON.stringify(keys)}`,
    ).digest("hex");

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
  ): CachePolicy {
    // always use accept-encoding
    const cachedHeaders = ["accept", "accept-encoding", "accept-language"];
    cachedHeaders.push(...cacheHeaders);

    return new CachePolicy(this._scope, `Cache-${ttl}-${key}`, {
      minTtl: Duration.seconds(0),
      maxTtl: Duration.seconds(ttl),
      defaultTtl: Duration.seconds(ttl),
      headerBehavior: CacheHeaderBehavior.allowList(...cachedHeaders),
      queryStringBehavior: cacheKeys.length > 0
        ? CacheQueryStringBehavior.allowList(...cacheKeys)
        : CacheQueryStringBehavior.all(),
    });
  }
}
