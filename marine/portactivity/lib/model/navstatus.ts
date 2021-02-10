/*
    A non-complete enumeration of AIS navigational statuses to be used with the ETA timestamps API
 */
export enum NavStatus {
    UNDER_WAY_USING_ENGINE = 'under_way_using_engine',
    AT_ANCHOR = 'at_anchor',
    NOT_UNDER_COMMAND = 'not_under_command',
    RESTRICTED_MANEUVERABILITY = 'restricted_maneuverability',
    CONSTRAINED_BY_DRAUGHT = 'constrained_by_draught',
    MOORED = 'moored',
    AGROUND = 'aground',
    FISHING = 'fishing',
    UNDER_WAY_SAILING = 'under_way_sailing',
    RESERVED = 'reserved',
    TOWING = 'towing',
    AIS_SART = 'ais_sart',
    UNDEFINED = 'undefined'
}