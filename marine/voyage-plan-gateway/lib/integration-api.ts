/**
 * This API Gateway instance uses a custom domain name with mutual TLS which refers to a PEM formatted truststore.
 * The truststore resides in a bucket which must be created before the custom domain name is created.
 * To achieve this follow these steps:
 * 1. Comment out the DomainName creation.
 * 2. From the now commented-out DomainName block, move the Bucket creation outside the commented block.
 * 3. Deploy the stack.
 * 4. Upload the truststore file to the newly created bucket.
 * 5. Uncomment the DomainName and move the bucket reference back.
 * 6. Deploy the stack.
 */

import {
    DomainName,
    EndpointType,
    GatewayResponse,
    MethodLoggingLevel,
    Model,
    PassthroughBehavior, RequestAuthorizer,
    Resource,
    ResponseType,
    RestApi, SecurityPolicy
} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function, Runtime} from '@aws-cdk/aws-lambda';
import {Construct, Duration} from "@aws-cdk/core";
import {createSubscription} from "../../../common/stack/subscription";
import {defaultLambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {KEY_SECRET_ID} from "./lambda/upload-voyage-plan/lambda-upload-voyage-plan";
import {VoyagePlanGatewayProps} from "./app-props";
import {
    defaultIntegration,
    methodResponse,
} from "../../../common/api/responses";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {MediaType} from "../../../common/api/mediatypes";
import {MessageModel} from "../../../common/api/response";
import {addQueryParameterDescription, addTagsAndSummary} from "../../../common/api/documentation";
import {IVpc} from "@aws-cdk/aws-ec2";
import {
    add404Support,
    createDefaultPolicyDocument,
} from "../../../common/api/rest_apis";
import {Bucket} from "@aws-cdk/aws-s3";
import {Certificate} from "@aws-cdk/aws-certificatemanager";
import {IAuthorizer} from "@aws-cdk/aws-apigateway/lib/authorizer";
import {RetentionDays} from "@aws-cdk/aws-logs";

export function create(
    secret: ISecret,
    vpc: IVpc,
    props: VoyagePlanGatewayProps,
    stack: Construct) {

    const integrationApi = createRestApi(
        stack,
        'VPGW-Integration',
        'VPGW integration API',
        props);
    // set response for missing auth token to 501 as desired by API registrar
    new GatewayResponse(stack, 'MissingAuthenticationTokenResponse', {
        restApi: integrationApi,
        type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
        statusCode: '501',
        templates: {
            'application/json': 'Not implemented'
        }
    });
    createUsagePlan(integrationApi, 'VPGW CloudFront API Key', 'VPGW Faults CloudFront Usage Plan');
    const messageResponseModel = integrationApi.addModel('MessageResponseModel', MessageModel);
    const resource = integrationApi.root.addResource("vpgw")
    createUploadVoyagePlanHandler(messageResponseModel, secret, stack, resource, vpc, props);
}

function createRestApi(stack: Construct, apiId: string, apiName: string, props: VoyagePlanGatewayProps): RestApi {
    const restApi = new RestApi(stack, apiId, {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: apiName,
        endpointTypes: [EndpointType.REGIONAL],
        policy: createDefaultPolicyDocument()
    });
    add404Support(restApi, stack);
    // Note the instructions at the beginning of this file
    new DomainName(stack, props.customDomainName, {
        domainName: props.customDomainName,
        certificate: Certificate.fromCertificateArn(stack, 'mutualTlsCert', props.customDomainNameCertArn),
        securityPolicy: SecurityPolicy.TLS_1_2,
        mtls: {
            bucket: new Bucket(stack, props.mutualTlsBucketName, {
                bucketName: props.mutualTlsBucketName
            }),
            key: props.mutualTlsCertName
        }
    });
    return restApi;
}

function createUploadVoyagePlanHandler(
    messageResponseModel: Model,
    secret: ISecret,
    stack: Construct,
    api: Resource,
    vpc: IVpc,
    props: VoyagePlanGatewayProps) {

    const handler = createHandler(stack, vpc, props);
    secret.grantRead(handler);
    const resource = api.addResource("voyagePlans")
    createIntegrationResource(stack, props, messageResponseModel, resource, handler);
}


function createIntegrationResource(
    stack: Construct,
    props: VoyagePlanGatewayProps,
    messageResponseModel: Model,
    resource: Resource,
    handler: Function) {

    const integration = defaultIntegration(handler, {
        passthroughBehavior: PassthroughBehavior.NEVER,
        disableCors: true,
        requestParameters: {
            'integration.request.querystring.callbackEndpoint': 'method.request.querystring.callbackEndpoint'
        },
        requestTemplates: {
            // transformation from XML to JSON in API Gateway
            // some stuff needs to be quotes, other stuff does not, it's magic
            'text/xml': `{
                "callbackEndpoint": "$util.escapeJavaScript($input.params('callbackEndpoint'))",
                "voyagePlan": $input.json('$')
            }`
        }
    });

    resource.addMethod("POST", integration, {
        authorizer: createRequestAuthorizer(stack, props),
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.callbackEndpoint': false
        },
        methodResponses: [
            methodResponse("200", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("400", MediaType.APPLICATION_JSON, messageResponseModel),
            methodResponse("500", MediaType.APPLICATION_JSON, messageResponseModel)
        ]
    });
    addQueryParameterDescription(
        'callbackEndpoint',
        'URL endpoint where S-124 VPGW faults are sent',
        resource,
        stack);
    addTagsAndSummary(
        'VPGW Faults',
        ['API'],
        'Upload voyage plan in RTZ format in HTTP POST body. Active VPGW faults relevant to the voyage plan are sent back in S-124 format if the query parameter callbackEndpoint is supplied.',
        resource,
        stack);
}

function createRequestAuthorizer(stack: Construct, props: VoyagePlanGatewayProps): IAuthorizer {
    const functionName = 'VPGW-UploadVoyagePlan-Authorizer';
    const handler = new Function(stack, functionName, {
        functionName,
        runtime: Runtime.NODEJS_12_X,
        code: new AssetCode('dist/lambda/authorize-request'),
        handler: 'lambda-authorize-request.handler',
        logRetention: RetentionDays.ONE_YEAR
    });
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return new RequestAuthorizer(stack, 'VPGWAuthorizer', {
        handler,
        resultsCacheTtl: Duration.minutes(0),
        identitySources: []
    });
}

function createHandler(
    stack: Construct,
    vpc: IVpc,
    props: VoyagePlanGatewayProps,
): Function {
    // ATTENTION!
    // This lambda needs to run in a VPC so that the outbound IP address is always the same (NAT Gateway).
    // The reason for this is IP based restriction in another system's firewall.
    const functionName = 'VPGW-UploadVoyagePlan';
    const environment: any = {};
    environment[KEY_SECRET_ID] = props.secretId;
    const handler = new Function(stack, functionName, defaultLambdaConfiguration({
        functionName,
        code: new AssetCode('dist/lambda/upload-voyage-plan'),
        handler: 'lambda-upload-voyage-plan.handler',
        environment,
        vpc: vpc
    }));
    createSubscription(handler, functionName, props.logsDestinationArn, stack);
    return handler;
}
