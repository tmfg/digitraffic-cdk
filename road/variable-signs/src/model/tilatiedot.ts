export interface TloikTilatiedot {
  liikennemerkit: TloikLiikennemerkinTila[];
}

export interface TloikLiikennemerkinTila {
  rivit?: TloikRivi[];
  tunnus: string;
  nayttama?: string;
  lisatieto?: string;
  voimaan: Date;
  syy?: string;
  luotettavuus: string;
}

export interface TloikRivi {
  naytto: number;
  rivi: number;
  teksti?: string;
}
