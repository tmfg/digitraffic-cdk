import {AtonProps} from "../lib/app-props";

const props: AtonProps = {
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
    private: true,
    integrations: [
        { domain: 'C_NA', url: 'integrationurl' }
    ]
};
export default props;
