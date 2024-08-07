import { expect } from "@jest/globals";

test("index import ok?", () => {
    const index = import("../index.mjs");
    return expect(index).resolves.toBeDefined();
});

test("database import ok?", () => {
    const database = import("../database/database.mjs");
    return expect(database).resolves.toBeDefined();
});

test("cached import ok?", () => {
    const cached = import("../database/cached.mjs");
    return expect(cached).resolves.toBeDefined();
});

test("models import ok?", () => {
    const models = import("../database/models.mjs");
    return expect(models).resolves.toBeDefined();
});

test("lastUpdated import ok?", () => {
    const lastUpdated = import("../database/last-updated.mjs");
    return expect(lastUpdated).resolves.toBeDefined();
});

test("urn import ok?", () => {
    const urn = import("../types/urn.mjs");
    return expect(urn).resolves.toBeDefined();
});

test("utilTypes import ok?", () => {
    const utilTypes = import("../types/util-types.mjs");
    return expect(utilTypes).resolves.toBeDefined();
});

test("either import ok?", () => {
    const either = import("../types/either.mjs");
    return expect(either).resolves.toBeDefined();
});

test("validator import ok?", () => {
    const validator = import("../types/validator.mjs");
    return expect(validator).resolves.toBeDefined();
});

test("nullable import ok?", () => {
    const nullable = import("../types/nullable.mjs");
    return expect(nullable).resolves.toBeDefined();
});

test("awsEnv import ok?", () => {
    const awsEnv = import("../types/aws-env.mjs");
    return expect(awsEnv).resolves.toBeDefined();
});

test("asyncTimeoutError import ok?", () => {
    const asyncTimeoutError = import("../types/async-timeout-error.mjs");
    return expect(asyncTimeoutError).resolves.toBeDefined();
});

test("inputError import ok?", () => {
    const inputError = import("../types/input-error.mjs");
    return expect(inputError).resolves.toBeDefined();
});

test("httpError import ok?", () => {
    const httpError = import("../types/http-error.mjs");
    return expect(httpError).resolves.toBeDefined();
});

test("language import ok?", () => {
    const language = import("../types/language.mjs");
    return expect(language).resolves.toBeDefined();
});

test("traffictype import ok?", () => {
    const traffictype = import("../types/traffictype.mjs");
    return expect(traffictype).resolves.toBeDefined();
});

test("testutils import ok?", () => {
    const testutils = import("../test/testutils.mjs");
    return expect(testutils).resolves.toBeDefined();
});

test("dbTestutils import ok?", () => {
    const dbTestutils = import("../test/db-testutils.mjs");
    return expect(dbTestutils).resolves.toBeDefined();
});

test("asserter import ok?", () => {
    const asserter = import("../test/asserter.mjs");
    return expect(asserter).resolves.toBeDefined();
});

test("rtz import ok?", () => {
    const rtz = import("../marine/rtz.mjs");
    return expect(rtz).resolves.toBeDefined();
});

test("idUtils import ok?", () => {
    const idUtils = import("../marine/id_utils.mjs");
    return expect(idUtils).resolves.toBeDefined();
});

test("apiModel import ok?", () => {
    const apiModel = import("../utils/api-model.mjs");
    return expect(apiModel).resolves.toBeDefined();
});

test("logging import ok?", () => {
    const logging = import("../utils/logging.mjs");
    return expect(logging).resolves.toBeDefined();
});

test("base64 import ok?", () => {
    const base64 = import("../utils/base64.mjs");
    return expect(base64).resolves.toBeDefined();
});

test("dateUtils import ok?", () => {
    const dateUtils = import("../utils/date-utils.mjs");
    return expect(dateUtils).resolves.toBeDefined();
});

test("geojsonTypes import ok?", () => {
    const geojsonTypes = import("../utils/geojson-types.mjs");
    return expect(geojsonTypes).resolves.toBeDefined();
});

test("slack import ok?", () => {
    const slack = import("../utils/slack.mjs");
    return expect(slack).resolves.toBeDefined();
});

test("utils import ok?", () => {
    const utils = import("../utils/utils.mjs");
    return expect(utils).resolves.toBeDefined();
});

test("retry import ok?", () => {
    const retry = import("../utils/retry.mjs");
    return expect(retry).resolves.toBeDefined();
});

test("geometry import ok?", () => {
    const geometry = import("../utils/geometry.mjs");
    return expect(geometry).resolves.toBeDefined();
});

test("sqsIntegration import ok?", () => {
    const sqsIntegration = import("../aws/infra/sqs-integration.mjs");
    return expect(sqsIntegration).resolves.toBeDefined();
});

test("networkStack import ok?", () => {
    const networkStack = import("../aws/infra/stacks/network-stack.mjs");
    return expect(networkStack).resolves.toBeDefined();
});

test("dbStack import ok?", () => {
    const dbStack = import("../aws/infra/stacks/db-stack.mjs");
    return expect(dbStack).resolves.toBeDefined();
});

test("dbProxyStack import ok?", () => {
    const dbProxyStack = import("../aws/infra/stacks/db-proxy-stack.mjs");
    return expect(dbProxyStack).resolves.toBeDefined();
});

test("intraStackConfiguration import ok?", () => {
    const intraStackConfiguration = import("../aws/infra/stacks/intra-stack-configuration.mjs");
    return expect(intraStackConfiguration).resolves.toBeDefined();
});

test("dbDnsStack import ok?", () => {
    const dbDnsStack = import("../aws/infra/stacks/db-dns-stack.mjs");
    return expect(dbDnsStack).resolves.toBeDefined();
});

test("documentation import ok?", () => {
    const documentation = import("../aws/infra/documentation.mjs");
    return expect(documentation).resolves.toBeDefined();
});

test("usagePlans import ok?", () => {
    const usagePlans = import("../aws/infra/usage-plans.mjs");
    return expect(usagePlans).resolves.toBeDefined();
});

test("scheduler import ok?", () => {
    const scheduler = import("../aws/infra/scheduler.mjs");
    return expect(scheduler).resolves.toBeDefined();
});

test("importUtil import ok?", () => {
    const importUtil = import("../aws/infra/import-util.mjs");
    return expect(importUtil).resolves.toBeDefined();
});

test("sqsQueue import ok?", () => {
    const sqsQueue = import("../aws/infra/sqs-queue.mjs");
    return expect(sqsQueue).resolves.toBeDefined();
});

test("response import ok?", () => {
    const response = import("../aws/infra/api/response.mjs");
    return expect(response).resolves.toBeDefined();
});

test("staticIntegration import ok?", () => {
    const staticIntegration = import("../aws/infra/api/static-integration.mjs");
    return expect(staticIntegration).resolves.toBeDefined();
});

test("responses import ok?", () => {
    const responses = import("../aws/infra/api/responses.mjs");
    return expect(responses).resolves.toBeDefined();
});

test("handlerFactory import ok?", () => {
    const handlerFactory = import("../aws/infra/api/handler-factory.mjs");
    return expect(handlerFactory).resolves.toBeDefined();
});

test("integration import ok?", () => {
    const integration = import("../aws/infra/api/integration.mjs");
    return expect(integration).resolves.toBeDefined();
});

test("stackCheckingAspect import ok?", () => {
    const stackCheckingAspect = import("../aws/infra/stack/stack-checking-aspect.mjs");
    return expect(stackCheckingAspect).resolves.toBeDefined();
});

test("restApis import ok?", () => {
    const restApis = import("../aws/infra/stack/rest_apis.mjs");
    return expect(restApis).resolves.toBeDefined();
});

test("lambdaConfigs import ok?", () => {
    const lambdaConfigs = import("../aws/infra/stack/lambda-configs.mjs");
    return expect(lambdaConfigs).resolves.toBeDefined();
});

test("monitoredfunction import ok?", () => {
    const monitoredfunction = import("../aws/infra/stack/monitoredfunction.mjs");
    return expect(monitoredfunction).resolves.toBeDefined();
});

test("subscription import ok?", () => {
    const subscription = import("../aws/infra/stack/subscription.mjs");
    return expect(subscription).resolves.toBeDefined();
});

test("parameters import ok?", () => {
    const parameters = import("../aws/infra/stack/parameters.mjs");
    return expect(parameters).resolves.toBeDefined();
});

test("stack import ok?", () => {
    const stack = import("../aws/infra/stack/stack.mjs");
    return expect(stack).resolves.toBeDefined();
});

test("securityRule import ok?", () => {
    const securityRule = import("../aws/infra/security-rule.mjs");
    return expect(securityRule).resolves.toBeDefined();
});

test("canary import ok?", () => {
    const canary = import("../aws/infra/canaries/canary.mjs");
    return expect(canary).resolves.toBeDefined();
});

test("databaseCanary import ok?", () => {
    const databaseCanary = import("../aws/infra/canaries/database-canary.mjs");
    return expect(databaseCanary).resolves.toBeDefined();
});

test("canaryAlarm import ok?", () => {
    const canaryAlarm = import("../aws/infra/canaries/canary-alarm.mjs");
    return expect(canaryAlarm).resolves.toBeDefined();
});

test("canaryRole import ok?", () => {
    const canaryRole = import("../aws/infra/canaries/canary-role.mjs");
    return expect(canaryRole).resolves.toBeDefined();
});

test("urlCanary import ok?", () => {
    const urlCanary = import("../aws/infra/canaries/url-canary.mjs");
    return expect(urlCanary).resolves.toBeDefined();
});

test("canaryParameters import ok?", () => {
    const canaryParameters = import("../aws/infra/canaries/canary-parameters.mjs");
    return expect(canaryParameters).resolves.toBeDefined();
});

test("canaryKeys import ok?", () => {
    const canaryKeys = import("../aws/infra/canaries/canary-keys.mjs");
    return expect(canaryKeys).resolves.toBeDefined();
});

test("proxytypes import ok?", () => {
    const proxytypes = import("../aws/types/proxytypes.mjs");
    return expect(proxytypes).resolves.toBeDefined();
});

test("tags import ok?", () => {
    const tags = import("../aws/types/tags.mjs");
    return expect(tags).resolves.toBeDefined();
});

test("mediatypes import ok?", () => {
    const mediatypes = import("../aws/types/mediatypes.mjs");
    return expect(mediatypes).resolves.toBeDefined();
});

test("modelWithReference import ok?", () => {
    const modelWithReference = import("../aws/types/model-with-reference.mjs");
    return expect(modelWithReference).resolves.toBeDefined();
});

test("errors import ok?", () => {
    const errors = import("../aws/types/errors.mjs");
    return expect(errors).resolves.toBeDefined();
});

test("lambdaResponse import ok?", () => {
    const lambdaResponse = import("../aws/types/lambda-response.mjs");
    return expect(lambdaResponse).resolves.toBeDefined();
});

test("dtLoggerDefault import ok?", () => {
    const dtLoggerDefault = import("../aws/runtime/dt-logger-default.mjs");
    return expect(dtLoggerDefault).resolves.toBeDefined();
});

test("secret import ok?", () => {
    const secret = import("../aws/runtime/secrets/secret.mjs");
    return expect(secret).resolves.toBeDefined();
});

test("proxyHolder import ok?", () => {
    const proxyHolder = import("../aws/runtime/secrets/proxy-holder.mjs");
    return expect(proxyHolder).resolves.toBeDefined();
});

test("dbsecret import ok?", () => {
    const dbsecret = import("../aws/runtime/secrets/dbsecret.mjs");
    return expect(dbsecret).resolves.toBeDefined();
});

test("rdsHolder import ok?", () => {
    const rdsHolder = import("../aws/runtime/secrets/rds-holder.mjs");
    return expect(rdsHolder).resolves.toBeDefined();
});

test("secretHolder import ok?", () => {
    const secretHolder = import("../aws/runtime/secrets/secret-holder.mjs");
    return expect(secretHolder).resolves.toBeDefined();
});

test("dtLogger import ok?", () => {
    const dtLogger = import("../aws/runtime/dt-logger.mjs");
    return expect(dtLogger).resolves.toBeDefined();
});

test("s3 import ok?", () => {
    const s3 = import("../aws/runtime/s3.mjs");
    return expect(s3).resolves.toBeDefined();
});

/*
temporary disable, enable after sdk v2 is kicked out
test('apikey import ok?', () => {
  const apikey = import("../aws/runtime/apikey.mjs");
  return expect(apikey).resolves.toBeDefined();
});*/

test("environment import ok?", () => {
    const environment = import("../aws/runtime/environment.mjs");
    return expect(environment).resolves.toBeDefined();
});

test("digitrafficIntegrationResponse import ok?", () => {
    const digitrafficIntegrationResponse = import("../aws/runtime/digitraffic-integration-response.mjs");
    return expect(digitrafficIntegrationResponse).resolves.toBeDefined();
});

/*
 * Näitä ei testata, koska ne importtaa synthetics kirjaston, jolle ei ole mitään vastinetta npm:ssä. Lambdaympäristöstä
 * löytyy toi kirjasto.
 */
//const databaseChecker = import("../aws/infra/canaries/database-checker.mjs");
//const urlChecker = import("../aws/infra/canaries/url-checker.mjs");
