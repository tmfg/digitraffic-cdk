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
import {addTags} from "../../common/api/documentation";

const API_TAGS = ['Beta'];

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: AtonProps,
    stack: Construct): Function {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'ATON Api Key', 'ATON Usage Plan');

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
    const assetCode = new AssetCode('dist/lambda/get-faults');
    const getFaultsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: assetCode,
        handler: 'lambda-get-faults.handler',
        readOnly: true
    }));

    const getFaultsS124Lambda = new Function(stack, functionNameS124, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionNameS124,
        code: assetCode,
        handler: 'lambda-get-faults.handlers124',
        readOnly: true
    }));

    const resources = createResourcePaths(publicApi);
    const getFaultsIntegration = defaultIntegration(getFaultsLambda, {
        requestParameters: {
            'integration.request.querystring.language': 'method.request.querystring.language'
        },
        requestTemplates: {
            'application/json': JSON.stringify({
                language: "$util.escapeJavaScript($input.params('language'))"
            })
        }
    });

    resources.faults.addMethod("GET", getFaultsIntegration, {
        apiKeyRequired: true,
        requestParameters: {
            'method.request.querystring.language': false
        },
        methodResponses: [
            methodJsonResponse("200", faultsJsonModel),
            methodJsonResponse("500", errorResponseModel)
        ]
    });

    const xmlModel = addXmlserviceModel('XmlModel', publicApi);

    resources.faultsS124.addMethod("GET", defaultXmlIntegration(getFaultsS124Lambda), {
        apiKeyRequired: true,
        methodResponses: [
            methodXmlResponse("200", xmlModel),
            methodJsonResponse("500", errorResponseModel)
        ]
    });

    if(props.logsDestinationArn) {
        createSubscription(getFaultsLambda, functionName, props.logsDestinationArn, stack);
        createSubscription(getFaultsS124Lambda, functionNameS124, props.logsDestinationArn, stack);
    }

    addTags('GetFaults', API_TAGS, resources.faults, stack);
    addTags('GetFaultsS124', API_TAGS, resources.faultsS124, stack);

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