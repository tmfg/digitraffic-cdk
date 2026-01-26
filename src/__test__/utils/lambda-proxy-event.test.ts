import type { APIGatewayProxyEvent } from "aws-lambda";
import { parseQueryParams } from "../../utils/lambda-proxy-event.js";

describe("lambda-proxy-event.test", () => {
  test("StopWatch start-stop", async () => {
    const event: APIGatewayProxyEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: "GET",
      isBase64Encoded: false,
      multiValueQueryStringParameters: {
        evseStatus: ["CHARGING", "OUTOFORDER"],
        operatorPartyId: ["LDL"],
      },
      queryStringParameters: {
        evseStatus: "OUTOFORDER",
        operatorPartyId: "LDL",
      },
    } as unknown as APIGatewayProxyEvent;

    const parsed = parseQueryParams<{
      operatorPartyId: string;
      evseStatus: string[];
    }>(event, ["evseStatus"]);
    expect(parsed.evseStatus).toEqual(["CHARGING", "OUTOFORDER"]);
    expect(parsed.operatorPartyId).toEqual("LDL");
  });

  test("StopWatch start-stop", async () => {
    const event: APIGatewayProxyEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: "GET",
      isBase64Encoded: false,
      multiValueQueryStringParameters: {
        evseStatus: ["CHARGING", "OUTOFORDER"],
        operatorPartyId: ["LDL"],
      },
      queryStringParameters: {
        evseStatus: "OUTOFORDER",
        operatorPartyId: "LDL",
      },
    } as unknown as APIGatewayProxyEvent;

    const parsed = parseQueryParams<{
      operatorPartyId: string;
      evseStatus: string[];
    }>(event, ["evseStatus"]);
    expect(parsed.evseStatus).toEqual(["CHARGING", "OUTOFORDER"]);
    expect(parsed.operatorPartyId).toEqual("LDL");
  });
});
