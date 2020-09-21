import {Moment} from 'moment';

export interface EstimateSubscription {
    readonly phoneNumber: string
    readonly locode: string
    readonly time: Moment
}

export interface SnsSubscriptionEvent {
    readonly originationNumber: string
    readonly messageBody: string
}
