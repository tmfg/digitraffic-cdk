import type { Stack } from "aws-cdk-lib";
import {
  CompositePrincipal,
  ManagedPolicy,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import type { IVersion } from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";
import {
  createDirectoryIndex,
  createGzipRequirement,
  createHttpHeaders,
  createIpRestriction,
  createLamHeaders,
  createLamRedirect,
  createWeathercamHttpHeaders,
  createWeathercamRewrite,
} from "./lambda-creator.js";

export interface IpRestrictionParameters {
  readonly path: string;
  readonly ipList: string;
}

export class EdgeLambdaFactory {
  readonly _lambdaMap: Record<string, IVersion> = {};

  readonly _role: Role;
  readonly _scope: Construct;

  constructor(stack: Stack) {
    this._scope = stack;

    this._role = new Role(stack, "edgeLambdaRole", {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("lambda.amazonaws.com"),
        new ServicePrincipal("edgelambda.amazonaws.com"),
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });
  }

  getLambda(key: string, creator: () => IVersion): IVersion {
    if (!this._lambdaMap[key]) {
      this._lambdaMap[key] = creator();
    }

    return this._lambdaMap[key];
  }

  getLamHeadersLambda(): IVersion {
    return this.getLambda("lamheaders", () =>
      createLamHeaders(this._scope, this._role),
    );
  }

  getWeathercamHeadersLambda(): IVersion {
    return this.getLambda("weathercam-headers", () =>
      createWeathercamHttpHeaders(this._scope, this._role),
    );
  }

  getWeathercamRewriteLambda(
    weathercamHost: string,
    weathercamUrl: string,
  ): IVersion {
    return this.getLambda("weathercam-rewrite", () =>
      createWeathercamRewrite(
        this._scope,
        this._role,
        weathercamUrl,
        weathercamHost,
      ),
    );
  }

  getLamRedirectLambda(smRef: string): IVersion {
    const key = `lam-redirect_${smRef}`;

    return this.getLambda(key, () =>
      createLamRedirect(this._scope, this._role, smRef),
    );
  }

  getHttpHeadersLambda(): IVersion {
    return this.getLambda("httpheaders", () =>
      createHttpHeaders(this._scope, this._role),
    );
  }

  getGzipRequirementLambda(): IVersion {
    return this.getLambda("gzip", () =>
      createGzipRequirement(this._scope, this._role),
    );
  }

  getIpRestrictionLambda(params: IpRestrictionParameters): IVersion {
    const key = `iprestriction_${params.path}`;

    return this.getLambda(key, () =>
      createIpRestriction(this._scope, this._role, params.path, params.ipList),
    );
  }

  /**
   * `pathRemoveCount` is baked into the deployed lambda body at synth time, not read at request
   * time - Lambda@Edge code is a static bundle, so `createDirectoryIndex()` text-replaces the
   * `EXT_PATHS_TO_REMOVE` placeholder with the literal number before deploying, e.g. calling this
   * with `1` deploys a lambda whose body effectively contains
   * `Number.parseInt("1", 10)` where the placeholder used to be.
   *
   * That same number is also the dedup key (`directoryindex_${pathRemoveCount}`), so e.g.
   * `Behavior.s3("tmc/*", "tmc-road-prod").withDirectoryIndexFunction(1)` and
   * `Behavior.s3("roadnetwork/*", "roadnetwork-prod").withDirectoryIndexFunction(1)` both call
   * `getDirectoryIndexLambda(1)` and end up sharing one single deployed lambda, which:
   * - passes plain file requests through unchanged after stripping the prefix, e.g.
   *   `/tmc/assets/app.js` -> `assets/app.js`, `/roadnetwork/assets/app.js` -> `assets/app.js`;
   * - and, for the "directory index" part this method is named after, appends `index.html` to
   *   any request left ending in `/` after stripping, e.g. `/tmc/` -> `index.html`,
   *   `/roadnetwork/` -> `index.html`.
   *
   * CloudFront still fetches each from the correct bucket in both cases, since origin selection
   * already happened based on which `PathPattern` matched, before this lambda ever runs.
   */
  getDirectoryIndexLambda(pathRemoveCount: number): IVersion {
    const key = `directoryindex_${pathRemoveCount}`;

    return this.getLambda(key, () =>
      createDirectoryIndex(this._scope, this._role, pathRemoveCount),
    );
  }
}
