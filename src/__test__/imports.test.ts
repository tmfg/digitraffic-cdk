import { expect, test } from "vitest";

const IMPORT_TEST_TIMEOUT_MS = 15_000;

function expectImportOk(name: string, path: string): void {
  test(
    name,
    async () => {
      await expect(import(path)).resolves.toBeDefined();
    },
    IMPORT_TEST_TIMEOUT_MS,
  );
}

expectImportOk("index import ok?", "../index.js");
expectImportOk("database import ok?", "../database/database.js");
expectImportOk("models import ok?", "../database/models.js");
expectImportOk("lastUpdated import ok?", "../database/last-updated.js");
expectImportOk("urn import ok?", "../types/urn.js");
expectImportOk("utilTypes import ok?", "../types/util-types.js");
expectImportOk("either import ok?", "../types/either.js");
expectImportOk("validator import ok?", "../types/validator.js");
expectImportOk("nullable import ok?", "../types/nullable.js");
expectImportOk(
  "asyncTimeoutError import ok?",
  "../types/async-timeout-error.js",
);
expectImportOk("inputError import ok?", "../types/input-error.js");
expectImportOk("httpError import ok?", "../types/http-error.js");
expectImportOk("language import ok?", "../types/language.js");
expectImportOk("traffictype import ok?", "../types/traffictype.js");
expectImportOk("testutils import ok?", "../__test__/testutils.js");
expectImportOk("dbTestutils import ok?", "../__test__/db-testutils.js");
expectImportOk("asserter import ok?", "../__test__/asserter.js");
expectImportOk("rtz import ok?", "../marine/rtz.js");
expectImportOk("idUtils import ok?", "../marine/id_utils.js");
expectImportOk("apiModel import ok?", "../utils/api-model.js");
expectImportOk("logging import ok?", "../utils/logging.js");
expectImportOk("base64 import ok?", "../utils/base64.js");
expectImportOk("dateUtils import ok?", "../utils/date-utils.js");
expectImportOk("geojsonTypes import ok?", "../utils/geojson-types.js");
expectImportOk("slack import ok?", "../utils/slack.js");
expectImportOk("stopWatch import ok?", "../utils/stop-watch.js");
expectImportOk("utils import ok?", "../utils/utils.js");
expectImportOk("retry import ok?", "../utils/retry.js");
expectImportOk("geometry import ok?", "../utils/geometry.js");
expectImportOk("sqsIntegration import ok?", "../aws/infra/sqs-integration.js");
expectImportOk(
  "networkStack import ok?",
  "../aws/infra/stacks/network-stack.js",
);
expectImportOk("dbStack import ok?", "../aws/infra/stacks/db-stack.js");
expectImportOk(
  "dbProxyStack import ok?",
  "../aws/infra/stacks/db-proxy-stack.js",
);
expectImportOk(
  "intraStackConfiguration import ok?",
  "../aws/infra/stacks/intra-stack-configuration.js",
);
expectImportOk("dbDnsStack import ok?", "../aws/infra/stacks/db-dns-stack.js");
expectImportOk("documentation import ok?", "../aws/infra/documentation.js");
expectImportOk("usagePlans import ok?", "../aws/infra/usage-plans.js");
expectImportOk("scheduler import ok?", "../aws/infra/scheduler.js");
expectImportOk("importUtil import ok?", "../aws/infra/import-util.js");
expectImportOk("sqsQueue import ok?", "../aws/infra/sqs-queue.js");
expectImportOk("response import ok?", "../aws/infra/api/response.js");
expectImportOk(
  "staticIntegration import ok?",
  "../aws/infra/api/static-integration.js",
);
expectImportOk("responses import ok?", "../aws/infra/api/responses.js");
expectImportOk(
  "handlerFactory import ok?",
  "../aws/infra/api/handler-factory.js",
);
expectImportOk("integration import ok?", "../aws/infra/api/integration.js");
expectImportOk(
  "stackCheckingAspect import ok?",
  "../aws/infra/stack/stack-checking-aspect.js",
);
expectImportOk("restApis import ok?", "../aws/infra/stack/rest-api.js");
expectImportOk(
  "lambdaConfigs import ok?",
  "../aws/infra/stack/lambda-configs.js",
);
expectImportOk(
  "monitoredfunction import ok?",
  "../aws/infra/stack/monitoredfunction.js",
);
expectImportOk("subscription import ok?", "../aws/infra/stack/subscription.js");
expectImportOk("parameters import ok?", "../aws/infra/stack/parameters.js");
expectImportOk("stack import ok?", "../aws/infra/stack/stack.js");
expectImportOk("securityRule import ok?", "../aws/infra/security-rule.js");
expectImportOk("canary import ok?", "../aws/infra/canaries/canary.js");
expectImportOk(
  "databaseCanary import ok?",
  "../aws/infra/canaries/database-canary.js",
);
expectImportOk(
  "canaryAlarm import ok?",
  "../aws/infra/canaries/canary-alarm.js",
);
expectImportOk("canaryRole import ok?", "../aws/infra/canaries/canary-role.js");
expectImportOk("urlCanary import ok?", "../aws/infra/canaries/url-canary.js");
expectImportOk(
  "canaryParameters import ok?",
  "../aws/infra/canaries/canary-parameters.js",
);
expectImportOk("canaryKeys import ok?", "../aws/infra/canaries/canary-keys.js");
expectImportOk(
  "lambda-proxy-types import ok?",
  "../aws/types/lambda-proxy-types.js",
);
expectImportOk("tags import ok?", "../aws/types/tags.js");
expectImportOk("mediatypes import ok?", "../aws/types/mediatypes.js");
expectImportOk(
  "modelWithReference import ok?",
  "../aws/types/model-with-reference.js",
);
expectImportOk("errors import ok?", "../aws/types/errors.js");
expectImportOk("lambdaResponse import ok?", "../aws/types/lambda-response.js");
expectImportOk(
  "dtLoggerDefault import ok?",
  "../aws/runtime/dt-logger-default.js",
);
expectImportOk("secret import ok?", "../aws/runtime/secrets/secret.js");
expectImportOk(
  "proxyHolder import ok?",
  "../aws/runtime/secrets/proxy-holder.js",
);
expectImportOk("dbsecret import ok?", "../aws/runtime/secrets/dbsecret.js");
expectImportOk("rdsHolder import ok?", "../aws/runtime/secrets/rds-holder.js");
expectImportOk(
  "secretHolder import ok?",
  "../aws/runtime/secrets/secret-holder.js",
);
expectImportOk("dtLogger import ok?", "../aws/runtime/dt-logger.js");
expectImportOk("s3 import ok?", "../aws/runtime/s3.js");

/*
temporary disable, enable after sdk v2 is kicked out
test('apikey import ok?', () => {
  const apikey = import("../aws/runtime/apikey.js");
  return expect(apikey).resolves.toBeDefined();
});*/

expectImportOk("environment import ok?", "../aws/runtime/environment.js");
expectImportOk(
  "digitrafficIntegrationResponse import ok?",
  "../aws/runtime/digitraffic-integration-response.js",
);

/*
 * Näitä ei testata, koska ne importtaa synthetics kirjaston, jolle ei ole mitään vastinetta npm:ssä. Lambdaympäristöstä
 * löytyy toi kirjasto.
 */
//const databaseChecker = import("../aws/infra/canaries/database-checker.mjs");
//const urlChecker = import("../aws/infra/canaries/url-checker.mjs");
