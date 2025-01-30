import {
  APIGatewayClient,
  CreateDocumentationVersionCommand,
  type DocumentationVersion,
  type ExportResponse,
  GetDocumentationVersionsCommand,
  GetExportCommand,
} from "@aws-sdk/client-api-gateway";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export async function exportSwaggerApi(apiId: string): Promise<ExportResponse> {
  const exportCommand = new GetExportCommand({
    restApiId: apiId,
    exportType: "oas30",
    stageName: "prod",
  });

  const apigateway = new APIGatewayClient();
  return apigateway.send(exportCommand);
}

interface DocumentationVersionResult {
  readonly apiId: string;
  readonly versions?: DocumentationVersion[];
}

export async function getDocumentationVersion(
  apiId: string,
  apigateway: APIGatewayClient,
): Promise<DocumentationVersionResult> {
  const getDocumentationVersionsCommand = new GetDocumentationVersionsCommand({
    limit: 500,
    restApiId: apiId,
  });

  const result = await apigateway.send(getDocumentationVersionsCommand);

  return {
    apiId,
    versions: result.items,
  };
}

export function createDocumentationVersion(
  apiId: string,
  latestVersion: number,
  apigateway: APIGatewayClient,
): Promise<DocumentationVersion> {
  logger.info({
    method: "APIGWUtils.createDocumentationVersion",
    customApiId: apiId,
    customLatestVersion: latestVersion,
  });

  const updateApiCommand = new CreateDocumentationVersionCommand({
    restApiId: apiId,
    stageName: "prod",
    documentationVersion: (latestVersion + 1).toString(),
  });

  return apigateway.send(updateApiCommand);
}
