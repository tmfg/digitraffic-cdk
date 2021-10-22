import {NauticalWarningsApi} from "../api/nautical-warnings";
import * as CachedDao from "digitraffic-common/db/cached";
import {inDatabase, inDatabaseReadonly} from "digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";
import moment from "moment-timezone";
import {JSON_CACHE_KEY} from "digitraffic-common/db/cached";

const gjv = require("geojson-validation");

export function getActiveWarnings() {
    return inDatabaseReadonly(async (db: IDatabase<any, any>) => {
        return CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE);
    });
}

export function getArchivedWarnings() {
    return inDatabaseReadonly(async (db: IDatabase<any, any>) => {
        return CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED);
    });
}

export async function updateNauticalWarnings(url: string): Promise<any> {
    const api = new NauticalWarningsApi(url);
    const active = await api.getActiveWarnings();
    const archived = await api.getArchivedWarnings();

    console.info("DEBUG active " + JSON.stringify(active, null, 2));
    console.info("DEBUG archived " + JSON.stringify(archived, null, 2));

    return inDatabase(async (db: IDatabase<any, any>) => {
        return db.tx(tx => {
            return Promise.allSettled([
                validateAndUpdate(tx, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE, active),
                validateAndUpdate(tx, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ARCHIVED, archived)
            ]);
        });
    });
}

async function validateAndUpdate(tx: IDatabase<any, any>, cacheKey: JSON_CACHE_KEY, value: any) {
    if(gjv.isFeatureCollection(value, true)) {
        return CachedDao.updateCachedJson(tx, cacheKey, convert(value));
    } else {
        console.info("DEBUG " + JSON.stringify(value, null, 2));
        console.error("invalid geojson for " + cacheKey);
    }
}

function convert(original: any): any {
    original.features.forEach((f: any) => {
        f.properties = convertProperties(f.properties);
    });

    return original;
}

const DATE_FORMAT_1 = 'DD.MM.YYYY HH:mm';
const DATE_FORMAT_2 = 'YYYY-MM-DD HH:mm:ss';

function convertProperties(o: any): any {
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
        notificator: o.TIEDOKSIANTAJA
    };
}

function convertBoolean(value: number): boolean {
    return value === 0 ? false : true;
}

function convertDate(value: string, format: string): string | null {
    if(!value) {
        return null;
    }

    const converted = moment.tz(value, format, 'Europe/Helsinki');

    if(!converted.isValid()) {
        console.info(value + " was not valid with " + format);
    }

    return converted.format();
}
