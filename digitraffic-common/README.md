# Digitraffic-common
This is a place for common utilities and classes that can be used in other cdk-projects.

## How to use
In package.json dependencies:
```
  "dependencies": {
    "digitraffic-common": "*",
  }
```

In code:
```
import {DigitrafficStack, StackConfiguration} from "digitraffic-common/stack/stack";
```

### DigitrafficStack
If you extend your stack from DigitrafficStack you get many benefits:
* Secret, VPC, Sg & alarmTopics automatically
* Stack validation with StackCheckingAspect
* Easier configuration with StackConfiguration

### StackConfiguration
Some commonly used parameters is predefined configuration.  You can write configuration for your
environments once and use across cdk-projects.

### StackCheckingAspect
Uses cdk aspects to do some sanity checking for your cdk stack:
* Stack naming check(Test/Prod in name)
* Function configuration(memory, timeout, runtime, reservedConcurrency)
* Tags, must have Solution tag defined
* S3 Buckets, no public access

You can use StackCheckingAspect for any stack, DigitrafficStack does it automatically, but you can call it manually:
```
Aspects.of(this).add(StackCheckingAspect.create(this));
```