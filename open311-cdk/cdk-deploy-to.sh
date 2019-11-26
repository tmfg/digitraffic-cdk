#!/bin/bash
export CDK_DEPLOY_ACCOUNT=$1
shift
export CDK_DEPLOY_REGION=$1
shift
export VPC_ID=$1
shift
export VPC_AZS=$1
shift
export VPC_SUBNETS=$1
shift
cdk deploy
