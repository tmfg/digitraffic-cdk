export const WIDE_CONTEXT = {
  TRACE_ID: "customTrace_id",

  LOGGING: {
    CONTEXT: "customLogging.context",
  },

  HTTP_KEYS: {
    DURATION: "customHttp.client.request.duration",
    ERROR_TYPE: "customRequest.error.type",
    STATUS_CODE: "customHttp.response.status_code",
    URL: "customRequest.url.full",
    URL_TEMPLATE: "customRequest.url.template",
    CONTENT_LENGTH: "customHttp.response.body.size",
  } as const,
} as const;
