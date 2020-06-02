import {dbLambdaConfiguration, LambdaConfiguration} from "../../common/stack/lambda-configs";
import {createUsagePlan} from "../../common/stack/usage-plans";
import {addServiceModel} from "../../common/api/utils";
import {Construct} from "@aws-cdk/core";
import {EndpointType, MethodLoggingLevel, RestApi} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {corsMethodJsonResponse, defaultIntegration} from "../../common/api/responses";
import {createSubscription} from "../../common/stack/subscription";
import {addTags} from "../../common/api/documentation";
import {BETA_TAGS} from "../../common/api/tags";
import {default as DisruptionSchema} from "../../bridge-lock-disruptions/lib/model/disruption-schema";
import {MessageModel} from "../../common/api/response";

export function create(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: LambdaConfiguration, stack: Construct) {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'NW2 Api Key', 'NW2 Usage Plan');

    const datex2Model = addServiceModel("Datex2Model", publicApi, DisruptionSchema);

    return createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, datex2Model, stack)
}

function createAnnotationsResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: LambdaConfiguration,
    lambdaDbSg: ISecurityGroup,
    annotationsModel: any,
    stack: Construct): Function {

    const functionName = 'VS-GetDatex2';
    const responseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const getAnnotationsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/get-datex2'),
        handler: 'lambda-get-annotations.handler',
        readOnly: true
    }));
    const getAnnotationsIntegration = defaultIntegration(getAnnotationsLambda, {
        requestParameters: {
            'integration.request.querystring.author': 'method.request.querystring.author',
            'integration.request.querystring.type': 'method.request.querystring.type',
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                author: "$util.escapeJavaScript($input.params('author'))",
                type: "$util.escapeJavaScript($input.params('type'))"}
            )
        }
    });

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const betaResource = apiResource.addResource("beta");
    const nw2Resource = betaResource.addResource("nw2");
    const requests = nw2Resource.addResource("annotations");
    requests.addMethod("GET", getAnnotationsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.author': false,
            'method.request.querystring.type': false
        },
        methodResponses: [
            corsMethodJsonResponse("200", annotationsModel),
            corsMethodJsonResponse("500", responseModel)
        ]
    });

    createSubscription(getAnnotationsLambda, functionName, props.logsDestinationArn, stack);
    addTags('GetAnnotations', BETA_TAGS, requests, stack);

    return getAnnotationsLambda;
}


function createApi(stack: Construct): RestApi {
    return new RestApi(stack, 'VariableSigns-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'VariableSigns public API',
        endpointTypes: [EndpointType.REGIONAL],
        policy: new PolicyDocument({
            statements: [
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    principals: [
                        new AnyPrincipal()
                    ]
                })
            ]
        })
    });
}

