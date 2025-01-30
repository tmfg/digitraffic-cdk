export interface TloikMetatiedot {
  laitteet: TloikLaite[];
}

export interface TloikLaite {
  tunnus: string;
  sijainti: TloikSijainti;
  tyyppi: string;
}

export interface TloikSijainti {
  tieosoite: string;
  ajosuunta: string;
  ajorata: string;
  n: number;
  e: number;
}
