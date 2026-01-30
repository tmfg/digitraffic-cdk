import {
  ALL_ACCOUNTS_FILTER_REGEX,
  getAccountNameOsFilterFromTransportTypeName,
  getUriFiltersFromPath,
} from "../../util/filter.js";

test("transport type to account name filter string conversion works", async () => {
  const railAccountFilter = getAccountNameOsFilterFromTransportTypeName("rail");
  expect(railAccountFilter).toEqual(
    `accountName.keyword:${process.env["RAIL_ACCOUNT_NAME"]}`,
  );
  const roadAccountFilter = getAccountNameOsFilterFromTransportTypeName("road");
  expect(roadAccountFilter).toEqual(
    `accountName.keyword:${process.env["ROAD_ACCOUNT_NAME"]}`,
  );
  const marineAccountFilter =
    getAccountNameOsFilterFromTransportTypeName("marine");
  expect(marineAccountFilter).toEqual(
    `accountName.keyword:${process.env["MARINE_ACCOUNT_NAME"]}`,
  );
  const allAccountsFilter = getAccountNameOsFilterFromTransportTypeName("*");
  expect(allAccountsFilter).toContain(
    `accountName.keyword:${process.env["MARINE_ACCOUNT_NAME"]}`,
  );
  expect(allAccountsFilter).toContain(
    `accountName.keyword:${process.env["ROAD_ACCOUNT_NAME"]}`,
  );
  expect(allAccountsFilter).toContain(
    `accountName.keyword:${process.env["RAIL_ACCOUNT_NAME"]}`,
  );
  expect(allAccountsFilter).toMatch(ALL_ACCOUNTS_FILTER_REGEX);
});

test("uri filters without trailing slash", async () => {
  const path = "/api/data/v1/test";
  const filters = getUriFiltersFromPath(path);
  expect(filters.osFilter).toMatch(`request:\\"${path}*\\"`);
  expect(filters.dbFilter).toMatch(`@fields.request_uri:\\"${path}\\"`);
});

test("uri filters with trailing slash", async () => {
  const path = "/api/data/v1/test";
  const pathWithTrailingSlash = "/api/data/v1/test/";
  const filters = getUriFiltersFromPath(pathWithTrailingSlash);
  expect(filters.osFilter).toMatch(`request:\\"${path}*\\"`);
  expect(filters.dbFilter).toMatch(
    `@fields.request_uri:\\"${pathWithTrailingSlash}\\"`,
  );
});
