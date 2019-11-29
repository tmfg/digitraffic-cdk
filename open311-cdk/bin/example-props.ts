///<reference path="../lib/app-props.d.ts"/>

const props: Props = {
    vpcId: 'some-vpc-id',
    privateSubnetIds: ['some-subnet-id',],
    availabilityZones: ['some-az1'],
    lambdaDbSgId: 'sg-xxxxxxxxx',
    dbProps: {
        username: 'someuser',
        password: 'somepass',
        uri: 'someurl:5432/someschema'
    }
};
export default props;
