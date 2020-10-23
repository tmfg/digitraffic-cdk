module.exports = {
    tables: [
        {
            TableName: 'PortcallEstimates.Subscription',
            KeySchema: [
                {
                    AttributeName: 'PhoneNumber',
                    KeyType: 'HASH'
                },
                {
                    AttributeName: 'Locode',
                    KeyType: 'RANGE'
                }
            ],
            AttributeDefinitions: [
                {
                    AttributeName: 'PhoneNumber',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'Time',
                    AttributeType: 'S'
                },
                {
                    AttributeName: 'Locode',
                    AttributeType: 'S'
                }],
            ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
            GlobalSecondaryIndexes: [{
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
