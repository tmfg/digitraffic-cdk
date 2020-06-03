import {dbLambdaConfiguration, LambdaConfiguration} from "../../common/stack/lambda-configs";
import {createUsagePlan} from "../../common/stack/usage-plans";
import {addXmlserviceModel} from "../../common/api/utils";
import {Construct} from "@aws-cdk/core";
import {RestApi} from '@aws-cdk/aws-apigateway';
import {AssetCode, Function} from '@aws-cdk/aws-lambda';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {corsMethodXmlResponse, defaultIntegration} from "../../common/api/responses";
import {createSubscription} from "../../common/stack/subscription";
import {addTags} from "../../common/api/documentation";
import {BETA_TAGS} from "../../common/api/tags";
import {MessageModel} from "../../common/api/response";
import {createRestApi} from "../../common/api/rest_apis";

export function create(vpc: IVpc, lambdaDbSg: ISecurityGroup, props: LambdaConfiguration, stack: Construct) {
    const publicApi = createRestApi(stack, 'VariableSigns-public', 'VariableSigns public API', undefined);

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

    const getDatex2Integration = defaultIntegration(getDatex2Lambda, {xml: true});
    const errorResponseModel = publicApi.addModel('MessageResponseModel', MessageModel);
    const xmlModel = addXmlserviceModel('XmlModel', publicApi);

    const apiResource = publicApi.root.addResource("api");
    const v1Resource = apiResource.addResource("v1");
    const betaResource = apiResource.addResource("beta");
    const vsResource = betaResource.addResource("variable-signs");
    const datex2Resource = vsResource.addResource("datex2");
    datex2Resource.addMethod("GET", getDatex2Integration, {
        apiKeyRequired: true,
        methodResponses: [
            corsMethodXmlResponse("200", xmlModel),
            corsMethodXmlResponse("500", errorResponseModel)
        ]
    });

    createSubscription(getDatex2Lambda, functionName, props.logsDestinationArn, stack);
    addTags('GetDatex2', BETA_TAGS, datex2Resource, stack);

    return getDatex2Lambda;
}
