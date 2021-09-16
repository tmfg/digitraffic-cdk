import {EndpointType, MethodLoggingLevel, RestApi} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Construct} from "@aws-cdk/core";
import {default as FaultSchema} from './model/fault-schema';
import {createSubscription} from 'digitraffic-common/stack/subscription';
import {corsMethod, defaultIntegration, methodResponse} from "digitraffic-common/api/responses";
import {MessageModel} from "digitraffic-common/api/response";
import {featureSchema, geojsonSchema} from "digitraffic-common/model/geojson";
import {addServiceModel, getModelReference} from "digitraffic-common/api/utils";
import {createUsagePlan} from "digitraffic-common/stack/usage-plans";
import {dbLambdaConfiguration} from "digitraffic-common/stack/lambda-configs";
import {AtonProps} from "./app-props";
import {addQueryParameterDescription, addTags} from "digitraffic-common/api/documentation";
import {BETA_TAGS} from "digitraffic-common/api/tags";
import {MediaType} from "digitraffic-common/api/mediatypes";
import {ISecret} from "@aws-cdk/aws-secretsmanager";
import {LambdaEnvironment} from "digitraffic-common/model/lambda-environment";
import {DatabaseEnvironmentKeys} from "digitraffic-common/secrets/dbsecret";
import {AtonEnvKeys} from "./keys";

export function create(
    secret: ISecret,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Construct): Function {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'ATON Api Key', 'ATON Usage Plan');

    const faultModel = addServiceModel("FaultModel", publicApi, FaultSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(faultModel.modelId, publicApi.restApiId)));
    const faultsModel = addServiceModel("FaultsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    return createAnnotationsResource(secret, publicApi, vpc, props, lambdaDbSg, faultsModel, stack)
}

function createAnnotationsResource(
    secret: ISecret,
    publicApi: RestApi,
    vpc: IVpc,
    props: AtonProps,
    lambdaDbSg: ISecurityGroup,
    faultsJsonModel: any,
    stack: Construct): Function {

    const functionName = 'ATON-GetFaults';
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const assetCode = new AssetCode('dist/lambda/get-faults');
    const environment: LambdaEnvironment = {};
    environment[AtonEnvKeys.SECRET_ID] = props.secretId;
    environment[DatabaseEnvironmentKeys.DB_APPLICATION] = 'ATON';

    const getFaultsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        environment,
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-faults.handler',
        readOnly: true
    }));

    secret.grantRead(getFaultsLambda);

    const apiResource = publicApi.root.addResource("api");
    const betaResource = apiResource.addResource("beta");
    const atonResource = betaResource.addResource("aton");
    const resources = atonResource.addResource("faults");

    const getFaultsIntegration = defaultIntegration(getFaultsLambda, {
        requestParameters: {
            'integration.request.querystring.language': 'method.request.querystring.language',
            'integration.request.querystring.fixed_in_hours': 'method.request.querystring.fixed_in_hours'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                language: "$util.escapeJavaScript($input.params('language'))",
                fixed_in_hours: "$util.escapeJavaScript($input.params('fixed_in_hours'))"
            })
        }
    });

    resources.addMethod("GET", getFaultsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.language': false,
            'method.request.querystring.fixed_in_hours': false
        },
        methodResponses: [
            corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, faultsJsonModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, errorResponseModel))
        ]
    });

    createSubscription(getFaultsLambda, functionName, props.logsDestinationArn, stack);

    addTags('GetFaults', BETA_TAGS, resources, stack);
    addQueryParameterDescription('language', 'Language: en, fi or se', resources, stack);
    addQueryParameterDescription('fixed_in_hours', 'Show faults that are unfixed or were fixed at most this many hours ago', resources, stack);

    return getFaultsLambda;
}

function createApi(stack: Construct) {
    return new RestApi(stack, 'ATON-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'ATON public API',
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