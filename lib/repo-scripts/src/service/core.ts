import _ from "lodash";

export function snakeToCamel(str: string): string {
    return str
        .toLowerCase()
        .replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace("-", "").replace("_", ""));
}

export function renameKeys(obj: object): object {
    if (_.isArray(obj)) {
        return _.map(obj, renameKeys);
    }
    if (_.isObject(obj)) {
        const camelKeys = _.mapKeys(obj, (_, key) => snakeToCamel(key));
        return _.mapValues(camelKeys, renameKeys);
    }

    return obj;
}
