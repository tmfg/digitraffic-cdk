import {EndpointType, MethodLoggingLevel, RestApi} from '@aws-cdk/aws-apigateway';
import {AnyPrincipal, Effect, PolicyDocument, PolicyStatement} from '@aws-cdk/aws-iam';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "../../../common/stack/lambda-configs";
import {default as AnnotationSchema} from './model/annotation-schema';
import {createSubscription} from '../../../common/stack/subscription';
import {addServiceModel, getModelReference} from '../../../common/api/utils';
import {MessageModel} from "../../../common/api/response";
import {featureSchema, geojsonSchema} from "../../../common/model/geojson";
import {createUsagePlan} from "../../../common/stack/usage-plans";
import {NW2Props} from "./app-props";
import {corsMethod, defaultIntegration, methodResponse} from "../../../common/api/responses";
import {addTags} from "../../../common/api/documentation";
import {BETA_TAGS} from "../../../common/api/tags";
import {MediaType} from "../../../common/api/mediatypes";

export function create(
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: NW2Props,
    stack: Construct): Function {
    const publicApi = createApi(stack);

    createUsagePlan(publicApi, 'NW2 Api Key', 'NW2 Usage Plan');

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
            corsMethod(methodResponse("200", MediaType.APPLICATION_JSON, annotationsModel)),
            corsMethod(methodResponse("500", MediaType.APPLICATION_JSON, responseModel))
        ]
    });

    createSubscription(getAnnotationsLambda, functionName, props.logsDestinationArn, stack);

    addTags('GetAnnotations', BETA_TAGS, requests, stack);

    return getAnnotationsLambda;
}

function createApi(stack: Construct): RestApi {
    return new RestApi(stack, 'Nordicway2-public', {
        deployOptions: {
            loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: 'Nordicway2 public API',
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