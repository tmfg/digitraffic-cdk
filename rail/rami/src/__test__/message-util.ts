import _ from "lodash";

export function copyAndUndefine(message: object, ...path: string[]): object {
    return _.set(
        _.cloneDeep(message),
        path,
        undefined
    );
}

export function undefine(message: object, ...path: string[]): object {
    return _.set(
        message,
        path,
        undefined
    );

}