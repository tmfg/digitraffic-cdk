export type TloikMetatiedot = {
    laitteet: TloikLaite[];
};

export type TloikLaite = {
    tunnus: string;
    sijainti: TloikSijainti;
    tyyppi: string;
};

export type TloikSijainti = {
    tieosoite: string;
    ajosuunta: string;
    ajorata: string;
    n: number;
    e: number;
};
