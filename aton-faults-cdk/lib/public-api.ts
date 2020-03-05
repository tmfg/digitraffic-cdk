import {RestApi,MethodLoggingLevel}  from '@aws-cdk/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from '@aws-cdk/aws-iam';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {EndpointType} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {default as FaultSchema} from './model/fault-schema';
import {createSubscription} from '../../common/stack/subscription';
import {
    methodJsonResponse,
    defaultIntegration,
    defaultXmlIntegration,
    methodXmlResponse
} from "../../common/api/responses";
import { MessageModel} from "../../common/api/response";
import {featureSchema, geojsonSchema} from "../../common/model/geojson";
import {addXmlserviceModel, getModelReference, addServiceModel} from "../../common/api/utils";
import {createUsagePlan} from "../../common/stack/usage-plans";
import {dbLambdaConfiguration} from "../../common/stack/lambda-configs";
import {AtonProps} from "./app-props";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
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
    props: AtonProps,
    lambdaDbSg: ISecurityGroup,
    faultsJsonModel: any,
    stack: Construct): Function {

    const functionName = 'ATON-GetFaults';
    const functionNameS124 = 'ATON-GetFaults-S124';
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const getFaultsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/get-faults'),
        handler: 'lambda-get-faults.handler',
    }));

    const getFaultsS124Lambda = new Function(stack, functionNameS124, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionNameS124,
        code: new AssetCode('dist/lambda/get-faults'),
        handler: 'lambda-get-faults-s124.handler'
    }));

    const resources = createResourcePaths(publicApi);

    resources.faults.addMethod("GET", defaultIntegration(getFaultsLambda), {
        apiKeyRequired: !props.private,
        methodResponses: [
            methodJsonResponse("200", faultsJsonModel),
            methodJsonResponse("500", errorResponseModel)
        ]
    });

    const xmlModel = addXmlserviceModel('XmlModel', publicApi);

    resources.faultsS124.addMethod("GET", defaultXmlIntegration(getFaultsS124Lambda), {
        apiKeyRequired: !props.private,
        methodResponses: [
            methodXmlResponse("200", xmlModel),
            methodJsonResponse("500", errorResponseModel)
        ]
    });

    if(props.logsDestinationArn) {
        createSubscription(getFaultsLambda, functionName, props.logsDestinationArn, stack);
        createSubscription(getFaultsS124Lambda, functionNameS124, props.logsDestinationArn, stack);
    }

    return getFaultsLambda;
}

function createResourcePaths(publicApi: RestApi): any {
    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const atonResource = v1Resource.addResource("aton");
    const faults = atonResource.addResource("faults");
    const faultsS124 = atonResource.addResource("faults-s124");

    return {
        faults: faults,
        faultsS124: faultsS124
    }
}

function createApi(stack: Construct, atonProps: AtonProps) {
    return new RestApi(stack, 'ATON-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'ATON public API',
        endpointTypes: [atonProps.private ? EndpointType.PRIVATE : EndpointType.REGIONAL],
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