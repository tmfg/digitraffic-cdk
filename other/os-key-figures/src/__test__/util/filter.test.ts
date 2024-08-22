import {
    ALL_ACCOUNTS_FILTER_REGEX,
    getAccountNameFilterFromTransportTypeName,
    getTransportTypeFilterFromAccountNameFilter
} from "../../util/filter.js";

test("account name to transport type filter string conversion works", async () => {
    const railTransportTypeFilter = getTransportTypeFilterFromAccountNameFilter(
        `accountName:${process.env["RAIL_ACCOUNT_NAME"]!}`
    );
    expect(railTransportTypeFilter).toEqual(`@transport_type:rail`);
    const roadTransportTypeFilter = getTransportTypeFilterFromAccountNameFilter(
        `accountName:${process.env["ROAD_ACCOUNT_NAME"]!}`
    );
    expect(roadTransportTypeFilter).toEqual(`@transport_type:road`);
    const marineTransportTypeFilter = getTransportTypeFilterFromAccountNameFilter(
        `accountName:${process.env["MARINE_ACCOUNT_NAME"]!}`
    );
    expect(marineTransportTypeFilter).toEqual(`@transport_type:marine`);

    const allAccountsFilter1 = getTransportTypeFilterFromAccountNameFilter(
        `(accountName:${process.env["MARINE_ACCOUNT_NAME"]!} OR accountName:${process.env[
            "RAIL_ACCOUNT_NAME"
        ]!} OR accountName:${process.env["ROAD_ACCOUNT_NAME"]!})`
    );
    expect(allAccountsFilter1).toEqual(`@transport_type:*`);
    // the order shouldn't matter
    const allAccountsFilter2 = getTransportTypeFilterFromAccountNameFilter(
        `(accountName:${process.env["ROAD_ACCOUNT_NAME"]!} OR accountName:${process.env[
            "MARINE_ACCOUNT_NAME"
        ]!} OR accountName:${process.env["RAIL_ACCOUNT_NAME"]!})`
    );
    expect(allAccountsFilter2).toEqual(`@transport_type:*`);
});

test("transport type to account name filter string conversion works", async () => {
    const railAccountFilter = getAccountNameFilterFromTransportTypeName("rail");
    expect(railAccountFilter).toEqual(`accountName:${process.env["RAIL_ACCOUNT_NAME"]}`);
    const roadAccountFilter = getAccountNameFilterFromTransportTypeName("road");
    expect(roadAccountFilter).toEqual(`accountName:${process.env["ROAD_ACCOUNT_NAME"]}`);
    const marineAccountFilter = getAccountNameFilterFromTransportTypeName("marine");
    expect(marineAccountFilter).toEqual(`accountName:${process.env["MARINE_ACCOUNT_NAME"]}`);
    const allAccountsFilter = getAccountNameFilterFromTransportTypeName("*");
    expect(allAccountsFilter).toContain(`accountName:${process.env["MARINE_ACCOUNT_NAME"]}`);
    expect(allAccountsFilter).toContain(`accountName:${process.env["ROAD_ACCOUNT_NAME"]}`);
    expect(allAccountsFilter).toContain(`accountName:${process.env["RAIL_ACCOUNT_NAME"]}`);
    expect(allAccountsFilter).toMatch(ALL_ACCOUNTS_FILTER_REGEX);
});
