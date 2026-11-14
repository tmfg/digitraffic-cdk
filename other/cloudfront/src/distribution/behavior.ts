import {
  AllowedMethods,
  FunctionEventType,
  LambdaEdgeEventType,
} from "aws-cdk-lib/aws-cloudfront";
import type { EndpointMetadata } from "../util/apikey-util.js";
import type { IpRestrictionParameters } from "../util/edgalambda-factory.js";
import { FunctionType } from "../util/function-creator.js";
import { LambdaType } from "../util/lambda-creator.js";

export type OriginType =
  | "s3"
  | "api-gateway"
  | "http"
  | "https"
  | "vpc"
  | "static";

export class Origin {
  readonly _type: OriginType;
  readonly _origin: string;
  readonly _path?: string;

  constructor(type: OriginType, origin: string, path?: string) {
    this._type = type;
    this._origin = origin;
    this._path = path;
  }

  static apiGateway(originUrl: string): Origin {
    return new Origin("api-gateway", originUrl, "/prod");
  }

  static http(originUrl: string): Origin {
    return new Origin("http", originUrl);
  }

  static s3(bucketName: string): Origin {
    return new Origin("s3", bucketName);
  }

  static vpc(vpcOriginName: string): Origin {
    return new Origin("vpc", vpcOriginName);
  }

  /**
   * Origin for the per-environment static files bucket (see
   * `DistributionBuilder.withStaticFiles()`). The origin string is the site
   * name, resolved by the stack to the stack-owned static bucket with
   * `/<site>` as origin path.
   */
  static staticFiles(site: string): Origin {
    return new Origin("static", site, `/${site}`);
  }
}

export type CacheSeconds = 30 | 60 | 120 | 600 | 3600;

export type CacheHeader =
  | "x-api-key"
  | "Authorization"
  | "Accept"
  | "Accept-encoding";

interface LambdaConfig {
  lambdas: Map<LambdaEdgeEventType, LambdaType>;
  functions: Map<FunctionEventType, FunctionType>;

  parameters: {
    pathRemoveCount?: number;
    ipRestriction?: IpRestrictionParameters;
    redirectUrl?: string;
    smRef?: string;

    weathercam?: {
      url: string;
      host: string;
    };
  };
}

export class Behavior {
  readonly behaviorPath: string;
  readonly origin: Origin;

  allowedMethods: AllowedMethods = AllowedMethods.ALLOW_GET_HEAD_OPTIONS;

  apiKey?: string;

  ttl: CacheSeconds = 60; // seconds
  maxCacheTtl?: number;
  readonly cacheHeaders: string[] = [];
  readonly cacheKeys: string[] = [];

  readTimeout: number = 30; // seconds
  connectionAttempts: number = 3;

  lambdaConfig: LambdaConfig = {
    lambdas: new Map(),
    functions: new Map(),
    parameters: {},
  };

  constructor(behaviorPath: string, origin: Origin) {
    this.behaviorPath = behaviorPath;
    this.origin = origin;
  }

  public static redirect(redirectUrl: string): Behavior {
    return new Behavior(
      "*",
      new Origin("https", "www.digitraffic.fi"),
    ).withRedirectFunction(redirectUrl);
  }

  public static apiGateway(path: string, originUrl: string): Behavior;
  public static apiGateway(
    path: string,
    endpointMetadata: EndpointMetadata,
  ): Behavior;

  public static apiGateway(
    path: string,
    param2: string | EndpointMetadata,
  ): Behavior {
    if (typeof param2 === "string") {
      return new Behavior(path, Origin.apiGateway(param2))
        .withGzipRequirementLambda()
        .withHttpHeadersLambda();
    }

    return new Behavior(path, Origin.apiGateway(param2.endpointUrl))
      .withGzipRequirementLambda()
      .withHttpHeadersLambda()
      .withApiKey(param2.apiKey);
  }

  public static apiGatewayPlain(path: string, originUrl: string): Behavior;
  public static apiGatewayPlain(
    path: string,
    endpointMetadata: EndpointMetadata,
  ): Behavior;

  public static apiGatewayPlain(
    path: string,
    param2: string | EndpointMetadata,
  ): Behavior {
    if (typeof param2 === "string") {
      return new Behavior(
        path,
        Origin.apiGateway(param2),
      ).withAllowAllMethods();
    }

    return new Behavior(path, Origin.apiGateway(param2.endpointUrl))
      .withApiKey(param2.apiKey)
      .withAllowAllMethods();
  }

  public static mqtt(originUrl: string): Behavior {
    return new Behavior("mqtt*", Origin.http(originUrl));
  }

  public static mqttVpc(originName: string): Behavior {
    return new Behavior("mqtt*", Origin.vpc(originName));
  }

  public static nginxPlain(path: string, originUrl: string): Behavior {
    return new Behavior(path, Origin.http(originUrl));
  }

  public static nginx(path: string, originUrl: string): Behavior {
    return Behavior.nginxPlain(path, originUrl)
      .withHttpHeadersLambda()
      .withGzipRequirementLambda();
  }

  public static vpcPlain(path: string, originName: string): Behavior {
    return new Behavior(path, Origin.vpc(originName));
  }

  public static vpcLb(path: string, originName: string): Behavior {
    return Behavior.vpcPlain(path, originName)
      .withHttpHeadersLambda()
      .withGzipRequirementLambda();
  }

  public static s3(path: string, bucketName: string): Behavior {
    return new Behavior(path, Origin.s3(bucketName));
  }

  public static swagger(path: string, bucketName: string): Behavior {
    return Behavior.s3(path, bucketName).withIndexHtmlFunction();
  }

  /**
   * Exact-path behavior serving a single file (e.g. `robots.txt`) from the
   * per-environment static files bucket. Content changes are invalidated on
   * deploy, so a long cache TTL is used.
   */
  public static staticFile(fileName: string, site: string): Behavior {
    return new Behavior(fileName, Origin.staticFiles(site)).withCacheTtl(3600);
  }

  public withOAI(): this {
    return this;
  }

  public withoutApiKey(): this {
    this.apiKey = undefined;

    return this;
  }

  public withAllowAllMethods(): this {
    this.allowedMethods = AllowedMethods.ALLOW_ALL;

    return this;
  }

  private addFunction(
    type: FunctionEventType,
    edgeFunction: FunctionType,
  ): this {
    if (this.lambdaConfig.functions.has(type)) {
      throw new Error(
        `${this.behaviorPath} §EdgeFunction already assigned for type ${type}`,
      );
    }

    if (
      (type === FunctionEventType.VIEWER_REQUEST &&
        this.lambdaConfig.lambdas.has(LambdaEdgeEventType.VIEWER_REQUEST)) ||
      (type === FunctionEventType.VIEWER_RESPONSE &&
        this.lambdaConfig.lambdas.has(LambdaEdgeEventType.VIEWER_RESPONSE))
    ) {
      throw new Error(
        `${this.behaviorPath} EdgeLambda already assigned for type ${type}`,
      );
    }

    this.lambdaConfig.functions.set(type, edgeFunction);

    return this;
  }

  private addLambda(type: LambdaEdgeEventType, lambda: LambdaType): this {
    if (this.lambdaConfig.lambdas.has(type)) {
      throw new Error(
        `${this.behaviorPath} Lambda already assigned for type ${type}`,
      );
    }

    if (
      (type === LambdaEdgeEventType.VIEWER_REQUEST &&
        this.lambdaConfig.functions.has(FunctionEventType.VIEWER_REQUEST)) ||
      (type === LambdaEdgeEventType.VIEWER_RESPONSE &&
        this.lambdaConfig.functions.has(FunctionEventType.VIEWER_RESPONSE))
    ) {
      throw new Error(
        `${this.behaviorPath} EdgeFunction already assigned for type ${type}`,
      );
    }

    this.lambdaConfig.lambdas.set(type, lambda);

    return this;
  }

  public withIndexHtmlFunction(): this {
    this.addFunction(FunctionEventType.VIEWER_REQUEST, FunctionType.INDEX_HTML);

    return this;
  }

  public withRedirectFunction(redirectUrl: string): this {
    this.addFunction(FunctionEventType.VIEWER_REQUEST, FunctionType.REDIRECT);

    this.lambdaConfig.parameters.redirectUrl = redirectUrl;

    return this;
  }

  public withIpRestrictionLambda(
    path: string,
    ipList: string,
    eventType: LambdaEdgeEventType = LambdaEdgeEventType.VIEWER_REQUEST,
  ): this {
    this.addLambda(eventType, LambdaType.IP_RESTRICTION);

    this.lambdaConfig.parameters.ipRestriction = { path, ipList };

    return this;
  }

  public withoutGzipRequirementLambda(): this {
    this.lambdaConfig.lambdas.delete(LambdaEdgeEventType.VIEWER_REQUEST);

    return this;
  }

  public withGzipRequirementLambda(
    eventType: LambdaEdgeEventType = LambdaEdgeEventType.VIEWER_REQUEST,
  ): this {
    this.addLambda(eventType, LambdaType.GZIP_REQUIREMENT);

    return this;
  }

  public withHttpHeadersLambda(): this {
    this.addLambda(
      LambdaEdgeEventType.VIEWER_RESPONSE,
      LambdaType.HTTP_HEADERS,
    );

    return this;
  }

  public withHttpHeadersFunction(): this {
    this.addFunction(
      FunctionEventType.VIEWER_RESPONSE,
      FunctionType.HTTP_HEADERS,
    );

    return this;
  }

  public withWeathercamLambdas(
    weathercamHost: string,
    weathercamUrl: string,
  ): this {
    this.addLambda(
      LambdaEdgeEventType.ORIGIN_REQUEST,
      LambdaType.WEATHERCAM_REDIRECT,
    );
    this.addLambda(
      LambdaEdgeEventType.ORIGIN_RESPONSE,
      LambdaType.WEATHERCAM_HTTP_HEADERS,
    );
    this.addLambda(
      LambdaEdgeEventType.VIEWER_RESPONSE,
      LambdaType.HTTP_HEADERS,
    );

    this.lambdaConfig.parameters.weathercam = {
      host: weathercamHost,
      url: weathercamUrl,
    };

    return this;
  }

  /**
   * Strips leading path parts before the request reaches the origin.
   *
   * Use when the public path carries a prefix the origin does not know about, typically an S3
   * bucket served under a subpath. With `pathPartsToRemove = 1`:
   * `/tmc/certified/data.zip` -> object key `certified/data.zip`.
   *
   * @param pathPartsToRemove how many leading path segments to drop, one per prefix level
   */
  public withRemovePathFunction(pathPartsToRemove: number): Behavior {
    this.addFunction(
      FunctionEventType.VIEWER_REQUEST,
      FunctionType.PATH_REWRITE,
    );

    this.lambdaConfig.parameters.pathRemoveCount = pathPartsToRemove;

    return this;
  }

  /**
   * Removes leading URI path segments and serves `index.html` for directory requests.
   *
   * Use when an S3 bucket is published below a CloudFront path prefix and the bucket also hosts
   * a static browser for that prefix. The origin request lambda first removes the configured
   * number of leading URI path segments, usually the public CloudFront prefix, before the request
   * reaches S3. If the remaining path ends in `/`, it appends `index.html` so directory navigation
   * loads the static page.
   *
   * S3 `ListObjectsV2` requests are the exception: when the query string contains `list-type=2`,
   * the request is passed to S3 without appending `index.html`. This lets the static browser call
   * the bucket listing API on the same public path.
   *
   * With `pathPartsToRemove = 1`, the leading `/roadnetwork` segment is removed:
   * - `/roadnetwork/assets/app.js` -> object key `assets/app.js`
   * - `/roadnetwork/latest/data.zip` -> object key `latest/data.zip`
   * - `/roadnetwork/` -> object key `index.html`
   * - `/roadnetwork/latest/` -> object key `latest/index.html`
   * - `/roadnetwork/?list-type=2&delimiter=/&prefix=latest/` -> S3 bucket listing request for
   *   prefix `latest/`
   *
   * Implemented as an origin-request lambda, not a viewer-request CloudFront Function: the
   * latter runs before the cache lookup, so its URI rewrite also becomes part of the cache key.
   * Two behaviors on different origins that strip down to the same relative path (as any two
   * users of this method with the same `pathPartsToRemove` will) would then collide into the
   * same cache entry. Origin-request lambdas run only after the cache decision, which is always
   * made from the original, distinct request path.
   *
   * @param pathPartsToRemove how many leading URI path segments to remove, one per prefix level
   */
  public withDirectoryIndexFunction(pathPartsToRemove: number): Behavior {
    this.addLambda(
      LambdaEdgeEventType.ORIGIN_REQUEST,
      LambdaType.DIRECTORY_INDEX,
    );

    this.lambdaConfig.parameters.pathRemoveCount = pathPartsToRemove;

    return this;
  }

  public withLamLambdas(smRef: string): this {
    this.addLambda(LambdaEdgeEventType.ORIGIN_REQUEST, LambdaType.LAM_REDIRECT);
    this.addLambda(LambdaEdgeEventType.ORIGIN_RESPONSE, LambdaType.LAM_HEADERS);
    this.addLambda(
      LambdaEdgeEventType.VIEWER_RESPONSE,
      LambdaType.HTTP_HEADERS,
    );

    this.lambdaConfig.parameters.smRef = smRef;

    return this;
  }

  public removeViewerResponseLambda(): this {
    this.lambdaConfig.lambdas.delete(LambdaEdgeEventType.VIEWER_RESPONSE);

    return this;
  }

  public removeViewerRequestFunction(): this {
    this.lambdaConfig.functions.delete(FunctionEventType.VIEWER_REQUEST);

    return this;
  }

  public withApiKey(apiKey: string): this {
    this.apiKey = apiKey;

    return this;
  }

  /**
   * Default TTL: how long CloudFront keeps a response that has no
   * Cache-Control or Expires header. The origin's max-age is used when
   * present, but never longer than the max TTL (see withCacheMaxTtl).
   * Default: 60 seconds.
   */
  public withCacheTtl(ttl: CacheSeconds): this {
    this.ttl = ttl;

    return this;
  }

  /**
   * Maximum time CloudFront keeps a response, whatever the origin's
   * Cache-Control max-age says. By default it equals the TTL, so set it
   * separately when the origin sends a longer max-age.
   * Default: same as the TTL (see withCacheTtl).
   */
  public withCacheMaxTtl(ttl: number): this {
    this.maxCacheTtl = ttl;

    return this;
  }

  /**
   * Only the listed query parameters are part of the cache key; other
   * parameters do not split the cache. For example with "language",
   * `?language=fi&x=1` and `?language=fi&x=2` share one cached response,
   * but `?language=en` does not.
   * Unlisted parameters are still forwarded to http, https, vpc and
   * api-gateway origins, but not to s3 and static origins: only the
   * parameters listed here reach those.
   * Default: all query parameters are part of the cache key.
   */
  public withQueryCacheKeys(...keys: string[]): this {
    this.cacheKeys.push(...keys);

    return this;
  }

  /**
   * Adds request headers to the cache key: each different header value is
   * cached separately, so add one only when the response depends on it.
   * Default: no headers (Accept-Encoding is always included, because
   * compression is on).
   */
  public withCacheHeaders(...headers: CacheHeader[]): this {
    this.cacheHeaders.push(...headers);

    return this;
  }

  /**
   * How long CloudFront waits for the origin's response (and between response
   * packets) before it gives up. A timed out GET or HEAD request is retried
   * according to withConnectionAttempts.
   * Default: 30 seconds.
   */
  public withReadTimeout(seconds: number): this {
    this.readTimeout = seconds;

    return this;
  }

  /**
   * How many times CloudFront tries to reach the origin (1-3). Applies to
   * failed connections and, for GET and HEAD requests, to read timeouts, so
   * a slow origin may get the same request several times.
   * Default: 3.
   */
  public withConnectionAttempts(attempts: number): this {
    this.connectionAttempts = attempts;

    return this;
  }
}
