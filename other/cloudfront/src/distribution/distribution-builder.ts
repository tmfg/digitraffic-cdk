import type { WafRules } from "../acl/waf-rules.js";
import type { CloudfrontCdkStack } from "../cloudfront-cdk-stack.js";
import { Behavior } from "./behavior.js";
import { listStaticFiles } from "./static-files.js";

export class DistributionBuilder {
  private readonly _stack: CloudfrontCdkStack;

  readonly name: string;
  readonly certificate: string | undefined;

  readonly aliasNames: string[] = [];
  readonly wafRules: WafRules[] = [];
  readonly behaviors: Behavior[] = [];

  staticSite?: string;
  readonly staticFiles: string[] = [];

  defaultRootObject: string = "index.html";

  logConfig: string;
  logGroupName?: string;
  logicalId?: string;

  public constructor(
    stack: CloudfrontCdkStack,
    name: string,
    certificate: string | undefined = undefined,
  ) {
    this._stack = stack;
    this.name = name;
    this.certificate = certificate;
  }

  public findDefaultBehavior(): Behavior {
    const defaults = this.behaviors.filter((b) => b.behaviorPath === "*");

    if (defaults.length > 1) {
      throw new Error(`Too many default behaviors defined for ${this.name}`);
    }

    if (defaults[0]) {
      return defaults[0];
    }

    throw new Error(`No default behavior defined for ${this.name}`);
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

  /**
   * Serves every file from `static/common` and `static/<site>` at the root of
   * this distribution (e.g. `/robots.txt`, `/llms.txt`) from the
   * per-environment static files bucket.
   *
   * One exact-path behavior is added per file found at synth time, so adding a
   * new file to the static directories automatically serves it on the next
   * deploy. Site files override common files with the same name. Content is
   * uploaded on deploy and the changed paths are invalidated in CloudFront.
   *
   * All files are served as `text/plain; charset=utf-8`, so the static
   * directories must only contain plain text files.
   */
  withStaticFiles(site: string): this {
    if (this.staticSite) {
      throw new Error(`Static files already configured for ${this.name}`);
    }

    const files = listStaticFiles(site);

    if (files.length === 0) {
      throw new Error(
        `No static files found for site ${site} (checked static/common and static/${site})`,
      );
    }

    this.staticSite = site;
    this.staticFiles.push(...files);

    return this.withBehaviors(
      ...files.map((file) => Behavior.staticFile(file, site)),
    );
  }
}
