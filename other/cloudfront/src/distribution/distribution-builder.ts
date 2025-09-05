import type { WafRules } from "../acl/waf-rules.js";
import type { CloudfrontCdkStack2 } from "../cloudfront-cdk-stack2.js";
import type { Behavior } from "./behavior.js";

export class DistributionBuilder {
  private readonly _stack: CloudfrontCdkStack2;

  readonly name: string;
  readonly certificate: string;

  readonly aliasNames: string[] = [];
  readonly wafRules: WafRules[] = [];
  readonly behaviors: Behavior[] = [];

  defaultRootObject: string = "index.html";

  logConfig: string;
  logicalId?: string;

  readonly vpcOrigins: Record<string, string> = {};

  public constructor(
    stack: CloudfrontCdkStack2,
    name: string,
    certificate: string,
  ) {
    this._stack = stack;
    this.name = name;
    this.certificate = certificate;
  }

  public findDefaultBehavior(): Behavior {
    const defaults = this.behaviors.filter((b) => b.behaviorPath === "*");

    if (defaults.length > 1) {
      throw new Error("Too many default behaviors defined for " + this.name);
    }

    if (defaults[0]) {
      return defaults[0];
    }

    throw new Error("No default behavior defined for " + this.name);
  }

  public build(): CloudfrontCdkStack2 {
    return this._stack;
  }

  public withLogicalId(id: string): this {
    this.logicalId = id;

    return this;
  }

  public withAliasName(...names: string[]): this {
    this.aliasNames.push(...names);

    return this;
  }

  public withVpcOrigin(name: string, vpcOrigin: string): this {
    this.vpcOrigins[name] = vpcOrigin;

    return this;
  }

  public withDefaultRootObject(rootObject: string): this {
    this.defaultRootObject = rootObject;

    return this;
  }

  public withLogConfig(logConfigArn: string): this {
    this.logConfig = logConfigArn;

    return this;
  }

  withAclRule(...wafRules: WafRules[]): this {
    this.wafRules.push(...wafRules);

    return this;
  }

  withBehaviors(...behaviors: Behavior[]): this {
    this.behaviors.push(...behaviors);

    return this;
  }
}
