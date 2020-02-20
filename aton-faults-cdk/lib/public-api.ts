import {RestApi,MethodLoggingLevel}  from '@aws-cdk/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from '@aws-cdk/aws-iam';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "./cdk-util";
import {default as FaultSchema} from './model/fault-schema';
import {createSubscription} from '../../common/stack/subscription';
import {addServiceModel} from 'digitraffic-cdk-api/utils';
import {methodResponse, RESPONSE_200_OK, RESPONSE_500_SERVER_ERROR} from "../../common/api/responses";
import {MessageModel} from "../../common/api/response";
import {featureSchema, geojsonSchema} from "../../common/model/geojson";
import {getModelReference} from "../../common/api/utils";
import {createUsagePlan} from "../../common/stack/usage-plans";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonFaultsProps,
    stack: Construct): Function {
    const publicApi = createApi(stack, props);

    if(!props.private) {
        createUsagePlan(publicApi, 'ATON Api Key', 'ATON Usage Plan');
    }

    const faultModel = addServiceModel("FaultModel", publicApi, FaultSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(faultModel.modelId, publicApi.restApiId)));
    const faultsModel = addServiceModel("FaultsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    return createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, faultsModel, stack)
}

function createAnnotationsResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: AtonFaultsProps,
    lambdaDbSg: ISecurityGroup,
    annotationsModel: any,
    stack: Construct): Function {

    const functionName = 'ATON-GetFaults';
    const responseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const getFaultsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/get-faults'),
        handler: 'lambda-get-faults.handler',
    }));
    const getAnnotationsIntegration = new LambdaIntegration(getFaultsLambda, {
        proxy: false,
        integrationResponses: [
            RESPONSE_200_OK,
            RESPONSE_500_SERVER_ERROR
        ]
    });

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const nw2Resource = v1Resource.addResource("aton");
    const requests = nw2Resource.addResource("faults");
    requests.addMethod("GET", getAnnotationsIntegration, {
        apiKeyRequired: !props.private,
        methodResponses: [
            methodResponse("200", annotationsModel),
            methodResponse("500", responseModel)
        ]
    });

    if(props.logsDestinationArn) {
        createSubscription(getFaultsLambda, functionName, props.logsDestinationArn, stack);
    }

    return getFaultsLambda;
}

function createApi(stack: Construct, nw2Props: AtonFaultsProps) {
    return new RestApi(stack, 'ATON-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'ATON public API',
        endpointTypes: [nw2Props.private ? EndpointType.PRIVATE : EndpointType.REGIONAL],
        minimumCompressionSize: 1000,
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