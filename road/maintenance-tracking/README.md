# Digitraffic Road - Maintenance tracking integration

Maintenance tracking integration receives POST-request with tracking JSON, puts it in AWS SQS Queue and saves it to db from there. 
Road application then reads saved data from the db and handles the contents to share it from public API.

# TODO Tests
In order to run tests with `npm run test` you need to set up the local database from the [digitraffic-road project](https://github.com/tmfg/digitraffic-road/tree/develop/dbroad).
