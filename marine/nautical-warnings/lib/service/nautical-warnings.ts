import {NauticalWarningsApi} from "../api/nautical-warnings";
import * as CachedDao from "digitraffic-common/db/cached";
import {JSON_CACHE_KEY} from "digitraffic-common/db/cached";
import {DTDatabase, DTTransaction, inDatabase, inDatabaseReadonly} from "digitraffic-common/postgres/database";
import moment from "moment-timezone";
import {Feature, FeatureCollection, GeoJsonProperties} from "geojson";

const gjv = require("geojson-validation");

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

    console.info("DEBUG active " + JSON.stringify(
        active, null, 2,
    ));
    console.info("DEBUG archived " + JSON.stringify(
        archived, null, 2,
    ));

    await inDatabase((db: DTDatabase) => {
        return db.tx(tx => {
            return Promise.allSettled([
                validateAndUpdate(
                    tx, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE, active,
                ),
                validateAndUpdate(
                    tx, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED, archived,
                ),
            ]);
        });
    });
}

function validateAndUpdate(
    tx: DTDatabase | DTTransaction, cacheKey: JSON_CACHE_KEY, featureCollection: FeatureCollection,
): Promise<null> {
    if (gjv.isFeatureCollection(featureCollection, true)) {
        return CachedDao.updateCachedJson(
            tx, cacheKey, convert(featureCollection),
        );
    } else {
        console.info("DEBUG " + JSON.stringify(
            featureCollection, null, 2,
        ));
        console.error("invalid geojson for " + cacheKey);
    }

    return Promise.resolve(null);
}

function convert(original: FeatureCollection): FeatureCollection {
    original.features.forEach((f: Feature) => {
        f.properties = convertProperties(f.properties as NonNullable<GeoJsonProperties>);
    });

    return original;
}

const DATE_FORMAT_1 = 'DD.MM.YYYY HH:mm';
const DATE_FORMAT_2 = 'YYYY-MM-DD HH:mm:ss';

function convertProperties(o: NonNullable<GeoJsonProperties>): GeoJsonProperties {
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
        creationTime: convertDate(o.PAIVAYS, DATE_FORMAT_1),
        typeFi: o.TYYPPI_FI,
        typeSv: o.TYYPPI_SV,
        typeEn: o.TYYPPI_EN,
        validityStartTime: convertDate(o.VOIMASSA_ALKAA, DATE_FORMAT_2),
        validityEndTime: convertDate(o.VOIMASSA_PAATTYY, DATE_FORMAT_2),
        tooltip: o.VALITTUKOHDE_TOOLTIP,
        virtualNavaids: convertBoolean(o.VIRTUAALINENTURVALAITE),
        navtex: convertBoolean(o.NAVTEX),
        navaidInfo: o.TURVALAITE_TXT,
        fairwayInfo: o.VAYLAALUE_TXT,
        navigationLineInfo: o.NAVIGOINTILINJA_TXT,
        publishingTime: convertDate(o.ANTOPAIVA, DATE_FORMAT_1),
        notificator: o.TIEDOKSIANTAJA,
    };
}

function convertBoolean(value: number): boolean {
    return !(value === 0);
}

function convertDate(value: string, format: string): string | null {
    if (!value) {
        return null;
    }

    const converted = moment.tz(
        value, format, 'Europe/Helsinki',
    );

    if (!converted.isValid()) {
        console.info(value + " was not valid with " + format);
    }

    return converted.format();
}
