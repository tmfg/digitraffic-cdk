# Digitraffic Open311

### CDK setup
* set the environment variable AWS_PROFILE to point to your destination account profile
* create a copy of the bin/example-props.ts file, name this file dont-commit-this-props-<your_profile_name>.ts
* configure the aforementioned file

In order to run tests with `npm run test` you need to set up the local database from the [digitraffic-road project](https://github.com/tmfg/digitraffic-road).