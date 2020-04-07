import {RestApi,MethodLoggingLevel}  from '@aws-cdk/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from '@aws-cdk/aws-iam';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {EndpointType} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {default as DisruptionSchema} from './model/disruption-schema';
import {createSubscription} from '../../common/stack/subscription';
import {
    methodJsonResponse,
    defaultIntegration,
} from "../../common/api/responses";
import { MessageModel} from "../../common/api/response";
import {featureSchema, geojsonSchema} from "../../common/model/geojson";
import {getModelReference, addServiceModel} from "../../common/api/utils";
import {dbLambdaConfiguration} from "../../common/stack/lambda-configs";
import {Props} from "./app-props";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Construct): Function {
    const publicApi = createApi(stack, props);

    const disruptionModel = addServiceModel("DisruptionModel", publicApi, DisruptionSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(disruptionModel.modelId, publicApi.restApiId)));
    const disruptionsModel = addServiceModel("DisruptionsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    return createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, disruptionsModel, stack)
}

function createAnnotationsResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: Props,
    lambdaDbSg: ISecurityGroup,
    disruptionsJsonModel: any,
    stack: Construct): Function {

    const functionName = 'BridgeLockDisruption-GetDisruptions';
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const assetCode = new AssetCode('dist/lambda/get-disruptions');
    const getDisruptionsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-disruptions.handler',
        readOnly: true
    }));

    const resources = createResourcePaths(publicApi);
    const getDisruptionsIntegration = defaultIntegration(getDisruptionsLambda, {
        requestParameters: {
            'integration.request.querystring.language': 'method.request.querystring.language'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                language: "$util.escapeJavaScript($input.params('language'))"
            })
        }
    });

    resources.disruptions.addMethod("GET", getDisruptionsIntegration, {
        apiKeyRequired: false,
        requestParameters: {
            'method.request.querystring.language': false
        },
        methodResponses: [
            methodJsonResponse("200", disruptionsJsonModel),
            methodJsonResponse("500", errorResponseModel)
        ]
    });

    if(props.logsDestinationArn) {
        createSubscription(getDisruptionsLambda, functionName, props.logsDestinationArn, stack);
    }

    return getDisruptionsLambda;
}

function createResourcePaths(publicApi: RestApi): any {
    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const atonResource = v1Resource.addResource("aton");
    const disruptions = atonResource.addResource("disruptions");

    return {
        disruptions: disruptions
    }
}

function createApi(stack: Construct, Props: Props) {
    return new RestApi(stack, 'BridgeLockDisruption-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'BridgeLockDisruption public API',
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