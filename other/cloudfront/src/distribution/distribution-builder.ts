import type { WafRules } from "../acl/waf-rules.js";
import type { CloudfrontCdkStack } from "../cloudfront-cdk-stack.js";
import type { Behavior } from "./behavior.js";

export class DistributionBuilder {
  private readonly _stack: CloudfrontCdkStack;

  readonly name: string;
  readonly certificate: string;

  readonly aliasNames: string[] = [];
  readonly wafRules: WafRules[] = [];
  readonly behaviors: Behavior[] = [];

  defaultRootObject: string = "index.html";

  logConfig: string;
  logGroupName?: string;
  logicalId?: string;

  readonly vpcOrigins: Record<string, string> = {};

  public constructor(
    stack: CloudfrontCdkStack,
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

  public build(): CloudfrontCdkStack {
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

  public withLogGroupName(name: string): this {
    this.logGroupName = name;

    return this;
  }

  withAclRule(...wafRules: WafRules[]): this {
    // clear array - rules can be set at the stack level, but if we also set them here,
    // then previous ones should be overridden since duplicate rules will fail deployment
    this.wafRules.length = 0;
    this.wafRules.push(...wafRules);

    return this;
  }

  withBehaviors(...behaviors: Behavior[]): this {
    this.behaviors.push(...behaviors);

    return this;
  }
}
