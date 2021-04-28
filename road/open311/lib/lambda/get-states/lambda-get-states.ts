import * as StatesService from "../../service/states";
import {ServiceRequestState} from "../../model/service-request-state";
import {Locale} from "../../model/locale";
import {LocaleEvent} from "../lambda-common";

export const handler = async (event: LocaleEvent): Promise<ServiceRequestState[]> => {
    return await StatesService.findAll(event.locale && event.locale.length ? event.locale : Locale.ENGLISH);
};
