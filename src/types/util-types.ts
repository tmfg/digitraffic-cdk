export type ValueOf<Obj> = Obj[keyof Obj];

/**
 * Type-level conversion from readonly object to mutable object. Use with caution!
 *
 * Only converts in the type-level. Caution must be used, as the typescript cannot enforce readonly-ness at
 * runtime. This is only useful for type-checking and especially in cases where 3rd party code requires
 * mutable even though it is not needed.
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };
