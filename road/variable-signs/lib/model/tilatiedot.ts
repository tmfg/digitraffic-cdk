export type TloikTilatiedot = {
    liikennemerkit: TloikLiikennemerkinTila[];
}

export type TloikLiikennemerkinTila = {
    rivit: TloikRivi[];
    tunnus: string;
    nayttama?: string;
    lisatieto?: string;
    voimaan: Date;
    syy?: string;
    luotettavuus: string;
}

export type TloikRivi = {
    naytto: number;
    rivi: number;
    teksti?: string;
}
