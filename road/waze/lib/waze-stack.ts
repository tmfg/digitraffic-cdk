import {Stack, Construct, StackProps, Duration} from '@aws-cdk/core';
import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {Props} from './app-props'
import {Bucket} from '@aws-cdk/aws-s3';
import {RetentionDays} from '@aws-cdk/aws-logs';
import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {createSubscription} from '../../../common/stack/subscription';
import {Effect, PolicyStatement} from '@aws-cdk/aws-iam';
import {KEY_BUCKET_NAME, KEY_ENDPOINT_URL, KEY_REGION} from "./lambda/update-wazedata/lambda-update-waze";

export class WazeStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, 'WazeBucket', {
            bucketName: appProps.bucketName
        });

        const lambda = this.createLambda(bucket, appProps);
    }

    private createLambda(bucket: Bucket, props: Props) {
        const functionName = 'Waze-Update';
        const environment = {} as any;
        environment[KEY_BUCKET_NAME] = bucket.bucketName;
        environment[KEY_REGION] = this.region;
        environment[KEY_ENDPOINT_URL] = props.endpointUrl;
        const lambdaConf = {
            functionName: functionName,
            code: new AssetCode('dist/lambda'),
            handler: 'lambda-update-waze.handler',
            runtime: Runtime.NODEJS_12_X,
            memorySize: 128,
            timeout: Duration.seconds(props.defaultLambdaDurationSeconds),
            environment,
            logRetention: RetentionDays.ONE_YEAR,
        };

        const updateWazeLambda = new Function(this, 'UpdateWazeLambda', lambdaConf);

        const rule = new Rule(this, 'UpdateWazeRule', {
            ruleName: 'UpdateWazeRule',
            schedule: Schedule.rate(Duration.minutes(1))
        });
        rule.addTarget(new LambdaFunction(updateWazeLambda));

        const statement = new PolicyStatement();
        statement.addActions('s3:PutObject');
        statement.addActions('s3:PutObjectAcl');
        statement.addResources(bucket.bucketArn + '/*');
        updateWazeLambda.addToRolePolicy(statement);

        createSubscription(updateWazeLambda, functionName, props.logsDestinationArn, this);
    }
}
