import type { NemoVisit } from "../model/nemo.js";
import { roundToNearestMinutes } from "date-fns";

/// creates NemoVisit for testing.  Times are rounded to nearest minute to make verifying easier, database rounds milliseconds off
export function createTestVisit(visitId: string = "VISIT_ID", portIdentification: string = "PORT1"): NemoVisit {
    return {
        visitId,
        latestUpdateTime: roundToNearestMinutes(new Date()).toISOString(),
        portCall: {
            vesselInformation: {
                identification: "TESTI",
                name: "Testvessel"
            },
            voyageInformation: {
                portIdentification,
                estimatedArrivalDateTime: roundToNearestMinutes(new Date()).toISOString(),
                estimatedDepartureDateTime: roundToNearestMinutes(new Date()).toISOString()
            },
            arrivalNotification: {
                actualArrivalDateTime: null,
            },
            departureNotification: {
                actualDepartureDateTime: null
            },
            portCallStatus: {
                status: "Expected to Arrive"
            }
        }
    };;
}
