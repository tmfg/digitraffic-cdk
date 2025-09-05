import type { IVersion } from "aws-cdk-lib/aws-lambda";
import {
  createGzipRequirement,
  createHttpHeaders,
  createIpRestriction,
  createLamHeaders,
  createLamRedirect,
  createWeathercamHttpHeaders,
  createWeathercamRewrite,
} from "./lambda-creator.js";
import type { Construct } from "constructs";
import {
  CompositePrincipal,
  ManagedPolicy,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import type { Stack } from "aws-cdk-lib";

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
      createLamHeaders(
        this._scope,
        this._role,
      ));
  }

  getWeathercamHeadersLambda(): IVersion {
    return this.getLambda(
      "weathercam-headers",
      () => createWeathercamHttpHeaders(this._scope, this._role),
    );
  }

  getWeathercamRewriteLambda(
    weathercamHost: string,
    weathercamUrl: string,
  ): IVersion {
    return this.getLambda(
      "weathercam-rewrite",
      () =>
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
      createLamRedirect(
        this._scope,
        this._role,
        smRef,
      ));
  }

  getHttpHeadersLambda(): IVersion {
    return this.getLambda("httpheaders", () =>
      createHttpHeaders(
        this._scope,
        this._role,
      ));
  }

  getGzipRequirementLambda(): IVersion {
    return this.getLambda("gzip", () =>
      createGzipRequirement(
        this._scope,
        this._role,
      ));
  }

  getIpRestrictionLambda(params: IpRestrictionParameters): IVersion {
    const key = `iprestriction_${params.path}`;

    return this.getLambda(key, () =>
      createIpRestriction(
        this._scope,
        this._role,
        params.path,
        params.ipList,
      ));
  }
}
