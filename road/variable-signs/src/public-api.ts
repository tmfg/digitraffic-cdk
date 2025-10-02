import { addSimpleServiceModel } from "@digitraffic/common/dist/utils/api-model";
import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { Model, Resource } from "aws-cdk-lib/aws-apigateway";

const VARIABLE_SIGN_TAGS_V1 = ["Variable Sign V1"];

export class PublicApi {
  readonly restApi: DigitrafficRestApi;

  private apiResource!: Resource;
  private v1Datex233Resource!: Resource;
  private v1ImageResource!: Resource;
  private v1SituationsDatex35Resource!: Resource;
  private v1StatusesDatex35Resource!: Resource;
  private v1ControllersDatex35Resource!: Resource;

  private datex2_35_model: Model;

  constructor(stack: DigitrafficStack) {
    this.restApi = new DigitrafficRestApi(
      stack,
      "VariableSigns-public",
      "Variable Signs public API",
    );

    this.restApi.createUsagePlan(
      "VariableSigns Api Key",
      "VariableSigns Usage Plan",
    );

    this.datex2_35_model = addSimpleServiceModel("Xml35Model", this.restApi);

    this.createV1ResourcePaths();
    this.createDatex233Resource(stack);
    this.createSituationsDatex35Resource(stack);
    this.createStatusesDatex35Resource(stack);
    this.createControllersDatex35Resource(stack);

    this.createV1Documentation();
  }

  createV1ResourcePaths(): void {
    this.apiResource = this.restApi.root.addResource("api");

    const vsResource = this.apiResource.addResource("variable-sign");
    const v1Resource = this.restApi.addResourceWithCorsOptionsSubTree(
      vsResource,
      "v1",
    );

    const imagesResource = v1Resource.addResource("images");

    this.v1Datex233Resource = v1Resource.addResource("signs.datex2");
    this.v1SituationsDatex35Resource = v1Resource.addResource("signs")
      .addResource(
        "datex2-3.5.xml",
      );
    this.v1StatusesDatex35Resource = this.v1Datex233Resource.addResource(
      "statuses",
    ).addResource("datex2-3.5.xml");
    this.v1ControllersDatex35Resource = this.v1Datex233Resource.addResource(
      "controllers",
    )
      .addResource("datex2-3.5.xml");

    this.v1ImageResource = imagesResource.addResource("{text}");
  }

  createV1Documentation(): void {
    this.restApi.documentResource(
      this.v1Datex233Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetDatex2",
        "Return all variables signs as DatexII 2.3.3",
      ),
    );

    this.restApi.documentResource(
      this.v1SituationsDatex35Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetDatex2",
        "Return all situations as DatexII 3.5",
      ),
    );

    this.restApi.documentResource(
      this.v1ImageResource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetImage",
        "Generate svg-image from given text",
      ),
      DocumentationPart.queryParameter(
        "text",
        "formatted [text] from variable sign text rows, without the brackets",
      ),
    );
  }

  createDatex233Resource(stack: DigitrafficStack): void {
    const environment = stack.createLambdaEnvironment();

    const getDatex2Lambda = MonitoredDBFunction.create(
      stack,
      "get-datex2",
      environment,
      {
        reservedConcurrentExecutions: 3,
      },
    );

    const getImageLambda = MonitoredDBFunction.create(
      stack,
      "get-sign-image",
      {},
      {
        reservedConcurrentExecutions: 3,
      },
    );

    const getDatex2Integration = new DigitrafficIntegration(
      getDatex2Lambda,
      MediaType.APPLICATION_XML,
    ).build();

    const xmlModel = addSimpleServiceModel("XmlModel", this.restApi);
    const svgModel = addSimpleServiceModel(
      "SvgModel",
      this.restApi,
      MediaType.IMAGE_SVG,
    );

    ["GET", "HEAD"].forEach((httpMethod): void => {
      this.v1Datex233Resource.addMethod(httpMethod, getDatex2Integration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            xmlModel,
            MediaType.APPLICATION_XML,
          ),
        ],
      });
    });

    const getImageIntegration = new DigitrafficIntegration(
      getImageLambda,
      MediaType.IMAGE_SVG,
    )
      .addPathParameter("text")
      .build();

    ["GET", "HEAD"].forEach((httpMethod) => {
      this.v1ImageResource.addMethod(httpMethod, getImageIntegration, {
        apiKeyRequired: true,
        requestParameters: {
          "method.request.path.text": true,
        },
        methodResponses: [
          DigitrafficMethodResponse.response200(svgModel, MediaType.IMAGE_SVG),
          DigitrafficMethodResponse.response400(),
          DigitrafficMethodResponse.response500(),
        ],
      });
    });
  }

  createSituationsDatex35Resource(stack: DigitrafficStack): void {
    const environment = stack.createLambdaEnvironment();

    const getSituationsLambda = MonitoredDBFunction.create(
      stack,
      "get-situations-datex2-35",
      environment,
      {
        reservedConcurrentExecutions: 3,
      },
    );

    const getDatex2Integration = new DigitrafficIntegration(
      getSituationsLambda,
      MediaType.APPLICATION_XML,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod): void => {
      this.v1SituationsDatex35Resource.addMethod(
        httpMethod,
        getDatex2Integration,
        {
          apiKeyRequired: true,
          methodResponses: [
            DigitrafficMethodResponse.response200(
              this.datex2_35_model,
              MediaType.APPLICATION_XML,
            ),
          ],
        },
      );
    });
  }

  createStatusesDatex35Resource(stack: DigitrafficStack): void {
    const environment = stack.createLambdaEnvironment();

    const getStatusesLambda = MonitoredDBFunction.create(
      stack,
      "get-statuses-datex2-35",
      environment,
      {
        reservedConcurrentExecutions: 3,
      },
    );

    const getDatex2Integration = new DigitrafficIntegration(
      getStatusesLambda,
      MediaType.APPLICATION_XML,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod): void => {
      this.v1StatusesDatex35Resource.addMethod(
        httpMethod,
        getDatex2Integration,
        {
          apiKeyRequired: true,
          methodResponses: [
            DigitrafficMethodResponse.response200(
              this.datex2_35_model,
              MediaType.APPLICATION_XML,
            ),
          ],
        },
      );
    });
  }

  createControllersDatex35Resource(stack: DigitrafficStack): void {
    const environment = stack.createLambdaEnvironment();

    const getControllersLambda = MonitoredDBFunction.create(
      stack,
      "get-controllers-datex2-35",
      environment,
      {
        reservedConcurrentExecutions: 3,
      },
    );

    const getDatex2Integration = new DigitrafficIntegration(
      getControllersLambda,
      MediaType.APPLICATION_XML,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod): void => {
      this.v1ControllersDatex35Resource.addMethod(
        httpMethod,
        getDatex2Integration,
        {
          apiKeyRequired: true,
          methodResponses: [
            DigitrafficMethodResponse.response200(
              this.datex2_35_model,
              MediaType.APPLICATION_XML,
            ),
          ],
        },
      );
    });
  }
}
