export const WIDE_CONTEXT = {
  METHOD: "method",
  TRACE_ID: "customTrace_id",
  CONTEXT: "context",
  DURATION: "duration",

  HTTP_KEYS: {
    // temporary keys, change to url.full etc later
    URL: "customUrl_full",
    URL_TEMPLATE: "customUrl_template",
    ERROR_TYPE: "customError_type",

    DURATION: "customHttp.client.request.duration",
    STATUS_CODE: "customHttp.response.status_code",
    CONTENT_LENGTH: "customHttp.response.body.size",
  } as const,

  OUTCOME: {
    KEY: "customOutcome",
    VALUE_SUCCESS: "success",
    VALUE_ERROR: "error",
  } as const,

  DB_MAINTENANCE: {
    KEY_CLEANUP: "customMaintenance.db.cleanup.enabled",
    KEY_TABLENAME: "customMaintenance.db.table.name",
    KEY_DELETED_COUNT: "customMaintenance.db.cleanup.deleted.count",
    KEY_BATCH_SIZE: "customMaintenance.db.cleanup.batch.size",
  } as const,
} as const;
