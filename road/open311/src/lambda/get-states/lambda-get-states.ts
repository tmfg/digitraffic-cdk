import * as StatesService from "../../service/states.js";
import type { ServiceRequestState } from "../../model/service-request-state.js";
import { Locale } from "../../model/locale.js";
import type { LocaleEvent } from "../lambda-common.js";

export const handler = (event: LocaleEvent): Promise<ServiceRequestState[]> => {
  return StatesService.findAll(
    event.locale && event.locale.length ? event.locale : Locale.ENGLISH,
  );
};
