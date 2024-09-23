import {
    ALL_ACCOUNTS_FILTER_REGEX,
    getAccountNameOsFilterFromTransportTypeName,
    getTransportTypeDbFilterFromAccountNameFilter
} from "../../util/filter.js";

test("account name to transport type filter string conversion works", async () => {
    const railTransportTypeFilter = getTransportTypeDbFilterFromAccountNameFilter(
        `accountName.keyword:${process.env[
            "RAIL_ACCOUNT_NAME"
        ]!} AND @fields.request_uri:"/api/v1/live-trains/"`
    );
    expect(railTransportTypeFilter).toEqual(
        `@transport_type:rail AND @fields.request_uri:"/api/v1/live-trains/"`
    );
    const roadTransportTypeFilter = getTransportTypeDbFilterFromAccountNameFilter(
        `accountName.keyword:${process.env["ROAD_ACCOUNT_NAME"]!}`
    );
    expect(roadTransportTypeFilter).toEqual(`@transport_type:road`);
    const marineTransportTypeFilter = getTransportTypeDbFilterFromAccountNameFilter(
        `accountName.keyword:${process.env["MARINE_ACCOUNT_NAME"]!}`
    );
    expect(marineTransportTypeFilter).toEqual(`@transport_type:marine`);

    const allAccountsFilter1 = getTransportTypeDbFilterFromAccountNameFilter(
        `(accountName.keyword:${process.env["MARINE_ACCOUNT_NAME"]!} OR accountName.keyword:${process.env[
            "RAIL_ACCOUNT_NAME"
        ]!} OR accountName.keyword:${process.env["ROAD_ACCOUNT_NAME"]!})`
    );
    expect(allAccountsFilter1).toEqual(`@transport_type:*`);
    // the order shouldn't matter
    const allAccountsFilter2 = getTransportTypeDbFilterFromAccountNameFilter(
        `(accountName.keyword:${process.env["ROAD_ACCOUNT_NAME"]!} OR accountName.keyword:${process.env[
            "MARINE_ACCOUNT_NAME"
        ]!} OR accountName.keyword:${process.env["RAIL_ACCOUNT_NAME"]!})`
    );
    expect(allAccountsFilter2).toEqual(`@transport_type:*`);
});

test("transport type to account name filter string conversion works", async () => {
    const railAccountFilter = getAccountNameOsFilterFromTransportTypeName("rail");
    expect(railAccountFilter).toEqual(`accountName.keyword:${process.env["RAIL_ACCOUNT_NAME"]}`);
    const roadAccountFilter = getAccountNameOsFilterFromTransportTypeName("road");
    expect(roadAccountFilter).toEqual(`accountName.keyword:${process.env["ROAD_ACCOUNT_NAME"]}`);
    const marineAccountFilter = getAccountNameOsFilterFromTransportTypeName("marine");
    expect(marineAccountFilter).toEqual(`accountName.keyword:${process.env["MARINE_ACCOUNT_NAME"]}`);
    const allAccountsFilter = getAccountNameOsFilterFromTransportTypeName("*");
    expect(allAccountsFilter).toContain(`accountName.keyword:${process.env["MARINE_ACCOUNT_NAME"]}`);
    expect(allAccountsFilter).toContain(`accountName.keyword:${process.env["ROAD_ACCOUNT_NAME"]}`);
    expect(allAccountsFilter).toContain(`accountName.keyword:${process.env["RAIL_ACCOUNT_NAME"]}`);
    expect(allAccountsFilter).toMatch(ALL_ACCOUNTS_FILTER_REGEX);
});
