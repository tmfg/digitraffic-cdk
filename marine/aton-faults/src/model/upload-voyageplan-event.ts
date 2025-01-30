export interface UploadVoyagePlanEvent {
  /**
   * Endpoint URL for callback
   */
  readonly callbackEndpoint?: string;

  /**
   * The route in RTZ format
   */
  readonly voyagePlan: string;
}

export enum S124Type {
  WARNING,
  FAULT,
}

export interface SendS124Event {
  /**
   * Endpoint URL for callback
   */
  readonly callbackEndpoint: string;

  readonly type: S124Type;

  /**
   * Fault/Warning id
   */
  readonly id: number;
}
