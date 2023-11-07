import { LambdaIntegration, RequestValidator, Resource, RestApi } from "aws-cdk-lib/aws-apigateway";
import { createTimestampSchema, LocationSchema, ShipSchema } from "./model/timestamp-schema";
import { LocodeMetadataSchema } from "./model/locode-metadata";
import { DigitrafficMethodResponse, MessageModel } from "@digitraffic/common/dist/aws/infra/api/response";
import {
    addDefaultValidator,
    addServiceModel,
    createArraySchema,
    getModelReference
} from "@digitraffic/common/dist/utils/api-model";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { createUsagePlan } from "@digitraffic/common/dist/aws/infra/usage-plans";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { TimestampMetadata } from "./model/timestamp-metadata";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { IModel } from "aws-cdk-lib/aws-apigateway/lib/model";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficStaticIntegration } from "@digitraffic/common/dist/aws/infra/api/static-integration";

export class PublicApi {
    readonly apiKeyId: string;
    readonly publicApi: DigitrafficRestApi;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, "PortActivity-public", "PortActivity public API");

        this.apiKeyId = createUsagePlan(
            this.publicApi,
            "PortActivity timestamps Api Key",
            "PortActivity timestamps Usage Plan"
        ).keyId;

        const validator = addDefaultValidator(this.publicApi);

        const shipModel = addServiceModel("ShipModel", this.publicApi, ShipSchema);
        const locationModel = addServiceModel("LocationModel", this.publicApi, LocationSchema);
        const timestampModel = addServiceModel(
            "TimestampModel",
            this.publicApi,
            createTimestampSchema(
                getModelReference(shipModel.modelId, this.publicApi.restApiId),
                getModelReference(locationModel.modelId, this.publicApi.restApiId)
            )
        );
        const timestampsModel = addServiceModel(
            "TimestampsModel",
            this.publicApi,
            createArraySchema(timestampModel, this.publicApi)
        );
        const locodeMetadataModel = addServiceModel(
            "LocodeMetadataModel",
            this.publicApi,
            LocodeMetadataSchema
        );
        const errorResponseModel = this.publicApi.addModel("MessageResponseModel", MessageModel);

        const resource = this.publicApi.root.addResource("api").addResource("v1");
        const metadataResource = resource.addResource("metadata");

        this.createTimestampsResource(stack, resource, timestampsModel, errorResponseModel, validator);

        this.createShiplistResource(stack, this.publicApi);

        this.createTimestampMetadataResource(stack, this.publicApi, metadataResource);

        this.createLocodeMetadataResource(stack, this.publicApi, metadataResource, locodeMetadataModel);
    }

    createTimestampsResource(
        stack: DigitrafficStack,
        resource: Resource,
        timestampsJsonModel: IModel,
        errorResponseModel: IModel,
        validator: RequestValidator
    ): MonitoredDBFunction {
        const getTimestampsLambda = MonitoredDBFunction.create(
            stack,
            "get-timestamps",
            stack.createLambdaEnvironment(),
            {
                timeout: 15,
                memorySize: 512,
                reservedConcurrentExecutions: 20,
                errorAlarmProps: {
                    create: true,
                    threshold: 3
                }
            }
        );

        const getTimestampsIntegration = new DigitrafficIntegration(
            getTimestampsLambda,
            MediaType.APPLICATION_JSON
        )
            .addQueryParameter("locode", "mmsi", "imo", "source")
            .build();

        const timestampResource = resource.addResource("timestamps");
        timestampResource.addMethod("GET", getTimestampsIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                "method.request.querystring.locode": false,
                "method.request.querystring.mmsi": false,
                "method.request.querystring.imo": false,
                "method.request.querystring.source": false
            },
            requestValidator: validator,
            methodResponses: [
                DigitrafficMethodResponse.response200(timestampsJsonModel, MediaType.APPLICATION_JSON),
                DigitrafficMethodResponse.response400()
            ]
        });

        this.publicApi.documentResource(
            timestampResource,
            DocumentationPart.method(
                ["timestamps"],
                "GetTimestamps",
                "Retrieves ship timestamps by ship or port"
            ),
            DocumentationPart.queryParameter("locode", "Port LOCODE"),
            DocumentationPart.queryParameter("mmsi", "Ship MMSI"),
            DocumentationPart.queryParameter("imo", "Ship IMO"),
            DocumentationPart.queryParameter("source", "Timestamp source")
        );

        return getTimestampsLambda;
    }

    createShiplistResource(stack: DigitrafficStack, publicApi: RestApi): MonitoredDBFunction {
        const lambda = MonitoredDBFunction.create(
            stack,
            "get-shiplist-public",
            stack.createLambdaEnvironment(),
            {
                functionName: "PortActivity-PublicShiplist",
                timeout: 60,
                reservedConcurrentExecutions: 6,
                memorySize: 256
            }
        );

        const integration = new LambdaIntegration(lambda, {
            proxy: true
        });

        const shiplistResource = publicApi.root.addResource("shiplist");
        shiplistResource.addMethod("GET", integration, {
            apiKeyRequired: false
        });

        this.publicApi.documentResource(
            shiplistResource,
            DocumentationPart.method(["shiplist"], "Shiplist", "Returns a list of ships as an HTML page"),
            DocumentationPart.queryParameter("locode", "Port LOCODE"),
            DocumentationPart.queryParameter("mmsi", "Ship MMSI"),
            DocumentationPart.queryParameter("imo", "Ship IMO"),
            DocumentationPart.queryParameter("source", "Timestamp source"),
            DocumentationPart.queryParameter("interval", "Time interval in hours(default 4*24)")
        );

        return lambda;
    }

    createTimestampMetadataResource(
        stack: DigitrafficStack,
        publicApi: RestApi,
        metadataResource: Resource
    ): void {
        const timestampMetadataResource = metadataResource.addResource("timestamps");

        new DigitrafficStaticIntegration(
            timestampMetadataResource,
            MediaType.APPLICATION_JSON,
            JSON.stringify(TimestampMetadata),
            true,
            false
        );

        this.publicApi.documentResource(
            timestampMetadataResource,
            DocumentationPart.method(["metadata"], "Timestamp metadata", "Returns timestamp related metadata")
        );
    }

    createLocodeMetadataResource(
        stack: DigitrafficStack,
        publicApi: RestApi,
        metadataResource: Resource,
        locodeMetadataModel: IModel
    ): MonitoredDBFunction {
        const getLocodeMetadataLambda = MonitoredDBFunction.create(
            stack,
            "get-locode-metadata",
            stack.createLambdaEnvironment(),
            {
                timeout: 10,
                reservedConcurrentExecutions: 6
            }
        );

        const getLocodeMetadataIntegration = new DigitrafficIntegration(
            getLocodeMetadataLambda,
            MediaType.APPLICATION_JSON
        ).build();

        const locodeMetadataResource = metadataResource.addResource("locodes");
        locodeMetadataResource.addMethod("GET", getLocodeMetadataIntegration, {
            apiKeyRequired: true,
            methodResponses: [
                DigitrafficMethodResponse.response200(locodeMetadataModel, MediaType.APPLICATION_JSON)
            ]
        });

        this.publicApi.documentResource(
            locodeMetadataResource,
            DocumentationPart.method(
                ["metadata"],
                "Locode metadata",
                "Returns a list of LOCODEs with associated timestamp predictions in the data"
            )
        );

        return getLocodeMetadataLambda;
    }
}
