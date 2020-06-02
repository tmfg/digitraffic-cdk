import {dbLambdaConfiguration, LambdaConfiguration} from "../../common/stack/lambda-configs";
import {createUsagePlan} from "../../common/stack/usage-plans";
import {addXmlserviceModel} from "../../common/api/utils";
import {Construct} from "@aws-cdk/core";
import {EndpointType, MethodLoggingLevel, RestApi} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {corsMethodJsonResponse, defaultIntegration} from "../../common/api/responses";
import {createSubscription} from "../../common/stack/subscription";
import {addTags} from "../../common/api/documentation";
import {BETA_TAGS} from "../../common/api/tags";
import {MessageModel} from "../../common/api/response";

export function create(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: LambdaConfiguration, stack: Construct) {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'NW2 Api Key', 'NW2 Usage Plan');

    return createDatex2Resource(publicApi, vpc, props, lambdaDbSg, stack)
}

function createDatex2Resource(
    publicApi: RestApi,
    vpc: IVpc,
    props: LambdaConfiguration,
    lambdaDbSg: ISecurityGroup,
    stack: Construct): Function {

    const functionName = 'VS-GetDatex2';
    const getDatex2Lambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/get-datex2'),
        handler: 'lambda-get-datex2.handler',
        readOnly: true
    }));
    const getDatex2Integration = defaultIntegration(getDatex2Lambda);

    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const xmlModel = addXmlserviceModel('XmlModel', publicApi);

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const betaResource = apiResource.addResource("beta");
    const vsResource = betaResource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");
    datex2Resource.addMethod("GET", getDatex2Integration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.author': false,
            'method.request.querystring.type': false
        },
        methodResponses: [
            corsMethodJsonResponse("200", xmlModel),
            corsMethodJsonResponse("500", errorResponseModel)
        ]
    });

    createSubscription(getDatex2Lambda, functionName, props.logsDestinationArn, stack);
    addTags('GetDatex2', BETA_TAGS, datex2Resource, stack);

    return getDatex2Lambda;
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

