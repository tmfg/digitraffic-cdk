export type TyokoneenseurannanKirjaus = {
    readonly otsikko: {
        readonly lahettaja: {
            readonly jarjestelma: string;
        },
        readonly lahetysaika: string
    },
    havainnot: Havainto[]
}

export type Havainto = {
    readonly havainto: {
        readonly tyokone: {
            readonly id: number;
        },
        readonly urakkaid: number,
        readonly havaintoaika: string;
    }
}