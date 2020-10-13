module.exports = {
    tables: [
        {
            TableName: 'PortcallEstimates.Subscriptions',
            KeySchema: [{AttributeName: 'ID', KeyType: 'HASH'}],
            AttributeDefinitions: [
                {
                    AttributeName: 'ID',
                    AttributeType: 'S'
                }, {
                    AttributeName: 'PhoneNumber',
                    AttributeType: 'S'
                }, {
                    AttributeName: 'Time',
                    AttributeType: 'S'
                }],
            ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
            GlobalSecondaryIndexes: [{
                IndexName: 'PortcallEstimateSubscriptions_PhoneNumber_Idx',
                KeySchema: [{
                    AttributeName: 'PhoneNumber',
                    KeyType: 'HASH'
                }],
                Projection: {
                    ProjectionType: 'ALL'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                }
            }, {
                IndexName: 'PortcallEstimateSubscriptions_Time_Idx',
                KeySchema: [{
                    AttributeName: 'Time',
                    KeyType: 'HASH'
                }],
                Projection: {
                    ProjectionType: 'ALL'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                }
            }]
        }
    ],
};
