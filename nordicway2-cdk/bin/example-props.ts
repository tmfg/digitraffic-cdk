import {NW2Props} from "../lib/app-props";

const props: NW2Props = {
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
    integration: {
        username: 'username',
        password: 'password',
        url: 'http://some.url'
    },
    private: true
};
export default props;
