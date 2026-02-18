import { cloneDeep, set } from "lodash-es";

/**
 * Returns new copy of given object, with given path undefined
 */
export function cloneAndUndefine(message: object, ...path: string[]): object {
  return set(cloneDeep(message), path, undefined);
}

/**
 * Undefines a given path from the given object
 */
export function undefine(message: object, ...path: string[]): void {
  set(message, path, undefined);
}
