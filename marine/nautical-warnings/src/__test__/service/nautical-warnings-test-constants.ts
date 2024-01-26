import type { FeatureCollection } from "geojson";

export const TEST_ACTIVE_WARNINGS_VALID: FeatureCollection = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [21.3027205128331, 61.144639955157004]
            },
            properties: {
                ID: 20624,
                NAVTEX: 1,
                NUMERO: 218,
                PAIVAYS: "14.10.2021 03:20",
                ALUEET_EN: "SEA OF BOTHNIA",
                ALUEET_FI: "SELKÄMERI",
                ALUEET_SV: "BOTTENHAVET",
                ANTOPAIVA: "14.10.2021",
                TYYPPI_EN: "COASTAL WARNING",
                TYYPPI_FI: "COASTAL WARNING",
                TYYPPI_SV: "COASTAL WARNING",
                SISALTO_EN:
                    "\r\nLIGHTHOUSE KYLMÄPIHLAJA NR 3500 IN POSITION\r\n61-08.67N 021-18.16E \r\nLIGHT UNRELIABLE\r\n\r\nDATE AND TIME\r\n140020 UTC OF OCT\r\n\r\n\r\n\r\n",
                SISALTO_FI:
                    "\r\nMERIMAJAKKA KYLMÄPIHLAJA NR 3500 PAIKASSA\r\n61-08.67N 021-18.16E \r\nVALO VIRHEELLINEN\r\n\r\nPÄIVÄYS JA AIKA\r\n140020 UTC LOKAKUU\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n",
                SISALTO_SV:
                    "\r\nHAVSFYR KYLMÄPIHLAJA NR 3500 I POSITION \r\n61-08.67N 021-18.16E \r\nLJUSET OPÅLITLIGT\r\n\r\nDATUM OCH TID\r\n140020 UTC OKTOBER\r\n\r\n\r\n",
                SIJAINTI_EN: "RAUMA SOUTHERN FAIRWAY",
                SIJAINTI_FI: "RAUMA ETELÄINEN VÄYLÄ",
                SIJAINTI_SV: "RAUMO SÖDRA FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: "2021-10-14 04:08:51",
                TIEDOKSIANTAJA: "FINTRAFFIC/WVTS/OFK/AH",
                TURVALAITE_TXT:
                    "TLNUMERO:3500\r\nALALAJI:Kiinteä\r\nLAJI:\r\nWGS_LAT:6108,6783\r\nWGS_LON:2118,1644\r\nTYYPPI:Merimajakka\r\nNIMIS:Kylmäpihlaja\r\nVAYLAN_NIMI:Rauman eteläinen väylä\r\n",
                VOIMASSA_ALKAA: null,
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: "TL:3500 Kylmäpihlaja, Merimajakka [Vahvistettu]",
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [21.4424804047364, 60.471819169784396]
            },
            properties: {
                ID: 20623,
                NAVTEX: 0,
                NUMERO: 217,
                PAIVAYS: "13.10.2021 14:16",
                ALUEET_EN: "ARCHIPELAGO SEA",
                ALUEET_FI: "SAARISTOMERI",
                ALUEET_SV: "SKÄRGÅRDSHAVET",
                ANTOPAIVA: "13.10.2021",
                TYYPPI_EN: "LOCAL WARNING",
                TYYPPI_FI: "LOCAL WARNING",
                TYYPPI_SV: "LOCAL WARNING",
                SISALTO_EN:
                    "\r\nHALLI CONDUCTING UNDERWATER OPERATIONS IN VICINITY OF LAUPUNEN FM 14.10.2021\r\nIN POSITION 60-28,35 N 021-26,54 E DAILY BETWEEN 08:00-18:00\r\nVESSELS ARE REQUESTED TO PASS THE WORKING SITE ON THE NORTH SIDE\r\nOF THE FAIRWAY AND AVOID MAKING SWELL. HALLI LISTENING TO VHF CH 16 AND 71\r\n",
                SISALTO_FI:
                    "\r\nHALLI SUORITTAA VEDENALAISIA TÖITÄ 14.10.2021 ALKAEN LAUPUSTEN LÄHISTÖLLÄ \r\nPAIKASSA 60-28,35 N 021-26,54 E. TYÖAJAT PÄIVITTÄIN 08:00-18:00\r\nALUKSIA PYYDETÄÄN OHITTAMAAN TYÖKOHDE POHJOISEN PUOLELTA\r\nJA VÄLTTÄMÄÄN AALLONMUODOSTUSTA. HALLI PÄIVYSTÄÄ VHF KANAVIA 16 JA 71\r\n",
                SISALTO_SV:
                    "\r\nHALLI UTFÖR UNDERVATTENSARBETEN I NÄRHETEN AV LAUPUNEN FR.O.M 14.10.2021\r\nI POS 60-28,35 N 021-26,54 E DAGLIGEN 08:00-18:00\r\nFARTYG OMBEDES ATT PASSERA PÅ NORRA SIDAN AV FARLEDEN\r\nOCH UNDVIKA VÅGBILDNING. HALLI LYSSNAR PÅ VHF KANALERNA 16 OCH 71\r\n",
                SIJAINTI_EN: "ISOKARI-LÖVSKÄR 10M FAIRWAY",
                SIJAINTI_FI: "ISOKARI-LÖVSKÄR 10M VÄYLÄ",
                SIJAINTI_SV: "ISOKARI-LÖVSKÄR 10M FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: "2021-10-13 14:21:48",
                TIEDOKSIANTAJA: "FINTRAFFIC/VIRTANEN/OFK/DL",
                TURVALAITE_TXT: null,
                VOIMASSA_ALKAA: "2021-10-13 14:15:00",
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: null,
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [21.307077341961, 62.245033592936096]
            },
            properties: {
                ID: 20622,
                NAVTEX: 0,
                NUMERO: 216,
                PAIVAYS: "13.10.2021 05:40",
                ALUEET_EN: "SEA OF BOTHNIA",
                ALUEET_FI: "SELKÄMERI",
                ALUEET_SV: "BOTTENHAVET",
                ANTOPAIVA: "13.10.2021",
                TYYPPI_EN: "LOCAL WARNING",
                TYYPPI_FI: "LOCAL WARNING",
                TYYPPI_SV: "LOCAL WARNING",
                SISALTO_EN:
                    "\r\nLEADING LIGHT BÅTSKÄR FRONT NR 7282\r\nIN POS 62-14.70 N 021-18.42 E\r\nLIGHT OUT OF ORDER.\r\n",
                SISALTO_FI:
                    "\r\nLINJAMERKKI BÅTSKÄR ALEMPI TL NR 7282\r\nPAIKASSA 62-14.70N 021-18.42E\r\nVALO EI TOIMI.\r\n",
                SISALTO_SV:
                    "\r\nLINJEMÄRKET BÅTSKÄR NEDRE NR 7282\r\nI POS. 62-14.70N 021-18.42E\r\nLJUSET UR FUNKTION.\r\n",
                SIJAINTI_EN: "KRISTIINANKAUPUNKI 12M FAIRWAY",
                SIJAINTI_FI: "KRISTIINANKAUPUNGIN 12M VÄYLÄ",
                SIJAINTI_SV: "KRISTINESTAD 12M FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: "2021-10-13 05:52:07",
                TIEDOKSIANTAJA: "FINTRAFFIC/WESTCOAST VTS/OFK/TH",
                TURVALAITE_TXT:
                    "TLNUMERO:7282\r\nALALAJI:Kiinteä\r\nLAJI:\r\nWGS_LAT:6214,7017\r\nWGS_LON:2118,4253\r\nTYYPPI:Linjamerkki\r\nNIMIS:Båtskär alempi\r\nVAYLAN_NIMI:Kristiinankaupungin 12 m väylä\r\n",
                VOIMASSA_ALKAA: "2021-10-13 05:40:00",
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: "TL:7282 Båtskär alempi, Linjamerkki [Vahvistettu]",
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [21.097760897608396, 60.534556736433494]
            },
            properties: {
                ID: 20602,
                NAVTEX: 0,
                NUMERO: 215,
                PAIVAYS: "12.10.2021 04:26",
                ALUEET_EN: "ARCHIPELAGO SEA",
                ALUEET_FI: "SAARISTOMERI",
                ALUEET_SV: "SKÄRGÅRDSHAVET",
                ANTOPAIVA: "12.10.2021",
                TYYPPI_EN: "LOCAL WARNING",
                TYYPPI_FI: "LOCAL WARNING",
                TYYPPI_SV: "LOCAL WARNING",
                SISALTO_EN: "\r\nLEADINGLIGHT JURMO REAR NR 3132\r\nIN POS 60-32.1 N 021-05.9 E\r\nUNLIT",
                SISALTO_FI:
                    "\r\nLINJAMERKKI JURMO YLEMPI NR 3132\r\nPAIKASSA 60-32.1 N 021-05.9 E\r\nVALO EI TOIMI",
                SISALTO_SV:
                    "\r\nLINJEMÄRKET JURMO ÖVRE NR 3132\r\nI POS 60-32.1 N 021-05.9 E\r\nLJUSET UR FUNKTION",
                SIJAINTI_EN: "ISOKARI-LÖVSKÄR FAIRWAY",
                SIJAINTI_FI: "ISOKARI-LÖVSKÄR VÄYLÄ",
                SIJAINTI_SV: "ISOKARI-LÖVSKÄR FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: "2021-10-12 04:31:10",
                TIEDOKSIANTAJA: "Fintraffic/OFK/MEL",
                TURVALAITE_TXT:
                    "TLNUMERO:3132\r\nALALAJI:Kiinteä\r\nLAJI:\r\nWGS_LAT:6032,0734\r\nWGS_LON:2105,8668\r\nTYYPPI:Linjamerkki\r\nNIMIS:Jurmo ylempi\r\nVAYLAN_NIMI:Isokari-Lövskär väylä\r\n",
                VOIMASSA_ALKAA: null,
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: "TL:3132 Jurmo ylempi, Linjamerkki [Vahvistettu]",
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [25.6153615119869, 60.2156614213976]
            },
            properties: {
                ID: 20504,
                NAVTEX: 0,
                NUMERO: 211,
                PAIVAYS: "5.10.2021 07:30",
                ALUEET_EN: "GULF OF FINLAND",
                ALUEET_FI: "SUOMENLAHTI",
                ALUEET_SV: "FINSKA VIKEN",
                ANTOPAIVA: "05.10.2021",
                TYYPPI_EN: "LOCAL WARNING",
                TYYPPI_FI: "LOCAL WARNING",
                TYYPPI_SV: "LOCAL WARNING",
                SISALTO_EN:
                    "\r\nLEADING LIGHT HAVSUDDEN REAR NR 36\r\nIN POSITION 60-12.94N 025-36.92E\r\nLIGHT UNRELIABLE",
                SISALTO_FI:
                    "\r\nLINJAMERKKI HAVSUDDEN YLEMPI NR 36\r\nPAIKASSA 60-12.94N 025-36.92E\r\nVALO EPÄLUOTETTAVA",
                SISALTO_SV:
                    "\r\nLINJEMÄRKE HAVSUDDEN ÖVRE NR 36\r\nI POSITION 60-12.94N 025-36.92E\r\nLJUSET ÅPOLITLIG",
                SIJAINTI_EN: "SKÖLDVIK 15.3M FAIRWAY",
                SIJAINTI_FI: "SKÖLDVIKIN 15.3M VÄYLÄ",
                SIJAINTI_SV: "SKÖLDVIK 15.3M FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: "2021-10-05 08:58:38",
                TIEDOKSIANTAJA: "FINTRAFFIC/AVTS/OFK/TT",
                TURVALAITE_TXT:
                    "TLNUMERO:36\r\nALALAJI:Kiinteä\r\nLAJI:\r\nWGS_LAT:6012,94000765\r\nWGS_LON:2536,92257433\r\nTYYPPI:Linjamerkki\r\nNIMIS:Havsudden ylempi\r\nVAYLAN_NIMI:Sköldvikin 15,3m väylä\r\n",
                VOIMASSA_ALKAA: null,
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: "TL:36 Havsudden ylempi, Linjamerkki [Vahvistettu]",
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [24.4347596329857, 65.26428690371449]
            },
            properties: {
                ID: 20502,
                NAVTEX: 0,
                NUMERO: 207,
                PAIVAYS: "2.10.2021 00:25",
                ALUEET_EN: "BAY OF BOTHNIA",
                ALUEET_FI: "PERÄMERI",
                ALUEET_SV: "BOTTENVIKEN",
                ANTOPAIVA: "02.10.2021",
                TYYPPI_EN: "LOCAL WARNING",
                TYYPPI_FI: "LOCAL WARNING",
                TYYPPI_SV: "LOCAL WARNING",
                SISALTO_EN: "\r\nEDGEMARK KIISLA NR 84515\r\nIN POS 65-15,8 N 024-26,1 E\r\nUNLIT",
                SISALTO_FI:
                    "\r\nREUNAMERKKI KIISLA NR 84515\r\nPAIKASSA 65-15,8 N 024-26,1 E\r\nVALO EI TOIMI",
                SISALTO_SV:
                    "\r\nRANDMÄRKET KIISLA NR 84515\r\nI POSITION 65-15,8 N 024-26,1 E\r\nLJUSET UR FUNKTION",
                SIJAINTI_EN: "OULU 12,5 M FAIRWAY",
                SIJAINTI_FI: "OULUN 12,5 M VÄYLÄ",
                SIJAINTI_SV: "ULEÅBORG 12,5 M FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: "2021-10-02 00:52:55",
                TIEDOKSIANTAJA: "FINTRAFFIC/BVTS/OFK/",
                TURVALAITE_TXT:
                    "TLNUMERO:84515\r\nALALAJI:Kiinteä\r\nLAJI:Vasen\r\nWGS_LAT:6515,85661102\r\nWGS_LON:2426,08507314\r\nTYYPPI:Reunamerkki\r\nNIMIS:Kiisla\r\nVAYLAN_NIMI:Oulun 12,5 m väylä\r\n",
                VOIMASSA_ALKAA: null,
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: "TL:84515 Kiisla, Vasenreunamerkki [Vahvistettu]",
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [23.9177522375164, 59.674936679796595]
            },
            properties: {
                ID: 20382,
                NAVTEX: 0,
                NUMERO: 201,
                PAIVAYS: "20.9.2021 17:20",
                ALUEET_EN: "GULF OF FINLAND, NORTHERN BALTIC",
                ALUEET_FI: "POHJOINEN ITÄMERI, SUOMENLAHTI",
                ALUEET_SV: "FINSKA VIKEN, NORRA ÖSTERSJÖN",
                ANTOPAIVA: "20.09.2021",
                TYYPPI_EN: "COASTAL WARNING",
                TYYPPI_FI: "COASTAL WARNING",
                TYYPPI_SV: "COASTAL WARNING",
                SISALTO_EN:
                    "\r\nMARLIN / UBNV2 AND MURMAN / UBAN4 ARE CONDUCTING UNDERWATER SURVEY OPERATIONS STARTING FROM GULF OF FINLAND CONTINUING TOWARDS NORTHERN BALTIC.\r\n0.5 NM SAFETY DISTANCE REQUESTED.\r\n\r\nDATE AND TIME\r\n201420 UTC OF SEP",
                SISALTO_FI:
                    "\r\nMARLIN / UBNV2 JA MURMAN / UBAN4 SUORITTAVAT VEDENALAISIA TUTKIMUSTÖITÄ ALKAEN SUOMENLAHDELTA KOHTI POHJOISTA ITÄMERTA.\r\nALUKSIA PYYDETÄÄN JÄTTÄMÄÄN 0.5 NM TURVAETÄISYYS.",
                SISALTO_SV:
                    "\r\nMARLIN / UBNV2 OCH MURMAN / UBAN4 UTFÖR UNDERVATTENSUNDERSÖKNINGAR FRÅN FINSKA VIKEN MOT NORRA ÖSTERSJÖN.\r\nFARTYG OMBEDES ATT GE 0.5 NM PASSAGEAVSTÅND.",
                SIJAINTI_EN: "NORTHERN BALTIC AND GULF OF FINLAND",
                SIJAINTI_FI: "POHJOINEN ITÄMERI JA SUOMENLAHTI",
                SIJAINTI_SV: "NORRA ÖSTERSJÖN OCH FINSKA VIKEN",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: "2021-09-20 17:14:03",
                TIEDOKSIANTAJA: "FINTRAFFIC/OFK/AHÄ",
                TURVALAITE_TXT: null,
                VOIMASSA_ALKAA: null,
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: null,
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [24.523243688471396, 65.661375797369]
            },
            properties: {
                ID: 19682,
                NAVTEX: 0,
                NUMERO: 151,
                PAIVAYS: "23.7.2021 13:26",
                ALUEET_EN: "BAY OF BOTHNIA",
                ALUEET_FI: "PERÄMERI",
                ALUEET_SV: "BOTTENVIKEN",
                ANTOPAIVA: "23.07.2021",
                TYYPPI_EN: "LOCAL WARNING",
                TYYPPI_FI: "LOCAL WARNING",
                TYYPPI_SV: "LOCAL WARNING",
                SISALTO_EN:
                    "\r\nDREDGING OPERATIONS IN PROGRESS IN KEMI AJOS PORT AND IN FAIRWAY AREA BETWEEN KEMI 3 AND KEMI AJOS PORT .\r\nWORKING UNITS LISTEN TO VHF CHANNEL 67.\r\nVESSELS IN THE AREA ARE ADVISED TO NAVIGATE WITH CAUTION AND AVOID CREATING SWELL IN THE VICINITY OF THE WORKING UNITS.",
                SISALTO_FI:
                    "\r\nRUOPPAUSTYÖT KÄYNNISSÄ KEMI AJOKSEN SATAMASSA JA VÄYLÄALUEELLA VÄLILLÄ KEMI 3 – KEMI AJOKSEN SATAMA.\r\nTYÖYKSIKÖT KUUNTELEVAT VHF KANAVAA 67.\r\nALUEELLA LIIKKUVIEN ALUSTEN TULEE NOUDATTAA VAROVAISUUTTA JA VÄLTTÄÄ AALLOKON MUODOSTUSTA TYÖALUSTEN LÄHEISYYDESSÄ.",
                SISALTO_SV:
                    "\r\nMUDDRINGSARBETE PÅGÅR I KEMI AJOS HAMN OCH VID FARLEDSOMRÅDEN MELLAN KEMI 3 OCH KEMI AJOS HAMN.\r\nARBETSFARTYGEN LYSSNAR PÅ VHF KANAL 67.\r\nFARTYG I OMRÅDET UPPMANAS ATT NAVIGERA MED FÖRSIKTIGHET OCH UNDVIKA ATT ORSAKA SVALL I NÄRHETEN AV ARBETSENHETER.",
                SIJAINTI_EN: "KEMI AJOS PORT AND KEMI 10M FAIRWAY",
                SIJAINTI_FI: "KEMI AJOKSEN SATAMA JA KEMIN 10M VÄYLÄ",
                SIJAINTI_SV: "KEMI AJOS HAMN OCH KEMI 10 M FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: null,
                TIEDOKSIANTAJA: "FINTRAFFIC/BVTS/OFK/TR",
                TURVALAITE_TXT: null,
                VOIMASSA_ALKAA: null,
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: null,
                VIRTUAALINENTURVALAITE: 0
            }
        },
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [25.222537221394298, 60.176385091448296]
            },
            properties: {
                ID: 18402,
                NAVTEX: 0,
                NUMERO: 82,
                PAIVAYS: "14.4.2021 15:30",
                ALUEET_EN: "GULF OF FINLAND",
                ALUEET_FI: "SUOMENLAHTI",
                ALUEET_SV: "FINSKA VIKEN",
                ANTOPAIVA: "14.04.2021",
                TYYPPI_EN: "LOCAL WARNING",
                TYYPPI_FI: "LOCAL WARNING",
                TYYPPI_SV: "LOCAL WARNING",
                SISALTO_EN:
                    "\r\nDREDGING OPERATIONS IN PROGRESS IN VUOSAARI PORT AND IN THE FAIRWAY AREA SOUTH OF MUSTA HEVONEN.\r\nTHE FAIRWAY AREA IS LIMITED IN PLACES WITH AIDS TO NAVIGATION.\r\nWORKING UNITS LISTEN TO VHF CHANNEL 71.\r\nVESSELS IN THE AREA ARE ADVISED TO REDUCE SPEED AND AVOID CREATING SWELL IN THE VICINITY OF THE WORKING UNITS.\r\n",
                SISALTO_FI:
                    "\r\nRUOPPAUS- JA LOUHINTATYÖT KÄYNNISSÄ VUOSAAREN SATAMASSA JA VÄYLÄLLÄ MUSTAN HEVOSEN ETELÄPUOLELLA. NORMAALIA VÄYLÄALUETTA ON RAJOITETTU PAIKOIN LOUHINTATÖIDEN TAKIA TURVALAITTEILLA. \r\nTYÖYKSIKÖT KUUNTELEVAT VHF KANAVAA 71.\r\nALUEELLA LIIKKUVIEN ALUSTEN TULEE HILJENTÄÄ NOPEUTTA JA VÄLTTÄÄ AALLOKON MUODOSTUSTA TYÖALUSTEN LÄHEISYYDESSÄ.\r\n",
                SISALTO_SV:
                    "\r\nMUDDRINGS- OCH SPRÄNGNINGSARBETE PÅGÅR I NORDSJÖ HAMN OCH PÅ FARLEDENS SÖDRA SIDAN OM MUSTA HEVONEN.\r\nFARLEDSOMRÅDET ÄR STÄLLVIS BEGRÄNSAT MED SÄKERHETSANORDNINGAR.\r\nARBETSFARTYGEN LYSSNAR PÅ VHF KANAL 71.\r\nFARTYG I OMRÅDET BÖR SAKTA FARTEN OCH UNDVIKA ATT ORSAKA SVALL I NÄRHETEN AV ARBETSENHETER.\r\n",
                SIJAINTI_EN: "VUOSAARI 11M FAIRWAY",
                SIJAINTI_FI: "VUOSAARI 11M VÄYLÄ",
                SIJAINTI_SV: "NORDSJÖ 11M FARLED",
                VAYLAALUE_TXT: null,
                TALLENNUSPAIVA: null,
                TIEDOKSIANTAJA: "FINTRAFFIC/HKIVTS/OFK/AL",
                TURVALAITE_TXT: null,
                VOIMASSA_ALKAA: "2021-04-14 15:00:00",
                VOIMASSA_PAATTYY: null,
                NAVIGOINTILINJA_TXT: null,
                VALITTUKOHDE_TOOLTIP: null,
                VIRTUAALINENTURVALAITE: 0
            }
        }
    ]
};
export const TEST_WARNINGS_EMPTY_VALID: FeatureCollection = {
    type: "FeatureCollection",
    features: []
};
