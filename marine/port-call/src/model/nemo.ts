export type PortCallStatus = "Expected to Arrive" | "Arrived" | "Departed" | "Cancelled";

export interface NemoPortCall {
    readonly vesselInformation: {
        /**
         * Aluksen IMO-numero
         */
        readonly identification: string
        /**
         * Aluksen nimi
         */
        readonly name: string
    }
    readonly voyageInformation: {
        /**
         * Käyntisatama, koodattu
         */
        readonly portIdentification: string
        /**
         * Saapumispäivä ja -aika – arvioitu, paikallista aikaa
         */
        readonly estimatedArrivalDateTime: string
        /**
         * Lähtöpäivä ja -aika – arvioitu, paikallista aikaa
         */
        readonly estimatedDepartureDateTime: string
    }
    readonly arrivalNotification: {
        /**
         * Saapumispäivä ja -aika – toteutunut, paikallista aikaa
         */
        readonly actualArrivalDateTime: string
    }
    readonly departureNotification: {
        /**
         * Lähtöpäivä ja -aika – toteutunut, paikallista aikaa
         */
        readonly actualDepartureDateTime: string
    }
    readonly portCallStatus: {
        /**
         * Satamakäynnin tila
         */
        readonly status: PortCallStatus
    }
}

export interface NemoVisit {
    readonly visitId?: string
    readonly portCall: NemoPortCall
};
  
export type NemoResponse = NemoVisit[];