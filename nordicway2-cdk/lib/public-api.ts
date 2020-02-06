import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import {EndpointType, LambdaIntegration} from "@aws-cdk/aws-apigateway";
import {Construct} from "@aws-cdk/core";
import {dbLambdaConfiguration} from "./cdk-util";
import {default as AnnotationSchema} from './model/annotation-schema';
import {createSubscription} from '../../common/stack/subscription';
import {addServiceModel} from 'digitraffic-cdk-api/utils';
import {methodResponse, RESPONSE_200_OK, RESPONSE_500_SERVER_ERROR} from "../../common/api/responses";
import {MessageModel} from "../../common/api/response";
import {featureSchema, geojsonSchema} from "../../common/model/geojson";
import {getModelReference} from "../../common/api/utils";

export function create(
    vpc: ec2.IVpc,
    lambdaDbSg: ec2.ISecurityGroup,
    props: NW2Props,
    stack: Construct): lambda.Function {
    const publicApi = createApi(stack, props);

    const annotationModel = addServiceModel("AnnotationModel", publicApi, AnnotationSchema);
    const featureModel = addServiceModel("FeatureModel", publicApi, featureSchema(getModelReference(annotationModel.modelId, publicApi.restApiId)));
    const annotationsModel = addServiceModel("AnnotationsModel", publicApi, geojsonSchema(getModelReference(featureModel.modelId, publicApi.restApiId)));

    return createAnnotationsResource(publicApi, vpc, props, lambdaDbSg, annotationsModel, stack)
}

function createAnnotationsResource(
    publicApi: apigateway.RestApi,
    vpc: ec2.IVpc,
    props: NW2Props,
    lambdaDbSg: ec2.ISecurityGroup,
    annotationsModel: any,
    stack: Construct): lambda.Function {

    const functionName = 'NW2-GetAnnotations';
    const responseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const getAnnotationsLambda = new lambda.Function(stack, functionName, dbLambdaConfiguration(vpc, lambdaDbSg, props, {
        functionName: functionName,
        code: new lambda.AssetCode('dist/lambda/get-annotations'),
        handler: 'lambda-get-annotations.handler',
    }));
    const getAnnotationsIntegration = new LambdaIntegration(getAnnotationsLambda, {
        proxy: false,
        integrationResponses: [
            RESPONSE_200_OK,
            RESPONSE_500_SERVER_ERROR
        ]
    });

    const requests = publicApi.root.addResource("annotations");
    requests.addMethod("GET", getAnnotationsIntegration, {
        methodResponses: [
            methodResponse("200", annotationsModel),
            methodResponse("500", responseModel)
        ]
    });

    createSubscription(getAnnotationsLambda, functionName, props.logsDestinationArn, stack);

    return getAnnotationsLambda;
}

function getCondition(nw2Props: NW2Props):any {
    return nw2Props.private ? {
        "StringEquals": {
            "aws:sourceVpc": nw2Props.vpcId
        }
    } : {
        "StringEquals": {
            "aws:RequestTag/CloudFront": "Value"
        }
    };
}

function createApi(stack: Construct, nw2Props: NW2Props) {
    return new apigateway.RestApi(stack, 'Nordicway2-public', {
        deployOptions: {
            loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        },
        restApiName: 'Nordicway2 public API',
        endpointTypes: [nw2Props.private ? EndpointType.PRIVATE : EndpointType.REGIONAL],
        minimumCompressionSize: 1000,
        policy: new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "execute-api:Invoke"
                    ],
                    resources: [
                        "*"
                    ],
                    conditions: getCondition(nw2Props),
                    principals: [
                        new iam.AnyPrincipal()
                    ]
                })
            ]
        })
    });
}