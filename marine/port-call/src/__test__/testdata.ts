import type { NemoVisit } from "../model/nemo.js";

export function createTestVisit(visitId: string = "VISIT_ID", portIdentification: string = "PORT1"): NemoVisit {
    return {
        visitId,
        latestUpdateTime: new Date(),
        portCall: {
            vesselInformation: {
                identification: "TESTI",
                name: "Testvessel"
            },
            voyageInformation: {
                portIdentification,
                estimatedArrivalDateTime: new Date(),
                estimatedDepartureDateTime: new Date()
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
