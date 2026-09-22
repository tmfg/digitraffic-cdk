import type { NemoVisit } from "../model/nemo.js";
import type { VisitStatus } from "../model/visit-schema.js";

export interface TestVisitOptions {
  readonly visitId?: string;
  readonly portIdentification?: string;
  readonly vesselName?: string;
  readonly identification?: string;
  readonly status?: VisitStatus;
  readonly eta?: Date;
  readonly etd?: Date | null;
  readonly ata?: Date | null;
  readonly atd?: Date | null;
}

export function createTestVisit(
  visitId: string = "VISIT_ID",
  portIdentification: string = "PORT1",
  vesselName: string = "Testvessel",
  identification: string = "TESTI",
  status: VisitStatus = "Expected to Arrive",
): NemoVisit {
  return buildVisit(
    visitId,
    portIdentification,
    vesselName,
    identification,
    status,
    new Date(),
    null,
    null,
    null,
  );
}

export function createTestVisitWith(options: TestVisitOptions): NemoVisit {
  return buildVisit(
    options.visitId ?? "VISIT_ID",
    options.portIdentification ?? "PORT1",
    options.vesselName ?? "Testvessel",
    options.identification ?? "TESTI",
    options.status ?? "Expected to Arrive",
    options.eta ?? new Date(),
    options.etd ?? null,
    options.ata ?? null,
    options.atd ?? null,
  );
}

function buildVisit(
  visitId: string,
  portIdentification: string,
  vesselName: string,
  identification: string,
  status: VisitStatus,
  eta: Date,
  etd: Date | null,
  ata: Date | null,
  atd: Date | null,
): NemoVisit {
  return {
    visitId,
    // Reuse the same instant as `eta` instead of calling `new Date()` again here.
    // Two independent `new Date()` calls can straddle a millisecond boundary under
    // load (e.g. in CI), which made the from/to boundary tests in get-visits.test.ts
    // flaky since they assume eta === latestUpdateTime.
    latestUpdateTime: eta,
    portCall: {
      vesselInformation: {
        identification,
        name: vesselName,
      },
      voyageInformation: {
        portIdentification,
        estimatedArrivalDateTime: eta,
        estimatedDepartureDateTime: etd,
      },
      arrivalNotification: {
        actualArrivalDateTime: ata,
      },
      departureNotification: {
        actualDepartureDateTime: atd,
      },
      portCallStatus: {
        status,
      },
    },
  };
}
