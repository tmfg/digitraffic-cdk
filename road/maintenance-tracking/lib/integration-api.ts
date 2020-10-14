import {Model, RestApi} from '@aws-cdk/aws-apigateway';
import {Construct} from '@aws-cdk/core';
import {ISecurityGroup, IVpc} from '@aws-cdk/aws-ec2';
import {LambdaConfiguration} from '../../../common/stack/lambda-configs';
import {createRestApi} from '../../../common/api/rest_apis';
import {Queue} from '@aws-cdk/aws-sqs';
import {attachQueueToApiGatewayResource} from "../../../common/api/sqs";
import {addDefaultValidator, addServiceModel} from "../../../common/api/utils";
import {
    createSchemaGeometriaSijainti,
    createSchemaHavainto,
    createSchemaOtsikko,
    createSchemaTyokoneenseurannanKirjaus,
    Koordinaattisijainti,
    Organisaatio,
    Tunniste,
    Viivageometriasijainti,
} from "./model/maintenance-tracking-schema";
import {createDefaultUsagePlan} from "../../../common/stack/usage-plans";


export function create(
    queue: Queue,
    vpc: IVpc,
    lambdaDbSg: ISecurityGroup,
    props: LambdaConfiguration,
    stack: Construct)
{
    const integrationApi = createRestApi(stack,
        'MaintenanceTracking-Integration',
        'Maintenance Tracking integration API');


    const tunnisteModel = addServiceModel("Tunniste", integrationApi, Tunniste);
    const organisaatioModel = addServiceModel("Organisaatio", integrationApi, Organisaatio);
    const otsikkoModel = addServiceModel("Otsikko", integrationApi,
                                         createSchemaOtsikko(organisaatioModel.modelReference,
                                                             tunnisteModel.modelReference));
    const koordinaattisijaintiModel = addServiceModel("Koordinaattisijainti", integrationApi, Koordinaattisijainti);
    const viivageometriasijaintiModel = addServiceModel("Viivageometriasijainti", integrationApi, Viivageometriasijainti);
    const geometriaSijaintiModel =  addServiceModel("GeometriaSijainti", integrationApi,
                                                    createSchemaGeometriaSijainti(koordinaattisijaintiModel.modelReference,
                                                                                  viivageometriasijaintiModel.modelReference));
    const havaintoSchema = createSchemaHavainto(geometriaSijaintiModel.modelReference);
    addServiceModel("Havainto", integrationApi, havaintoSchema);

    const tyokoneenseurannanKirjausModel = addServiceModel("TyokoneenseurannanKirjaus", integrationApi,
                                                           createSchemaTyokoneenseurannanKirjaus(otsikkoModel.modelReference, havaintoSchema));

    createUpdateMaintenanceTrackingApiGatewayResource(stack, integrationApi, queue, tyokoneenseurannanKirjausModel);
    createDefaultUsagePlan(integrationApi, 'Maintenance Tracking Integration');
}

function createUpdateMaintenanceTrackingApiGatewayResource(
    stack: Construct,
    integrationApi: RestApi,
    queue: Queue,
    maintenanceTrackingModel: Model) {
    const apiResource = integrationApi.root.addResource('api');
    const integrationResource = apiResource.addResource('integration');
    const estimateResource = integrationResource.addResource('maintenance-tracking');
    const requestValidator = addDefaultValidator(integrationApi);
    attachQueueToApiGatewayResource(
        stack,
        queue,
        estimateResource,
        requestValidator,
        'MaintenanceTracking',
        true,
        {
            'application/json': maintenanceTrackingModel
        });
}