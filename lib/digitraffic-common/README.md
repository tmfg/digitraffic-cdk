# Digitraffic-common

This is a place for common utilities and classes that can be used in other
cdk-projects.

## Setup

Initialize the project scripts by running the following command. This only needs
to be done once, after cloning or pulling the repository for the first time. It
will install/reinstall lefthook git hooks.

```shell
pnpm run setup
```

After that approve esbuild:

```shell
pnpm approve-builds
```

And then run again the setup.

## How to build

Use `pnpm` to build the code i.e.

    pnpm install
    pnpm build
    pnpm test
    pnpm test --test-path-pattern 'dt-logger.test'
    pnpm test:watch
    pnpm test:watch --test-path-pattern 'dt-logger.test'

Format code

    pnpm format:check # Checks all files
    pnpm format:check-staged # Checks stagged files
    pnpm format:fix # Format all files
    pnpm format:fix-staged # Formats stagged files

## Update deps

To update all dependencies to the latest versions allowed by your semver ranges:

```bash
pnpm up
```

If you want to ignore the version ranges in package.json and install the
absolute latest versions:

```bash
pnpm up --latest
```

## How to use

In package.json dependencies:

```
"dependencies": {
  "@digitraffic/common": "*",
}
```

In code:

```
import {DigitrafficStack, StackConfiguration} from "@digitraffic/common/dist/aws/infra/stack/stack";
```

### DigitrafficStack

If you extend your stack from DigitrafficStack you get many benefits:

- Secret, VPC, Sg & alarmTopics automatically
- Stack validation with StackCheckingAspect
- Easier configuration with StackConfiguration

If you do not need those things, you should not use DigitrafficStack.

### StackConfiguration

Some commonly used parameters is predefined configuration. You can write
configuration for your environments once and use across cdk-projects.

### StackCheckingAspect

Uses cdk aspects to do some sanity checking for your cdk stack:

- Stack naming check(Test/Prod in name)
- Function configuration(memory, timeout, runtime, reservedConcurrency)
- Tags, must have Solution tag defined
- S3 Buckets, no public access
- Api Gateway resource casing(kebabCase and snake_case)
- Queue encrypting
- LogGroup Retention

You can use StackCheckingAspect for any stack, DigitrafficStack does it
automatically, but you can call it manually:

```
Aspects.of(this).add(StackCheckingAspect.create(this));
```

Any resource can be whitelisted by giving it as a parameter or in the
StackConfiguration

### MonitoredFunction

MonitoredFunction extends Function with alarms on memory usage and timeouts.

If you need database access in your Function, you can use MonitoredDBFunction.
Creating a Function with it is this easy:

```
const lambda = MonitoredDBFunction.create(stack, 'get-metadata');
```

See the documentation for more information.
