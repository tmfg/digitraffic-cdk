# Digitraffic Monitoring stack
This stack creates tools for monitoring for an environment.  All stacks create two SNS-topics, 
one for warnings and other for alarms.  Topic ARNs are stored in AWS System Managers Parameter Store, so other 
stacks can retrieve them from there.

## Configuration
Stack can also be configured to create monitoring for db and mqtt.  Please see MonitoringConfiguration for more
information.  For each measure a new alarm is created and if alarm is triggered a message will be send to alarm-topic.

### Db-configuration
Currently the following is monitored:
* max cpu usage
* max writeIOPS
* max readIOPS
* max volumeWriteIOPS
* max volumeReadIOPS
* min free memory (200 MiB)
* deadlocks (1)

### Mqtt-configuration
Currently the following is monitored:
* max cpu usage
* max heap usage
* max network out

## Installation

Cdk bootstrap needst to be done for both regions `eu-west-1` and `us-east-1` i.e.
```
npx cdk@latest bootstrap aws://<accountnum>/eu-west-1
npx cdk@latest bootstrap aws://<accountnum>/us-east-1
 
```

And diff / deploy 
```
../../scripts/cdk-diff-and-deploy.sh <project>-<test|pro> <diff|deploy> 
```

Topics created by the stack can be found from AWS console at Amazon SNS
Topics
