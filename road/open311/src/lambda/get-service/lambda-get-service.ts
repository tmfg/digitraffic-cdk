import * as ServicesService from "../../service/services.js";
import { NOT_FOUND_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";
import type { Service } from "../../model/service.js";

export const handler = async (
  event: { service_id: string },
): Promise<Service> => {
  const service = await ServicesService.find(event.service_id);
  if (!service) {
    throw new Error(NOT_FOUND_MESSAGE);
  }
  return service;
};
