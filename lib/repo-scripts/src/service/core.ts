import _ from "lodash";

// Hack for camelCase. Some problem with ESM and jest.
// @ts-ignore
const camelCase: typeof _.camelCase = (x) => _.camelCase(x);

export function renameKeys(obj: object): object {
    if (_.isArray(obj)) {
        return _.map(obj, renameKeys);
    }
    if (_.isObject(obj)) {
        const camelKeys = _.mapKeys(obj, (_, key) => camelCase(key));
        return _.mapValues(camelKeys, renameKeys);
    }

    return obj;
}

// eslint-disable-next-line @rushstack/no-new-null
export function isValue<T>(value: T | undefined | null): value is T {
    return !_.isEmpty(value);
}
