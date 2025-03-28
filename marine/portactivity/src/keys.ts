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
  ETAS_URL = "etas.url",
  ETAS_AUTH_URL = "etas.auth_url",
  ETAS_CLIENT_ID = "etas.client_id",
  ETAS_CLIENT_SECRET = "etas.client_secret",
  ETAS_AUDIENCE = "etas.audience",
  AWAKE_URL = "voyagesurl",
  AWAKE_AUTH = "voyagesauth",
  AWAKE_ATX_URL = "atxurl",
  AWAKE_ATX_AUTH = "atxauth",
}

export enum PortActivityParameterKeys {
  AWAKE_ATX_SUBSCRIPTION_ID = "AWAKE_ATX_SUBSCRIPTION_ID",
}
