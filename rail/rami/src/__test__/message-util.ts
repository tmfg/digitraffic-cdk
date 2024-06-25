import _ from "lodash";

/**
 * Returns new copy of given object, with given path undefined
 */
export function cloneAndUndefine(message: object, ...path: string[]): object {
    return _.set(
        _.cloneDeep(message),
        path,
        undefined
    );
}

/**
 * Undefines a given path from the given object
 */
export function undefine(message: object, ...path: string[]): void {
    _.set(
        message,
        path,
        undefined
    );
}