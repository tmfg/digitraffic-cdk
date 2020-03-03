import {LambdaConfiguration} from "../../common/stack/lambda-configs";

const props: LambdaConfiguration = {
    vpcId: 'some-vpc-id',
    privateSubnetIds: ['some-subnet-id',],
    availabilityZones: ['some-az1'],
    lambdaDbSgId: 'sg-xxxxxxxxx',
    dbProps: {
        username: 'someuser',
        password: 'somepass',
        uri: 'someurl:5432/someschema'
    },
    defaultLambdaDurationSeconds: 10,
    logsDestinationArn: 'something-something',
    private: true
};
export default props;
