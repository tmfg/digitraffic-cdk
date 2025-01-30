export class AsyncTimeoutError extends Error {
  constructor() {
    super("Async operation timed out");
  }
}
