import { NauticalWarningsApi } from "../api/nautical-warnings";
import * as CachedDao from "@digitraffic/common/dist/database/cached";
import { JSON_CACHE_KEY } from "@digitraffic/common/dist/database/cached";
import {
    DTDatabase,
    DTTransaction,
    inDatabase,
    inDatabaseReadonly
} from "@digitraffic/common/dist/database/database";
import { parse, formatISO } from "date-fns";
import { Feature, FeatureCollection, GeoJsonProperties } from "geojson";
import { isFeatureCollection } from "@digitraffic/common/dist/utils/geometry";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { utcToZonedTime } from "date-fns-tz";

export function getActiveWarnings(): Promise<FeatureCollection | null> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE);
    });
}

export function getArchivedWarnings(): Promise<FeatureCollection | null> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED);
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
                validateAndUpdate(tx, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED, archived)
            ]);
        });
    });
}

function validateAndUpdate(
    tx: DTDatabase | DTTransaction,
    cacheKey: JSON_CACHE_KEY,
    featureCollection: FeatureCollection
): Promise<null> {
    if (isFeatureCollection(featureCollection)) {
        return CachedDao.updateCachedJson(tx, cacheKey, convertFeatureCollection(featureCollection));
    } else {
        logger.error({
            method: "NauticalWarningsService.validateAndUpdate",
            message: "Invalid geojson for " + cacheKey
        });
        logger.debug(featureCollection);
    }

    return Promise.resolve(null);
}

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

function convertFeatureCollection(original: FeatureCollection): FeatureCollection {
    original.features.forEach((f: Feature) => {
        f.properties = convertProperties(f.properties as NonNullable<JsonProperties>);
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
        validityStartTime: convertDate(o.VOIMASSA_ALKAA, DATETIME_FORMAT_2, DATE_FORMAT_2),
        validityEndTime: convertDate(o.VOIMASSA_PAATTYY, DATETIME_FORMAT_2, DATE_FORMAT_2),
        tooltip: o.VALITTUKOHDE_TOOLTIP,
        virtualNavaids: convertBoolean(o.VIRTUAALINENTURVALAITE),
        navtex: convertBoolean(o.NAVTEX),
        navaidInfo: o.TURVALAITE_TXT,
        fairwayInfo: o.VAYLAALUE_TXT,
        navigationLineInfo: o.NAVIGOINTILINJA_TXT,
        publishingTime: convertDate(o.ANTOPAIVA, DATETIME_FORMAT_1, DATE_FORMAT_1),
        notificator: o.TIEDOKSIANTAJA
    };
}

function convertBoolean(value: number): boolean {
    return !(value === 0);
}

/**
 * Takes in a localdate as a formatted string in given format and returns it as iso-formatted string.
 */
export function convertDate(value: string | null, ...formatStrings: string[]): string | null {
    if (!value) {
        return null;
    }

    for (const formatString of formatStrings) {
        const converted = convert(value, formatString);

        if (converted) {
            return converted;
        }
    }

    logger.info({
        method: "NauticalWarningsService.convertDate",
        message: value + " was not valid with " + formatStrings.toString()
    });

    return "Invalid date";
}

export function convert(value: string, formatString: string) {
    try {
        const converted = utcToZonedTime(parse(value, formatString, new Date()), "Europe/Helsinki");

        return formatISO(converted);
    } catch (e: unknown) {
        return null;
    }
}
