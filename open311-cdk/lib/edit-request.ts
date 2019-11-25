import {MockIntegration, PassthroughBehavior} from "@aws-cdk/aws-apigateway";

export default new MockIntegration({
    passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
    requestTemplates: {
        'application/json': JSON.stringify({statusCode: 200})
    },
    integrationResponses: [
        {
            statusCode: '200'
        }
    ]
})