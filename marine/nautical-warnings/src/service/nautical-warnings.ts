import { NauticalWarningsApi } from "../api/nautical-warnings.js";
import * as CachedDao from "@digitraffic/common/dist/database/cached";
import { JSON_CACHE_KEY } from "@digitraffic/common/dist/database/cached";
import {
  type DTDatabase,
  type DTTransaction,
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { parse } from "date-fns";
import type { Feature, FeatureCollection, GeoJsonProperties } from "geojson";
import { isFeatureCollection } from "@digitraffic/common/dist/utils/geometry";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { EPOCH } from "@digitraffic/common/dist/utils/date-utils";
import { updateUpdatedTimestamp } from "@digitraffic/common/dist/database/last-updated";

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const NAUTICAL_WARNINGS_CHECK = "NAUTICAL_WARNINGS_CHECK" as const;

export function getActiveWarnings(): Promise<[FeatureCollection, Date]> {
  return inDatabaseReadonly((db: DTDatabase) => {
    return CachedDao.getFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE)
      .then((result) => {
        if (result) {
          return [
            {
              ...(result.content as FeatureCollection),
              ...{ dataUpdatedTime: result.modified.toISOString() },
            } as FeatureCollection,
            result.modified,
          ];
        }
        return [{
          ...EMPTY_FEATURE_COLLECTION,
          ...{ dataUpdatedTime: EPOCH.toISOString() },
        }, EPOCH];
      });
  });
}

export function getArchivedWarnings(): Promise<[FeatureCollection, Date]> {
  return inDatabaseReadonly((db: DTDatabase) => {
    return CachedDao.getFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED)
      .then((result) => {
        if (result) {
          return [
            {
              ...(result.content as FeatureCollection),
              ...{ dataUpdatedTime: result.modified.toISOString() },
            } as FeatureCollection,
            result.modified,
          ];
        }
        return [{
          ...EMPTY_FEATURE_COLLECTION,
          ...{ dataUpdatedTime: EPOCH.toISOString() },
        }, EPOCH];
      });
  });
}

export async function updateNauticalWarnings(url: string): Promise<void> {
  const api = new NauticalWarningsApi(url);
  const active = await api.getActiveWarnings();
  const archived = await api.getArchivedWarnings();

  logger.debug({ message: "active", data: active });
  logger.debug({ message: "archived", data: archived });

  await inDatabase((db: DTDatabase) => {
    return db.tx((tx) => {
      return Promise.allSettled([
        validateAndUpdate(tx, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE, active),
        validateAndUpdate(
          tx,
          JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED,
          archived,
        ),
        updateUpdatedTimestamp(tx, NAUTICAL_WARNINGS_CHECK, new Date()),
      ]);
    });
  });
}

function validateAndUpdate(
  tx: DTDatabase | DTTransaction,
  cacheKey: JSON_CACHE_KEY,
  featureCollection: FeatureCollection,
): Promise<void> {
  if (isFeatureCollection(featureCollection)) {
    const fc = convertFeatureCollection(featureCollection);
    const lastModified = fc.features
      .map((f) =>
        // eslint-disable-next-line dot-notation
        getMaxDate(
          f.properties?.["publishingTime"] as Date,
          f.properties?.["creationTime"] as Date,
        )
      )
      .reduce((a, b) => (a > b ? a : b), EPOCH);
    return CachedDao.updateCachedJson(tx, cacheKey, fc, lastModified);
  } else {
    logger.error({
      method: "NauticalWarningsService.validateAndUpdate",
      message: `Invalid GeoJSON for ${cacheKey}`,
    });
    logger.debug(featureCollection);
  }

  return Promise.resolve();
}

/* eslint-disable @rushstack/no-new-null */
interface JsonProperties {
  ID: string;
  ALUEET_FI: string;
  ALUEET_SV: string;
  ALUEET_EN: string;
  NUMERO: number;
  SIJAINTI_FI: string;
  SIJAINTI_SV: string;
  SIJAINTI_EN: string;
  SISALTO_FI: string;
  SISALTO_SV: string;
  SISALTO_EN: string;
  PAIVAYS: string;
  TYYPPI_FI: string;
  TYYPPI_SV: string;
  TYYPPI_EN: string;
  VOIMASSA_ALKAA: string | null;
  VOIMASSA_PAATTYY: string | null;
  VALITTUKOHDE_TOOLTIP: string | null;
  VIRTUAALINENTURVALAITE: number;
  NAVTEX: number;
  TURVALAITE_TXT: string | null;
  VAYLAALUE_TXT: string | null;
  NAVIGOINTILINJA_TXT: string | null;
  ANTOPAIVA: string | null;
  TIEDOKSIANTAJA: string;
}
/* eslint-enable @rushstack/no-new-null */

function convertFeatureCollection(
  original: FeatureCollection,
): FeatureCollection {
  original.features.forEach((f: Feature) => {
    f.properties = convertProperties(
      f.properties as NonNullable<JsonProperties>,
    );
  });

  return original;
}

export const DATE_FORMAT_1 = "dd.MM.yyyy";
export const DATETIME_FORMAT_1 = "dd.MM.yyyy HH:mm";
export const DATE_FORMAT_2 = "yyyy-MM-dd";
export const DATETIME_FORMAT_2 = "yyyy-MM-dd HH:mm:ss";

function convertProperties(o: NonNullable<JsonProperties>): GeoJsonProperties {
  return {
    id: o.ID,
    areasFi: o.ALUEET_FI,
    areasSv: o.ALUEET_SV,
    areasEn: o.ALUEET_EN,
    number: o.NUMERO,
    locationFi: o.SIJAINTI_FI,
    locationSv: o.SIJAINTI_SV,
    locationEn: o.SIJAINTI_EN,
    contentsFi: o.SISALTO_FI,
    contentsSv: o.SISALTO_SV,
    contentsEn: o.SISALTO_EN,
    creationTime: convertDate(o.PAIVAYS, DATETIME_FORMAT_1),
    typeFi: o.TYYPPI_FI,
    typeSv: o.TYYPPI_SV,
    typeEn: o.TYYPPI_EN,
    validityStartTime: convertDate(
      o.VOIMASSA_ALKAA,
      DATETIME_FORMAT_2,
      DATE_FORMAT_2,
    ),
    validityEndTime: convertDate(
      o.VOIMASSA_PAATTYY,
      DATETIME_FORMAT_2,
      DATE_FORMAT_2,
    ),
    tooltip: o.VALITTUKOHDE_TOOLTIP,
    virtualNavaids: convertBoolean(o.VIRTUAALINENTURVALAITE),
    navtex: convertBoolean(o.NAVTEX),
    navaidInfo: o.TURVALAITE_TXT,
    fairwayInfo: o.VAYLAALUE_TXT,
    navigationLineInfo: o.NAVIGOINTILINJA_TXT,
    publishingTime: convertDate(o.ANTOPAIVA, DATETIME_FORMAT_1, DATE_FORMAT_1),
    notificator: o.TIEDOKSIANTAJA,
  };
}

function convertBoolean(value: number): boolean {
  return !(value === 0);
}

/**
 * Takes in a localdate as a formatted string in given format and returns it as iso-formatted string.
 */
// eslint-disable-next-line @rushstack/no-new-null
export function convertDate(
  value: string | null,
  ...formatStrings: string[]
): string | null {
  if (!value) {
    return null;
  }

  for (const formatString of formatStrings) {
    const converted = convertDateNoExeptionThrown(value, formatString);

    if (converted) {
      return converted;
    }
  }

  logger.info({
    method: "NauticalWarningsService.convertDate",
    message: value + " was not valid with " + formatStrings.toString(),
  });

  return "Invalid date";
}

// eslint-disable-next-line @rushstack/no-new-null
export function convertDateNoExeptionThrown(
  value: string,
  formatString: string,
): string | null {
  try {
    const parsed = parse(value, formatString, new Date()); // Parses date in local timezone
    const offsetToHelsinkiMs = getTimeOffsetToMs("Europe/Helsinki", parsed);

    if (offsetToHelsinkiMs !== 0) {
      return new Date(parsed.getTime() + offsetToHelsinkiMs).toISOString();
    }
    return parsed.toISOString();
  } catch (e: unknown) {
    return null;
  }
}

/**
 * Returns how much needs to be added to given local time, to move it to same local time in target timezone.
 * Ie. 10:00 in Oslo (+01:00) to 10:00 in Helsinki (+02:00) -> this returns -1 h in millisenconds as
 * at 9:00 in Oslo the time in Helsinki is 10:00, so we need to subtract one hour from the local time.
 * So we get 8:00 in Oslo and to 9:00 in Helsinki.
 *
 * @param targetTimezone that we want to count difference
 * @param localDateTimeReference time when to calculate the difference to take in account summer/winter time
 */
function getTimeOffsetToMs(
  targetTimezone: string,
  localDateTimeReference: Date,
): number {
  // millis keeps going regardless the time and
  // will make targetDate to have difference in millis
  const date = new Date(localDateTimeReference.setMilliseconds(0));
  // const date = new Date(new Date().setMilliseconds(0));
  const targetTime = date.toLocaleString("en-US", { timeZone: targetTimezone });
  const targetDate = new Date(targetTime);
  return date.getTime() - targetDate.getTime();
}

function getMaxDate(date1: Date | undefined, date2: Date | undefined): Date {
  if (date1 && date2) {
    return date1 > date2 ? date1 : date2;
  }
  return date1 ?? date2 ?? EPOCH;
}
