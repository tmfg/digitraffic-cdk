import {RestApi,MethodLoggingLevel}  from '@aws-cdk/aws-apigateway';
import {PolicyDocument, PolicyStatement, Effect, AnyPrincipal} from '@aws-cdk/aws-iam';
import {Function, AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc, ISecurityGroup} from '@aws-cdk/aws-ec2';
import {EndpointType} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "../../common/stack/lambda-configs";
import {default as AnnotationSchema} from './model/annotation-schema';
import {createSubscription} from '../../common/stack/subscription';
import {addServiceModel} from 'digitraffic-cdk-api/utils';
import {MessageModel} from "../../common/api/response";
import {featureSchema, geojsonSchema} from "../../common/model/geojson";
import {getModelReference} from "../../common/api/utils";
import {createUsagePlan} from "../../common/stack/usage-plans";
import {NW2Props} from "./app-props";
import {corsMethodJsonResponse, defaultIntegration} from "../../common/api/responses";
import {addTags} from "../../common/api/documentation";

const API_TAGS = ['Data v1'];

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: NW2Props,
    stack: Construct): Function {
    const publicApi = createApi(stack, props);

    if(!props.private) {
        createUsagePlan(publicApi, 'NW2 Api Key', 'NW2 Usage Plan');
    }

    const annotationModel = addServiceModel("AnnotationModel", publicApi, AnnotationSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(annotationModel.modelId, publicApi.restApiId)));
    const annotationsModel = addServiceModel("AnnotationsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    return createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, annotationsModel, stack)
}

function createAnnotationsResource(
    publicApi: RestApi,
    vpc: IVpc,
    props: NW2Props,
    lambdaDbSg: ISecurityGroup,
    annotationsModel: any,
    stack: Construct): Function {

    const functionName = 'NW2-GetAnnotations';
    const responseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const getAnnotationsLambda = new Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new AssetCode('dist/lambda/get-annotations'),
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
        },
        cors: true,
    });

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const nw2Resource = v1Resource.addResource("nw2");
    const requests = nw2Resource.addResource("annotations");
    requests.addMethod("GET", getAnnotationsIntegration, {
        apiKeyRequired: !props.private,
        requestParameters: {
            'method.request.querystring.author': false,
            'method.request.querystring.type': false
        },
        methodResponses: [
            corsMethodJsonResponse("200", annotationsModel),
            corsMethodJsonResponse("500", responseModel)
        ]
    });

    if(props.logsDestinationArn) {
        createSubscription(getAnnotationsLambda, functionName, props.logsDestinationArn, stack);
    }

    addTags('GetAnnotations', API_TAGS, requests, stack);

    return getAnnotationsLambda;
}

function getCondition(nw2Props: NW2Props):any {
    return nw2Props.private ? {
        "StringEquals": {
            "aws:sourceVpc": nw2Props.vpcId
        }
    } : {}
}

function createApi(stack: Construct, nw2Props: NW2Props) {
    return new RestApi(stack, 'Nordicway2-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'Nordicway2 public API',
        endpointTypes: [nw2Props.private ? EndpointType.PRIVATE : EndpointType.REGIONAL],
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
                    conditions: getCondition(nw2Props),
                    principals: [
                        new AnyPrincipal()
                    ]
                })
            ]
        })
    });
}