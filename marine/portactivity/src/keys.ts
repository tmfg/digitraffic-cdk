export enum PortactivityEnvKeys {
  SECRET_ID = "SECRET_ID",
  PORTACTIVITY_QUEUE_URL = "SQS_QUEUE_URL",
  PUBLISH_TOPIC_ARN = "PUBLISH_TOPIC_ARN",
  BUCKET_NAME = "BUCKET_NAME",
  ENABLE_ETB = "ENABLE_ETB",
}

export enum PortactivitySecretKeys {
  PILOTWEB_URL = "pilotweb.url",
  PILOTWEB_AUTH = "pilotweb.auth",
  TEQPLAY_QUEUE = "teqplay.queue",
  SCHEDULES_URL = "schedules.url",
  AWAKE_URL = "voyagesurl",
  AWAKE_OAUTH_TOKEN_ENDPOINT = "oAuthTokenEndpoint",
  AWAKE_OAUTH_CLIENT_ID = "oAuthClientId",
  AWAKE_OAUTH_CLIENT_SECRET = "oAuthClientSecret",
  AWAKE_ATX_URL = "atxurl",
}

export enum PortActivityParameterKeys {
  AWAKE_ATX_SUBSCRIPTION_ID = "AWAKE_ATX_SUBSCRIPTION_ID",
}
