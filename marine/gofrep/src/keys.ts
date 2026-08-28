export enum VoyagePlanEnvKeys {
  SECRET_ID = "SECRET_ID",
  TOPIC_ARN = "TOPIC_ARN",
  QUEUE_URL = "QUEUE_URL",
}

// TODO: remove this unused GOFREP enum. The schedules keys are used by the separate Voyage Plan Gateway project.
export enum VoyagePlanSecretKeys {
  SCHEDULES_ACCESS_TOKEN = "vpgw.schedulesAccessToken",
  SCHEDULES_URL = "vpgw.schedulesUrl",
  HMAC = "vpgw.hmac",
}
