import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DocumentationPart } from "@digitraffic/common/dist/aws/infra/documentation";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest-api";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { addSimpleServiceModel } from "@digitraffic/common/dist/utils/api-model";
import type { Model, Resource } from "aws-cdk-lib/aws-apigateway";
import { addDatex2XmlModel } from "./model/datex2-api-model.js";
import type { VariableSignsProperties } from "./variable-signs-cdk-stack.js";

const VARIABLE_SIGN_TAGS_V1 = ["Variable Sign V1"];

export class PublicApi {
  readonly restApi: DigitrafficRestApi;

  private apiResource!: Resource;
  private v1Datex233Resource!: Resource;
  private v1ImageResource!: Resource;
  private v1SituationsDatex35Resource!: Resource;
  private v1StatusesDatex35Resource!: Resource;
  private v1ControllersDatex35Resource!: Resource;
  private v1SituationsDatex37Resource!: Resource;
  private v1StatusesDatex37Resource!: Resource;
  private v1ControllersDatex37Resource!: Resource;

  private situationsDatex35Model: Model;
  private statusesDatex35Model: Model;
  private controllersDatex35Model: Model;
  private situationsDatex37Model: Model;
  private statusesDatex37Model: Model;
  private controllersDatex37Model: Model;

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

    this.situationsDatex35Model = addDatex2XmlModel(
      this.restApi,
      "3.5",
      "SituationPublication",
    );
    this.statusesDatex35Model = addDatex2XmlModel(
      this.restApi,
      "3.5",
      "VmsPublication",
    );
    this.controllersDatex35Model = addDatex2XmlModel(
      this.restApi,
      "3.5",
      "VmsTablePublication",
    );
    this.situationsDatex37Model = addDatex2XmlModel(
      this.restApi,
      "3.7",
      "SituationPublication",
    );
    this.statusesDatex37Model = addDatex2XmlModel(
      this.restApi,
      "3.7",
      "VmsPublication",
    );
    this.controllersDatex37Model = addDatex2XmlModel(
      this.restApi,
      "3.7",
      "VmsTablePublication",
    );

    const { enableDatexII35, enableDatexII37 } =
      stack.configuration as VariableSignsProperties;

    this.createV1ResourcePaths(enableDatexII35, enableDatexII37);
    this.createDatex233Resource(stack);
    this.createImageResource(stack);

    if (enableDatexII35) {
      this.createSituationsDatex35Resource(stack);
      this.createStatusesDatex35Resource(stack);
      this.createControllersDatex35Resource(stack);
    }

    if (enableDatexII37) {
      this.createSituationsDatex37Resource(stack);
      this.createStatusesDatex37Resource(stack);
      this.createControllersDatex37Resource(stack);
    }
  }

  createV1ResourcePaths(
    enableDatexII35: boolean,
    enableDatexII37: boolean,
  ): void {
    this.apiResource = this.restApi.root.addResource("api");

    const vsResource = this.apiResource.addResource("variable-sign");
    const v1Resource = this.restApi.addResourceWithCorsOptionsSubTree(
      vsResource,
      "v1",
    );

    const imagesResource = v1Resource.addResource("images");
    this.v1ImageResource = imagesResource.addResource("{text}");

    this.v1Datex233Resource = v1Resource.addResource("signs.datex2");

    if (enableDatexII35 || enableDatexII37) {
      const signsResource = v1Resource.addResource("signs");
      const statusesResource = v1Resource.addResource("statuses");
      const controllersResource = v1Resource.addResource("controllers");

      if (enableDatexII35) {
        this.v1SituationsDatex35Resource =
          signsResource.addResource("datex2-3.5.xml");
        this.v1StatusesDatex35Resource =
          statusesResource.addResource("datex2-3.5.xml");
        this.v1ControllersDatex35Resource =
          controllersResource.addResource("datex2-3.5.xml");
      }

      if (enableDatexII37) {
        this.v1SituationsDatex37Resource =
          signsResource.addResource("datex2-3.7.xml");
        this.v1StatusesDatex37Resource =
          statusesResource.addResource("datex2-3.7.xml");
        this.v1ControllersDatex37Resource =
          controllersResource.addResource("datex2-3.7.xml");
      }
    }
  }

  createImageResource(stack: DigitrafficStack): void {
    const getImageLambda = MonitoredDBFunction.create(
      stack,
      "get-sign-image",
      {},
      {
        reservedConcurrentExecutions: 3,
      },
    );

    const svgModel = addSimpleServiceModel(
      "SvgModel",
      this.restApi,
      MediaType.IMAGE_SVG,
    );

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

    const getDatex2Integration = new DigitrafficIntegration(
      getDatex2Lambda,
      MediaType.APPLICATION_XML,
    ).build();

    const xmlModel = addSimpleServiceModel("XmlModel", this.restApi);

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

    this.restApi.documentResource(
      this.v1Datex233Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetDatex2",
        "Return all variables signs as DatexII 2.3.3",
      ),
    );
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
              this.situationsDatex35Model,
              MediaType.APPLICATION_XML,
            ),
          ],
        },
      );
    });

    this.restApi.documentResource(
      this.v1SituationsDatex35Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetSituationsDatexII_35",
        "Return all variable sign situations as Datex II 3.5 (sit:situationPublication). Full schema: https://docs.datex2.eu/downloads/modelv35/",
      ),
    );
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
              this.statusesDatex35Model,
              MediaType.APPLICATION_XML,
            ),
          ],
        },
      );
    });

    this.restApi.documentResource(
      this.v1StatusesDatex35Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetStatusesDatexII_35",
        "Return all VMS controller statuses as Datex II 3.5 (vms:VmsPublication). Full schema: https://docs.datex2.eu/downloads/modelv35/",
      ),
    );
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
              this.controllersDatex35Model,
              MediaType.APPLICATION_XML,
            ),
          ],
        },
      );
    });

    this.restApi.documentResource(
      this.v1ControllersDatex35Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetControllersDatexII_35",
        "Return all VMS controllers as Datex II 3.5 (vms:VmsTablePublication). Full schema: https://docs.datex2.eu/downloads/modelv35/",
      ),
    );
  }

  createSituationsDatex37Resource(stack: DigitrafficStack): void {
    const environment = stack.createLambdaEnvironment();

    const getSituationsLambda = MonitoredDBFunction.create(
      stack,
      "get-situations-datex2-37",
      environment,
      { reservedConcurrentExecutions: 3 },
    );

    const integration = new DigitrafficIntegration(
      getSituationsLambda,
      MediaType.APPLICATION_XML,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod): void => {
      this.v1SituationsDatex37Resource.addMethod(httpMethod, integration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            this.situationsDatex37Model,
            MediaType.APPLICATION_XML,
          ),
        ],
      });
    });

    this.restApi.documentResource(
      this.v1SituationsDatex37Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetSituationsDatexII_37",
        "Return all variable sign situations as Datex II 3.7 (sit:situationPublication). Includes bootstrapped 3.5 data after running TODO.md seed SQL. Full schema: https://docs.datex2.eu/downloads/modelv37/",
      ),
    );
  }

  createStatusesDatex37Resource(stack: DigitrafficStack): void {
    const environment = stack.createLambdaEnvironment();

    const getStatusesLambda = MonitoredDBFunction.create(
      stack,
      "get-statuses-datex2-37",
      environment,
      { reservedConcurrentExecutions: 3 },
    );

    const integration = new DigitrafficIntegration(
      getStatusesLambda,
      MediaType.APPLICATION_XML,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod): void => {
      this.v1StatusesDatex37Resource.addMethod(httpMethod, integration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            this.statusesDatex37Model,
            MediaType.APPLICATION_XML,
          ),
        ],
      });
    });

    this.restApi.documentResource(
      this.v1StatusesDatex37Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetStatusesDatexII_37",
        "Return all VMS controller statuses as Datex II 3.7 (vms:VmsPublication). Includes bootstrapped 3.5 data after running TODO.md seed SQL. Full schema: https://docs.datex2.eu/downloads/modelv37/",
      ),
    );
  }

  createControllersDatex37Resource(stack: DigitrafficStack): void {
    const environment = stack.createLambdaEnvironment();

    const getControllersLambda = MonitoredDBFunction.create(
      stack,
      "get-controllers-datex2-37",
      environment,
      { reservedConcurrentExecutions: 3 },
    );

    const integration = new DigitrafficIntegration(
      getControllersLambda,
      MediaType.APPLICATION_XML,
    ).build();

    ["GET", "HEAD"].forEach((httpMethod): void => {
      this.v1ControllersDatex37Resource.addMethod(httpMethod, integration, {
        apiKeyRequired: true,
        methodResponses: [
          DigitrafficMethodResponse.response200(
            this.controllersDatex37Model,
            MediaType.APPLICATION_XML,
          ),
        ],
      });
    });

    this.restApi.documentResource(
      this.v1ControllersDatex37Resource,
      DocumentationPart.method(
        VARIABLE_SIGN_TAGS_V1,
        "GetControllersDatexII_37",
        "Return all VMS controllers as Datex II 3.7 (vms:VmsTablePublication). Includes bootstrapped 3.5 data after running TODO.md seed SQL. Full schema: https://docs.datex2.eu/downloads/modelv37/",
      ),
    );
  }
}
