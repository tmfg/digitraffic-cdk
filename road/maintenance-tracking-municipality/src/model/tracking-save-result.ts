export const UNKNOWN_TASK_NAME = "UNKNOWN";

export class TrackingSaveResult {
  saved: number;
  errors: number;
  sizeBytes: number;

  constructor(sizeBytes: number, saved: number, errors: number) {
    this.saved = saved;
    this.errors = errors;
    this.sizeBytes = sizeBytes;
  }

  static createSaved(sizeBytes: number, saved: number = 1): TrackingSaveResult {
    return new TrackingSaveResult(sizeBytes, saved, 0);
  }

  static createError(sizeBytes: number): TrackingSaveResult {
    return new TrackingSaveResult(sizeBytes, 0, 1);
  }

  add(other: TrackingSaveResult): this {
    this.saved += other.saved;
    this.errors += other.errors;
    this.sizeBytes += other.sizeBytes;
    return this;
  }

  addSaved(sizeBytes: number): TrackingSaveResult {
    this.saved += 1;
    this.sizeBytes += sizeBytes;
    return this;
  }

  addError(sizeBytes: number): TrackingSaveResult {
    this.errors += 1;
    this.sizeBytes += sizeBytes;
    return this;
  }
}
