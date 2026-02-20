import {
  AllowedMethods,
  FunctionEventType,
  LambdaEdgeEventType,
} from "aws-cdk-lib/aws-cloudfront";
import type { EndpointMetadata } from "../util/apikey-util.js";
import type { IpRestrictionParameters } from "../util/edgalambda-factory.js";
import { FunctionType } from "../util/function-creator.js";
import { LambdaType } from "../util/lambda-creator.js";

export type OriginType = "s3" | "api-gateway" | "http" | "https" | "vpc";

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
}

export type CacheSeconds = 30 | 60 | 120 | 600;

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
  readonly cacheHeaders: string[] = [];
  readonly cacheKeys: string[] = [];

  readTimeout: number = 30; // seconds

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

  public static nginxPlain(path: string, originUrl: string): Behavior {
    return new Behavior(path, Origin.http(originUrl));
  }

  public static nginx(path: string, originUrl: string): Behavior {
    return Behavior.nginxPlain(path, originUrl)
      .withHttpHeadersLambda()
      .withGzipRequirementLambda();
  }

  public static vpcLb(path: string, originName: string): Behavior {
    return new Behavior(path, Origin.vpc(originName));
  }

  public static s3(path: string, bucketName: string): Behavior {
    return new Behavior(path, Origin.s3(bucketName));
  }

  public static swagger(path: string, bucketName: string): Behavior {
    return Behavior.s3(path, bucketName).withIndexHtmlFunction();
  }

  public withOAI(): this {
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
      throw new Error(`EdgeFunction already assigned for type ${type}`);
    }

    if (
      (type === FunctionEventType.VIEWER_REQUEST &&
        this.lambdaConfig.lambdas.has(LambdaEdgeEventType.VIEWER_REQUEST)) ||
      (type === FunctionEventType.VIEWER_RESPONSE &&
        this.lambdaConfig.lambdas.has(LambdaEdgeEventType.VIEWER_RESPONSE))
    ) {
      throw new Error(`EdgeLambda already assigned for type ${type}`);
    }

    this.lambdaConfig.functions.set(type, edgeFunction);

    return this;
  }

  private addLambda(type: LambdaEdgeEventType, lambda: LambdaType): this {
    if (this.lambdaConfig.lambdas.has(type)) {
      throw new Error(`Lambda already assigned for type ${type}`);
    }

    if (
      (type === LambdaEdgeEventType.VIEWER_REQUEST &&
        this.lambdaConfig.functions.has(FunctionEventType.VIEWER_REQUEST)) ||
      (type === LambdaEdgeEventType.VIEWER_RESPONSE &&
        this.lambdaConfig.functions.has(FunctionEventType.VIEWER_RESPONSE))
    ) {
      throw new Error(`EdgeFunction already assigned for type ${type}`);
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

  public withRemovePathFunction(count: number): Behavior {
    this.addFunction(
      FunctionEventType.VIEWER_REQUEST,
      FunctionType.PATH_REWRITE,
    );

    this.lambdaConfig.parameters.pathRemoveCount = count;

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

  public withCacheTtl(ttl: CacheSeconds): this {
    this.ttl = ttl;

    return this;
  }

  public withQueryCacheKeys(...keys: string[]): this {
    this.cacheKeys.push(...keys);

    return this;
  }

  public withCacheHeaders(...headers: CacheHeader[]): this {
    this.cacheHeaders.push(...headers);

    return this;
  }

  public withReadTimeout(seconds: number): this {
    this.readTimeout = seconds;

    return this;
  }
}
