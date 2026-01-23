import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import type { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import type {
  WarningFeature,
  WarningFeatureCollection,
} from "../model/warnings.js";

/**
 * nautical-warnings data no longer maintained by Digitraffic
 */

export async function findWarningsForVoyagePlan(
  voyagePlan: RtzVoyagePlan,
): Promise<WarningFeatureCollection | undefined> {
  return undefined;
}

export async function findWarning(
  db: DTDatabase,
  id: number,
): Promise<WarningFeature | undefined> {
  return undefined;
}
