import {
  CfnDocumentationPart,
  Cors,
  EndpointType,
  GatewayResponse,
  type IResource,
  type JsonSchema,
  MethodLoggingLevel,
  type Model,
  type Resource,
  type ResourceOptions,
  ResponseType,
  RestApi,
  type RestApiProps,
} from "aws-cdk-lib/aws-apigateway";
import {
  AnyPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";
import { getModelReference } from "../../../utils/api-model.js";
import { MediaType } from "../../types/mediatypes.js";
import type { ModelWithReference } from "../../types/model-with-reference.js";
import type {
  DocumentationPart,
  DocumentationProperties,
} from "../documentation.js";
import { createDefaultUsagePlan, createUsagePlan } from "../usage-plans.js";
import type { DigitrafficStack } from "./stack.js";

import { set } from "lodash-es";

export const PUBLIC_REST_API_CORS_CONFIG = {
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowHeaders: [
      "Content-Type",
      "X-Amz-Date",
      "Authorization",
      "X-Api-Key",
      "X-Amz-Security-Token",
      "Digitraffic-User",
    ],
    allowMethods: ["OPTIONS", "GET", "HEAD"],
  },
} as const satisfies Pick<ResourceOptions, "defaultCorsPreflightOptions">;

export class DigitrafficRestApi extends RestApi {
  readonly apiKeyIds: string[];
  readonly enableDocumentation: boolean;

  constructor(
    stack: DigitrafficStack,
    apiId: string,
    apiName: string,
    allowFromIpAddresses?: string[] | undefined,
    config?: Partial<RestApiProps>,
  ) {
    const policyDocument =
      allowFromIpAddresses === null || allowFromIpAddresses === undefined
        ? createDefaultPolicyDocument()
        : createIpRestrictionPolicyDocument(allowFromIpAddresses);

    // override default config with given extra config
    const apiConfig = {
      ...{
        deployOptions: {
          loggingLevel: MethodLoggingLevel.ERROR,
        },
        restApiName: apiName,
        endpointTypes: [EndpointType.REGIONAL],
        policy: policyDocument,
      },
      ...config,
    };

    super(stack, apiId, apiConfig);

    this.apiKeyIds = [];
    this.enableDocumentation =
      stack.configuration.stackFeatures?.enableDocumentation ?? true;

    add404Support(this, stack);
  }

  hostname(): string {
    return `${this.restApiId}.execute-api.${
      (this.stack as DigitrafficStack).region
    }.amazonaws.com`;
  }

  createUsagePlan(apiKeyId: string, apiKeyName: string): string {
    const newKeyId = createUsagePlan(this, apiKeyId, apiKeyName).keyId;

    this.apiKeyIds.push(newKeyId);

    return newKeyId;
  }

  createUsagePlanV2(apiName: string, apiKey?: string): string {
    const newKeyId = createDefaultUsagePlan(this, apiName, apiKey).keyId;

    this.apiKeyIds.push(newKeyId);

    return newKeyId;
  }

  addJsonModel(modelName: string, schema: JsonSchema): ModelWithReference {
    return this.getModelWithReference(
      this.addModel(modelName, {
        contentType: MediaType.APPLICATION_JSON,
        modelName,
        schema,
      }),
    );
  }

  addCSVModel(modelName: string): ModelWithReference {
    return this.getModelWithReference(
      this.addModel(modelName, {
        contentType: MediaType.TEXT_CSV,
        modelName,
        schema: {},
      }),
    );
  }

  private getModelWithReference(model: Model): ModelWithReference {
    return set(
      model,
      "modelReference",
      getModelReference(model.modelId, this.restApiId),
    ) as ModelWithReference;
  }

  private addDocumentationPart(
    resource: Resource,
    parameterName: string,
    resourceName: string,
    type: string,
    properties: DocumentationProperties,
  ): void {
    const location: CfnDocumentationPart.LocationProperty = {
      type,
      path: resource.path,
      name: type !== "METHOD" ? parameterName : undefined,
    };

    // eslint-disable-next-line no-new
    new CfnDocumentationPart(this.stack, resourceName, {
      restApiId: resource.api.restApiId,
      location,
      properties: JSON.stringify(properties),
    });
  }

  documentResource(
    resource: Resource,
    ...documentationPart: DocumentationPart[]
  ): void {
    if (this.enableDocumentation) {
      documentationPart.forEach((dp) =>
        this.addDocumentationPart(
          resource,
          dp.parameterName,
          `${resource.path}.${dp.parameterName}.Documentation`,
          dp.type,
          dp.documentationProperties,
        )
      );
    } else {
      // eslint-disable-next-line no-console
      console.info("Skipping documentation for %s", resource.path);
    }
  }

  addResourceWithCorsOptionsSubTree(
    resource: Resource,
    pathPart: string,
    config?: ResourceOptions,
  ): Resource {
    const mergedConfig: ResourceOptions = {
      ...PUBLIC_REST_API_CORS_CONFIG,
      ...config,
    };
    return resource.addResource(pathPart, mergedConfig);
  }

  /**
   * Add support for HTTP OPTIONS to an API GW resource,
   * this is required for preflight CORS requests made by browsers.
   * @param apiResource
   */
  addCorsOptions(apiResource: IResource): void {
    apiResource.addCorsPreflight(
      PUBLIC_REST_API_CORS_CONFIG.defaultCorsPreflightOptions,
    );
  }
}

/**
 * Due to AWS API design API Gateway will always return 403 'Missing Authentication Token' for requests
 * with a non-existent endpoint. This function translates this response to a 404.
 * Requests with an invalid or missing API key are not affected (still return 403 'Forbidden').
 * @param restApi RestApi
 * @param stack Construct
 */
export function add404Support(restApi: RestApi, stack: Construct): void {
  // eslint-disable-next-line no-new
  new GatewayResponse(
    stack,
    `MissingAuthenticationTokenResponse-${restApi.restApiName}`,
    {
      restApi,
      type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
      statusCode: "404",
      templates: {
        [MediaType.APPLICATION_JSON]: '{"message": "Not found"}',
      },
    },
  );
}

export function add401Support(restApi: RestApi, stack: Construct): void {
  // eslint-disable-next-line no-new
  new GatewayResponse(
    stack,
    `AuthenticationFailedResponse-${restApi.restApiName}`,
    {
      restApi,
      type: ResponseType.UNAUTHORIZED,
      statusCode: "401",
      responseHeaders: {
        "WWW-Authenticate": "'Basic'",
      },
    },
  );
}

/**
 * Due to AWS API design API Gateway will always return 403 'Missing Authentication Token' for requests
 * with a non-existent endpoint. This function converts this response to a custom one.
 * Requests with an invalid or missing API key are not affected (still return 403 'Forbidden').
 * @param returnCode
 * @param message
 * @param restApi RestApi
 * @param stack Construct
 */
export function setReturnCodeForMissingAuthenticationToken(
  returnCode: number,
  message: string,
  restApi: RestApi,
  stack: Construct,
): void {
  // eslint-disable-next-line no-new
  new GatewayResponse(
    stack,
    `MissingAuthenticationTokenResponse-${restApi.restApiName}`,
    {
      restApi,
      type: ResponseType.MISSING_AUTHENTICATION_TOKEN,
      statusCode: `${returnCode}`,
      templates: {
        [MediaType.APPLICATION_JSON]: `{"message": ${message}}`,
      },
    },
  );
}

export function createRestApi(
  stack: Construct,
  apiId: string,
  apiName: string,
  allowFromIpAddresses?: string[] | undefined,
): RestApi {
  const policyDocument =
    allowFromIpAddresses === null || allowFromIpAddresses === undefined
      ? createDefaultPolicyDocument()
      : createIpRestrictionPolicyDocument(allowFromIpAddresses);
  const restApi = new RestApi(stack, apiId, {
    deployOptions: {
      loggingLevel: MethodLoggingLevel.ERROR,
    },
    restApiName: apiName,
    endpointTypes: [EndpointType.REGIONAL],
    policy: policyDocument,
  });
  add404Support(restApi, stack);
  return restApi;
}

export function createDefaultPolicyDocument(): PolicyDocument {
  return new PolicyDocument({
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["execute-api:Invoke"],
        resources: ["*"],
        principals: [new AnyPrincipal()],
      }),
    ],
  });
}

export function createIpRestrictionPolicyDocument(
  allowFromIpAddresses: string[],
): PolicyDocument {
  return new PolicyDocument({
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        conditions: {
          IpAddress: {
            "aws:SourceIp": allowFromIpAddresses,
          },
        },
        actions: ["execute-api:Invoke"],
        resources: ["*"],
        principals: [new AnyPrincipal()],
      }),
    ],
  });
}
