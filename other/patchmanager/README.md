# Digitraffic Patch Manager stack
Updates EC2 instances to AWS patch baseline in a scheduled maintenance window

## Installation
The EC2 instance needs to have an instance profile with the managed policy AmazonSSMManagedInstanceCore associated to it.

Using Patch Manager requires installing the Systems Manager (SSM) Agent.  
Install it by running this on the EC2 instance (note the region and architecture):
```
sudo yum install -y https://s3.eu-west-1.amazonaws.com/amazon-ssm-eu-west-1/latest/linux_amd64/amazon-ssm-agent.rpm

# check that the agent started successfully
sudo cat /var/log/amazon/ssm/amazon-ssm-agent.log
```
