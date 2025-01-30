import type { StackProps } from "aws-cdk-lib";

export interface RataProps extends StackProps {
  common: {
    ecsClusterArn: string;
    vpcId: string;
  };
  avoinData: {
    database: {
      securityGroupId: string;
      clusterId: string;
    };
    server: {
      ecrRepo: string;
      taskDefinitionArn: string;
      serviceArn: string;
    };
    updater: {
      ecrRepo: string;
      taskDefinitionArn: string;
      serviceArn: string;
      ecsTaskRoleArn: string;
    };
    graphQL: {
      ecrRepo: string;
      taskDefinitionArn: string;
      serviceArn: string;
    };
  };

  trainHistory: {
    database: {
      securityGroupId: string;
      clusterId: string;
    };
    web: {
      ecrRepo: string;
      taskDefinitionArn: string;
      serviceArn: string;
    };
    backend: {
      ecrRepo: string;
      taskDefinitionArn: string;
      serviceArn: string;
    };
    updater: {
      ecrRepo: string;
      taskDefinitionArn: string;
      serviceArn: string;
    };
  };
  nginx: {
    ecrRepo: string;
    taskDefinitionArn: string;
    serviceArn: string;
  };
}
