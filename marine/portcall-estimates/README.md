# Portcall estimates & subscriptions

In order to run tests with `npm run test` you need to set up:
- The local database from the [digitraffic-marine project](https://github.com/tmfg/digitraffic-marine).
- The *java* executable on your PATH needed by dynamodb-local

The DynamoDB table PortcallEstimates.SubscriptionInfo requires a manual insertion of the following item in order for updates to work:  
```{ ID: 1, SmsSentAmount: 0 }```