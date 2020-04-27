import {RestApi, MethodLoggingLevel, RequestValidator} from '@aws-cdk/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from '@aws-cdk/aws-iam';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {EndpointType} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {default as DisruptionSchema} from './model/disruption-schema';
import {createSubscription} from '../../common/stack/subscription';
import {
    defaultIntegration, corsMethodJsonResponse,
} from "../../common/api/responses";
import {MessageModel} from "../../common/api/response";
import {featureSchema, geojsonSchema} from "../../common/model/geojson";
import {getModelReference, addServiceModel, addDefaultValidator} from "../../common/api/utils";
import {dbLambdaConfiguration} from "../../common/stack/lambda-configs";
import {Props} from "./app-props";
import {addTags} from "../../common/api/documentation";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: Props,
    stack: Construct) {
    const publicApi = createApi(stack, props);

    const validator = addDefaultValidator(publicApi);

    const disruptionModel = addServiceModel("DisruptionModel", publicApi, DisruptionSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(disruptionModel.modelId, publicApi.restApiId)));
    const disruptionsModel = addServiceModel("DisruptionsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    createDisruptionsResource(publicApi, vpc, props, lambdaDbSg, disruptionsModel, validator, stack)
}

function createDisruptionsResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: Props,
    lambdaDbSg: ISecurityGroup,
    disruptionsJsonModel: any,
    validator: RequestValidator,
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
    const getDisruptionsIntegration = defaultIntegration(getDisruptionsLambda);

    resources.addMethod("GET", getDisruptionsIntegration, {
        requestValidator: validator,
        methodResponses: [
            corsMethodJsonResponse("200", disruptionsJsonModel),
            corsMethodJsonResponse("500", errorResponseModel)
        ]
    });

    createSubscription(getDisruptionsLambda, functionName, props.logsDestinationArn, stack);
    addTags('GetDisruptions', ['bridge-lock-disruptions'], resources, stack);

    return getDisruptionsLambda;
}

function createResourcePaths(publicApi: RestApi) {
    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const bridgeLockResource = v1Resource.addResource("bridgelock");
    return bridgeLockResource.addResource("disruptions");
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
