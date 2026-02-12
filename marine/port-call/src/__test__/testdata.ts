import type { NemoVisit } from "../model/nemo.js";
import type { VisitStatus } from "../model/visit-schema.js";

export function createTestVisit(
  visitId: string = "VISIT_ID",
  portIdentification: string = "PORT1",
  vesselName: string = "Testvessel",
  identification: string = "TESTI",
  status: VisitStatus = "Expected to Arrive",
): NemoVisit {
  return {
    visitId,
    latestUpdateTime: new Date(),
    portCall: {
      vesselInformation: {
        identification,
        name: vesselName,
      },
      voyageInformation: {
        portIdentification,
        estimatedArrivalDateTime: new Date(),
        estimatedDepartureDateTime: new Date(),
      },
      arrivalNotification: {
        actualArrivalDateTime: null,
      },
      departureNotification: {
        actualDepartureDateTime: null,
      },
      portCallStatus: {
        status,
      },
    },
  };
}
