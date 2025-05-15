export interface DlqMessage {
  readonly messageType: string;
  readonly message: unknown;
  readonly errors: string;
}
