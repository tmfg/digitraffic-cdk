export interface EitherOk<T> {
    result: "ok";
    value: T;
}
export interface EitherError {
    result: "error";
    message: string;
}
export type Either<T> = EitherOk<T> | EitherError;
