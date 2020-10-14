# Digitraffic Road - Maintenance tracking integration

Maintenance tracking integration receives POST-request with tracking JSON, puts it in AWS SQS Queue and saves it to db from there. 
Road application then reads saved data from the db and handles the contents to share it from public API.

# Setup env
* `. cdk-set-env-test.sh` Sets environment variables to road test.
* `~/.aws/bin/digitraffic_mfa_aws.sh <mfa-token>` Init mfa session. 

# Tests
In order to run tests with `npm run test` you need to set up the local database from the [digitraffic-road project](https://github.com/tmfg/digitraffic-road/tree/develop/dbroad).


Maintenance Tracking huippu data sisään on ollut 4000/5min -> 4000/5/60=14/s