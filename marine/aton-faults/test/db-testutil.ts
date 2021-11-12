import {IDatabase} from "pg-promise";
import {Fault} from "../lib/model/fault";
import {dbTestBase as commonDbTestBase} from "digitraffic-common/test/db-testutils";
import {JSON_CACHE_KEY} from "digitraffic-common/db/cached";

export const TEST_ACTIVE_WARNINGS_VALID = {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[27.3427,60.27776]},"properties":{"id":20625,"navtex":false,"number":219,"typeEn":"NAVIGATIONAL WARNINGS FOR YACHTSMEN","typeFi":"VAROITUKSIA VENEILIJÖILLE","typeSv":"NAVIGATIONSVARNINGAR FÖR BÅTFARARE","areasEn":"LAKE SAIMAA","areasFi":"SAIMAA","areasSv":"SAIMEN","tooltip":null,"contentsEn":"\r\nSEARCH AND RESCUE EXCERCISE SOUTH OF KYLÄNIEMI 22-24.10. IN THE AREA, SIGHTINGS LOOKING LIKE A MARINE ACCIDENT MAY BE OBSERVED. SAR VESSEL \"WILLIMIES\", TAKING PART IN THE EXCERCISE, IS LISTENING ON VHF CHANNELS 16 AND 09.","contentsFi":"\r\nMERIPELASTUSHARJOITUS KYLÄNIEMEN ETELÄPUOLELLA 22-24.10. ALUEELLA VOI NÄKYÄ VESILIIKENNEONNETTOMUUTEEN LIITTYVIÄ ASIOITA. HARJOITUKSEEN OSALLISTUU PELASTUSALUS \"WILLIMIES\", JOKA KUUNTELEE VHF KANAVIA 16 JA 09.","contentsSv":"\r\nSJÖRÄDDNINGSÖVNING SÖDER OM KYLÄNIEMI 22-24.10. PÅ OMRÅDET KAN GÖRAS OBSERVATIONER SOM TYDER PÅ SJÖOLYCKA. I ÖVNINGEN DELTAR RÄDDNINGSFARTYGET \"WILLIMIES\", SOM LYSSNAR PÅ VHF-KANALERNA 16 OCH 09.","locationEn":"ETELÄ-SAIMAA","locationFi":"ETELÄ-SAIMAA","locationSv":"ETELÄ-SAIMAA","navaidInfo":null,"fairwayInfo":null,"notificator":"FINTRAFFIC/SVTS/PN","creationTime":"2021-10-15T18:00:00+03:00","publishingTime":"2021-10-16T00:00:00+03:00","virtualNavaids":false,"validityEndTime":"2021-10-24T13:00:00+03:00","validityStartTime":"2021-10-22T17:00:00+03:00","navigationLineInfo":null}},{"type":"Feature","geometry":{"type":"Point","coordinates":[21.4424804047364,60.471819169784396]},"properties":{"id":20623,"navtex":false,"number":217,"typeEn":"LOCAL WARNING","typeFi":"LOCAL WARNING","typeSv":"LOCAL WARNING","areasEn":"ARCHIPELAGO SEA","areasFi":"SAARISTOMERI","areasSv":"SKÄRGÅRDSHAVET","tooltip":null,"contentsEn":"\r\nHALLI CONDUCTING UNDERWATER OPERATIONS IN VICINITY OF LAUPUNEN FM 14.10.2021\r\nIN POSITION 60-28,35 N 021-26,54 E DAILY BETWEEN 08:00-18:00\r\nVESSELS ARE REQUESTED TO PASS THE WORKING SITE ON THE NORTH SIDE\r\nOF THE FAIRWAY AND AVOID MAKING SWELL. HALLI LISTENING TO VHF CH 16 AND 71\r\n","contentsFi":"\r\nHALLI SUORITTAA VEDENALAISIA TÖITÄ 14.10.2021 ALKAEN LAUPUSTEN LÄHISTÖLLÄ \r\nPAIKASSA 60-28,35 N 021-26,54 E. TYÖAJAT PÄIVITTÄIN 08:00-18:00\r\nALUKSIA PYYDETÄÄN OHITTAMAAN TYÖKOHDE POHJOISEN PUOLELTA\r\nJA VÄLTTÄMÄÄN AALLONMUODOSTUSTA. HALLI PÄIVYSTÄÄ VHF KANAVIA 16 JA 71\r\n","contentsSv":"\r\nHALLI UTFÖR UNDERVATTENSARBETEN I NÄRHETEN AV LAUPUNEN FR.O.M 14.10.2021\r\nI POS 60-28,35 N 021-26,54 E DAGLIGEN 08:00-18:00\r\nFARTYG OMBEDES ATT PASSERA PÅ NORRA SIDAN AV FARLEDEN\r\nOCH UNDVIKA VÅGBILDNING. HALLI LYSSNAR PÅ VHF KANALERNA 16 OCH 71\r\n","locationEn":"ISOKARI-LÖVSKÄR 10M FAIRWAY","locationFi":"ISOKARI-LÖVSKÄR 10M VÄYLÄ","locationSv":"ISOKARI-LÖVSKÄR 10M FARLED","navaidInfo":null,"fairwayInfo":null,"notificator":"FINTRAFFIC/VIRTANEN/OFK/DL","creationTime":"2021-10-13T14:16:00+03:00","publishingTime":"2021-10-13T00:00:00+03:00","virtualNavaids":false,"validityEndTime":null,"validityStartTime":"2021-10-13T14:15:00+03:00","navigationLineInfo":null}},{"type":"Feature","geometry":{"type":"Point","coordinates":[25.6153615119869,60.2156614213976]},"properties":{"id":20504,"navtex":false,"number":211,"typeEn":"LOCAL WARNING","typeFi":"LOCAL WARNING","typeSv":"LOCAL WARNING","areasEn":"GULF OF FINLAND","areasFi":"SUOMENLAHTI","areasSv":"FINSKA VIKEN","tooltip":"TL:36 Havsudden ylempi, Linjamerkki [Vahvistettu]","contentsEn":"\r\nLEADING LIGHT HAVSUDDEN REAR NR 36\r\nIN POSITION 60-12.94N 025-36.92E\r\nLIGHT UNRELIABLE","contentsFi":"\r\nLINJAMERKKI HAVSUDDEN YLEMPI NR 36\r\nPAIKASSA 60-12.94N 025-36.92E\r\nVALO EPÄLUOTETTAVA","contentsSv":"\r\nLINJEMÄRKE HAVSUDDEN ÖVRE NR 36\r\nI POSITION 60-12.94N 025-36.92E\r\nLJUSET ÅPOLITLIG","locationEn":"SKÖLDVIK 15.3M FAIRWAY","locationFi":"SKÖLDVIKIN 15.3M VÄYLÄ","locationSv":"SKÖLDVIK 15.3M FARLED","navaidInfo":"TLNUMERO:36\r\nALALAJI:Kiinteä\r\nLAJI:\r\nWGS_LAT:6012,94000765\r\nWGS_LON:2536,92257433\r\nTYYPPI:Linjamerkki\r\nNIMIS:Havsudden ylempi\r\nVAYLAN_NIMI:Sköldvikin 15,3m väylä\r\n","fairwayInfo":null,"notificator":"FINTRAFFIC/AVTS/OFK/TT","creationTime":"2021-10-05T07:30:00+03:00","publishingTime":"2021-10-05T00:00:00+03:00","virtualNavaids":false,"validityEndTime":null,"validityStartTime":null,"navigationLineInfo":null}},{"type":"Feature","geometry":{"type":"Point","coordinates":[24.4347596329857,65.26428690371449]},"properties":{"id":20502,"navtex":false,"number":207,"typeEn":"LOCAL WARNING","typeFi":"LOCAL WARNING","typeSv":"LOCAL WARNING","areasEn":"BAY OF BOTHNIA","areasFi":"PERÄMERI","areasSv":"BOTTENVIKEN","tooltip":"TL:84515 Kiisla, Vasenreunamerkki [Vahvistettu]","contentsEn":"\r\nEDGEMARK KIISLA NR 84515\r\nIN POS 65-15,8 N 024-26,1 E\r\nUNLIT","contentsFi":"\r\nREUNAMERKKI KIISLA NR 84515\r\nPAIKASSA 65-15,8 N 024-26,1 E\r\nVALO EI TOIMI","contentsSv":"\r\nRANDMÄRKET KIISLA NR 84515\r\nI POSITION 65-15,8 N 024-26,1 E\r\nLJUSET UR FUNKTION","locationEn":"OULU 12,5 M FAIRWAY","locationFi":"OULUN 12,5 M VÄYLÄ","locationSv":"ULEÅBORG 12,5 M FARLED","navaidInfo":"TLNUMERO:84515\r\nALALAJI:Kiinteä\r\nLAJI:Vasen\r\nWGS_LAT:6515,85661102\r\nWGS_LON:2426,08507314\r\nTYYPPI:Reunamerkki\r\nNIMIS:Kiisla\r\nVAYLAN_NIMI:Oulun 12,5 m väylä\r\n","fairwayInfo":null,"notificator":"FINTRAFFIC/BVTS/OFK/","creationTime":"2021-10-02T00:25:00+03:00","publishingTime":"2021-10-02T00:00:00+03:00","virtualNavaids":false,"validityEndTime":null,"validityStartTime":null,"navigationLineInfo":null}},{"type":"Feature","geometry":{"type":"Point","coordinates":[23.9177,59.6749]},"properties":{"id":20382,"navtex":false,"number":201,"typeEn":"COASTAL WARNING","typeFi":"COASTAL WARNING","typeSv":"COASTAL WARNING","areasEn":"GULF OF FINLAND, NORTHERN BALTIC","areasFi":"POHJOINEN ITÄMERI, SUOMENLAHTI","areasSv":"FINSKA VIKEN, NORRA ÖSTERSJÖN","tooltip":null,"contentsEn":"\r\nMARLIN / UBNV2 AND MURMAN / UBAN4 ARE CONDUCTING UNDERWATER SURVEY OPERATIONS STARTING FROM GULF OF FINLAND CONTINUING TOWARDS NORTHERN BALTIC.\r\n0.5 NM SAFETY DISTANCE REQUESTED.\r\n\r\nDATE AND TIME\r\n201420 UTC OF SEP","contentsFi":"\r\nMARLIN / UBNV2 JA MURMAN / UBAN4 SUORITTAVAT VEDENALAISIA TUTKIMUSTÖITÄ ALKAEN SUOMENLAHDELTA KOHTI POHJOISTA ITÄMERTA.\r\nALUKSIA PYYDETÄÄN JÄTTÄMÄÄN 0.5 NM TURVAETÄISYYS.","contentsSv":"\r\nMARLIN / UBNV2 OCH MURMAN / UBAN4 UTFÖR UNDERVATTENSUNDERSÖKNINGAR FRÅN FINSKA VIKEN MOT NORRA ÖSTERSJÖN.\r\nFARTYG OMBEDES ATT GE 0.5 NM PASSAGEAVSTÅND.","locationEn":"NORTHERN BALTIC AND GULF OF FINLAND","locationFi":"POHJOINEN ITÄMERI JA SUOMENLAHTI","locationSv":"NORRA ÖSTERSJÖN OCH FINSKA VIKEN","navaidInfo":null,"fairwayInfo":null,"notificator":"FINTRAFFIC/OFK/AHÄ","creationTime":"2021-09-20T17:20:00+03:00","publishingTime":"2021-09-20T00:00:00+03:00","virtualNavaids":false,"validityEndTime":null,"validityStartTime":null,"navigationLineInfo":null}},{"type":"Feature","geometry":{"type":"Point","coordinates":[27.3232,60.2613]},"properties":{"id":19682,"navtex":false,"number":151,"typeEn":"LOCAL WARNING","typeFi":"LOCAL WARNING","typeSv":"LOCAL WARNING","areasEn":"BAY OF BOTHNIA","areasFi":"PERÄMERI","areasSv":"BOTTENVIKEN","tooltip":null,"contentsEn":"\r\nDREDGING OPERATIONS IN PROGRESS IN KEMI AJOS PORT AND IN FAIRWAY AREA BETWEEN KEMI 3 AND KEMI AJOS PORT .\r\nWORKING UNITS LISTEN TO VHF CHANNEL 67.\r\nVESSELS IN THE AREA ARE ADVISED TO NAVIGATE WITH CAUTION AND AVOID CREATING SWELL IN THE VICINITY OF THE WORKING UNITS.","contentsFi":"\r\nRUOPPAUSTYÖT KÄYNNISSÄ KEMI AJOKSEN SATAMASSA JA VÄYLÄALUEELLA VÄLILLÄ KEMI 3 – KEMI AJOKSEN SATAMA.\r\nTYÖYKSIKÖT KUUNTELEVAT VHF KANAVAA 67.\r\nALUEELLA LIIKKUVIEN ALUSTEN TULEE NOUDATTAA VAROVAISUUTTA JA VÄLTTÄÄ AALLOKON MUODOSTUSTA TYÖALUSTEN LÄHEISYYDESSÄ.","contentsSv":"\r\nMUDDRINGSARBETE PÅGÅR I KEMI AJOS HAMN OCH VID FARLEDSOMRÅDEN MELLAN KEMI 3 OCH KEMI AJOS HAMN.\r\nARBETSFARTYGEN LYSSNAR PÅ VHF KANAL 67.\r\nFARTYG I OMRÅDET UPPMANAS ATT NAVIGERA MED FÖRSIKTIGHET OCH UNDVIKA ATT ORSAKA SVALL I NÄRHETEN AV ARBETSENHETER.","locationEn":"KEMI AJOS PORT AND KEMI 10M FAIRWAY","locationFi":"KEMI AJOKSEN SATAMA JA KEMIN 10M VÄYLÄ","locationSv":"KEMI AJOS HAMN OCH KEMI 10 M FARLED","navaidInfo":null,"fairwayInfo":null,"notificator":"FINTRAFFIC/BVTS/OFK/TR","creationTime":"2021-07-23T13:26:00+03:00","publishingTime":"2021-07-23T00:00:00+03:00","virtualNavaids":false,"validityEndTime":null,"validityStartTime":null,"navigationLineInfo":null}},{"type":"Feature","geometry":{"type":"Point","coordinates":[25.2225,60.17638]},"properties":{"id":18402,"navtex":false,"number":82,"typeEn":"LOCAL WARNING","typeFi":"LOCAL WARNING","typeSv":"LOCAL WARNING","areasEn":"GULF OF FINLAND","areasFi":"SUOMENLAHTI","areasSv":"FINSKA VIKEN","tooltip":null,"contentsEn":"\r\nDREDGING OPERATIONS IN PROGRESS IN VUOSAARI PORT AND IN THE FAIRWAY AREA SOUTH OF MUSTA HEVONEN.\r\nTHE FAIRWAY AREA IS LIMITED IN PLACES WITH AIDS TO NAVIGATION.\r\nWORKING UNITS LISTEN TO VHF CHANNEL 71.\r\nVESSELS IN THE AREA ARE ADVISED TO REDUCE SPEED AND AVOID CREATING SWELL IN THE VICINITY OF THE WORKING UNITS.\r\n","contentsFi":"\r\nRUOPPAUS- JA LOUHINTATYÖT KÄYNNISSÄ VUOSAAREN SATAMASSA JA VÄYLÄLLÄ MUSTAN HEVOSEN ETELÄPUOLELLA. NORMAALIA VÄYLÄALUETTA ON RAJOITETTU PAIKOIN LOUHINTATÖIDEN TAKIA TURVALAITTEILLA. \r\nTYÖYKSIKÖT KUUNTELEVAT VHF KANAVAA 71.\r\nALUEELLA LIIKKUVIEN ALUSTEN TULEE HILJENTÄÄ NOPEUTTA JA VÄLTTÄÄ AALLOKON MUODOSTUSTA TYÖALUSTEN LÄHEISYYDESSÄ.\r\n","contentsSv":"\r\nMUDDRINGS- OCH SPRÄNGNINGSARBETE PÅGÅR I NORDSJÖ HAMN OCH PÅ FARLEDENS SÖDRA SIDAN OM MUSTA HEVONEN.\r\nFARLEDSOMRÅDET ÄR STÄLLVIS BEGRÄNSAT MED SÄKERHETSANORDNINGAR.\r\nARBETSFARTYGEN LYSSNAR PÅ VHF KANAL 71.\r\nFARTYG I OMRÅDET BÖR SAKTA FARTEN OCH UNDVIKA ATT ORSAKA SVALL I NÄRHETEN AV ARBETSENHETER.\r\n","locationEn":"VUOSAARI 11M FAIRWAY","locationFi":"VUOSAARI 11M VÄYLÄ","locationSv":"NORDSJÖ 11M FARLED","navaidInfo":null,"fairwayInfo":null,"notificator":"FINTRAFFIC/HKIVTS/OFK/AL","creationTime":"2021-04-14T15:30:00+03:00","publishingTime":"2021-04-14T00:00:00+03:00","virtualNavaids":false,"validityEndTime":null,"validityStartTime":"2021-04-14T15:00:00+03:00","navigationLineInfo":null}}]}

export function dbTestBase(fn: (db: IDatabase<any, any>) => any) {
    return commonDbTestBase(fn, truncate, 'marine', 'marine', 'localhost:54321/marine');
}

async function truncate(db: IDatabase<any, any>): Promise<any> {
    return await db.tx(async t => {
        await t.none('DELETE FROM aton_fault');
        await t.none('DELETE FROM cached_json');
    });
}

export function insert(db: IDatabase<any, any>, faults: Fault[]) {
    return db.tx(t => {
        return t.batch(faults.map(f => {
            return t.none(`
                insert into aton_fault(id,
                                       entry_timestamp,
                                       fixed_timestamp,
                                       state,
                                       type,
                                       domain,
                                       fixed,
                                       aton_id,
                                       aton_name_fi,
                                       aton_name_sv,
                                       aton_type_fi,
                                       fairway_number,
                                       fairway_name_fi,
                                       fairway_name_sv,
                                       area_number,
                                       geometry)
                values ($1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        $11,
                        $12,
                        $13,
                        $14,
                        $15,
                        ST_GEOMFROMTEXT($16))
            `, [
                f.id,
                f.entry_timestamp,
                f.fixed_timestamp,
                f.state,
                f.type,
                f.domain,
                f.fixed,
                f.aton_id,
                f.aton_name_fi,
                f.aton_name_sv,
                f.aton_type,
                f.fairway_number,
                f.fairway_name_fi,
                f.fairway_name_sv,
                f.area_number,
                f.geometry
            ]);
        }));
    });
}

export async function insertActiveWarnings(db: IDatabase<any, any>, value: any): Promise<any> {
    return db.none('insert into cached_json(cache_id, content, last_updated) values ($1, $2, now())',
        [JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE, value]);
}
