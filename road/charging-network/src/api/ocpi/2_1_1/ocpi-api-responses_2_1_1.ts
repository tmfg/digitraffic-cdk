import { URL, OcpiSuccessResponse } from "../ocpi-api-responses";

export type ImageCategory = "CHARGER" | "ENTRANCE" | "LOCATION" | "NETWORK" | "OPERATOR" | "OTHER" | "OWNER";

export interface Image {
    url: URL;
    thumbnail?: URL;
    category: ImageCategory;
    /** (4) Image type like: gif, jpeg, png, svg */
    type: string;
    width?: number;
    height?: number;
}

export interface BusinessDetails {
    name: string;
    logo?: Image;
    website?: string;
}

export interface Credentials {
    url: URL;
    // (64)
    token: string;
    // (3)
    party_id: string;
    // (2)
    country_code: "FI"; // in future maybe "FI" | "SE"
    business_details: BusinessDetails;
}

export enum LocationType {
    /** Parking in public space. */
    ON_STREET,
    /** Multistorey car park. */
    PARKING_GARAGE,
    /** Multistorey car park, mainly underground. */
    UNDERGROUND_GARAGE,
    /** A cleared area that is intended for parking vehicles, i.e. at super markets, bars, etc. */
    PARKING_LOT,
    /** None of the given possibilities. */
    OTHER,
    /** Parking location type is not known by the operator (default). */
    UNKNOWN
}

export enum ParkingRestriction {
    /** Reserved parking spot for electric vehicles. */
    EV_ONLY,
    /** Parking is only allowed while plugged in (charging). */
    PLUGGED,
    /** Reserved parking spot for disabled people with valid ID. */
    DISABLED,
    /** Parking spot for customers/guests only, for example in case of a hotel or shop. */
    CUSTOMERS,
    /** Parking spot only suitable for (electric) motorcycles or scooters. */
    MOTORCYCLES
}

export interface DisplayText {
    /** (2) 1 Language Code ISO 639-1 */
    language: string;
    /** (512) Text to be displayed to a end user. No markup, html etc. allowed. */
    text: string;
}
/** The geodetic system to be used is WGS 84. */
export interface GeoLocation {
    /** (10) Latitude of the point in decimal degree.
     * Example: 50.770774.
     * Decimal separator: “.”
     * Regex: -?[0-9]{1,2}\.[0-9]{6} */
    latitude: number;
    /** (10) Longitude of the point in decimal degree. 
     * Example: -126.104965. 
     * Decimal separator: “.” 
     * Regex:
-?[0-9]{1,3}\.[0-9]{6} */
    longitude: number;
}

export interface AdditionalGeoLocation {
    /** (10) Latitude of the point in decimal degree. Example: 50.770774. Decimal separator: “.” Regex: -?[0-9]{1,2}\.[0-9]{6} */
    latitude: number;
    /** (11) Longitude of the point in decimal degree. Example: -126.104965. Decimal separator: “.” Regex: -?[0-9]{1,3}\.[0-9]{6}*/
    longitude: number;
    name?: DisplayText;
}

export enum Status {
    /** The EVSE/Connector is able to start a new charging session. */
    AVAILABLE,
    /** The EVSE/Connector is not accessible because of a physical barrier, i.e. a car. */
    BLOCKED,
    /** The EVSE/Connector is in use. */
    CHARGING,
    /** The EVSE/Connector is not yet active or it is no longer available (deleted). */
    INOPERATIVE,
    /** The EVSE/Connector is currently out of order. */
    OUTOFORDER,
    /** The EVSE/Connector is planned, will be operating soon */
    PLANNED,
    /** The EVSE/Connector/charge point is discontinued/removed. */
    REMOVED,
    /** The EVSE/Connector is reserved for a particular EV driver and is unavailable for other drivers. */
    RESERVED,
    /** No status information available. (Also used when offline) */
    UNKNOWN
}

export interface StatusSchedule {
    /** Begin of the scheduled period. The combined date and time format from the ISO 8601 standard. */
    period_begin: Date;
    /** End of the scheduled period, if known. The combined date and time format from the ISO 8601 standard. */
    period_end?: Date;
    /** Status value during the scheduled period. */
    status: Status;
}

export enum Capability {
    CHARGING_PROFILE_CAPABLE,
    CREDIT_CARD_PAYABLE,
    REMOTE_START_STOP_CAPABLE,
    RESERVABLE,
    RFID_READER,
    UNLOCK_CAPABLE
}

export enum ConnectorType {
    CHADEMO,
    DOMESTIC_A,
    DOMESTIC_B,
    DOMESTIC_C,
    DOMESTIC_D,
    DOMESTIC_E,
    DOMESTIC_F,
    DOMESTIC_G,
    DOMESTIC_H,
    DOMESTIC_I,
    DOMESTIC_J,
    DOMESTIC_K,
    DOMESTIC_L,
    IEC_60309_2_single_16,
    IEC_60309_2_three_16,
    IEC_60309_2_three_32,
    IEC_60309_2_three_64,
    IEC_62196_T1,
    IEC_62196_T1_COMBO,
    IEC_62196_T2,
    IEC_62196_T2_COMBO,
    IEC_62196_T3A,
    IEC_62196_T3C,
    TESLA_R,
    TESLA_S
}

export enum ConnectorFormat {
    SOCKET,
    CABLE
}

export enum PowerType {
    AC_1_PHASE,
    AC_3_PHASE,
    DC
}

export interface Connector {
    /** Identifier of the connector within the EVSE. Two connectors may have the same id as long as they do not belong to the same EVSE object. */
    id: string;
    standard: ConnectorType;
    format: ConnectorFormat;
    power_type: PowerType;
    voltage: number;
    amperage: number;
    /** (36) Identifier of the current charging tariff structure. For a “Free of Charge” tariff this field should be set, and point to a defined “Free of Charge” tariff. */
    tariff_id?: string;
    terms_and_conditions?: URL;
    last_updated: Date;
}

export interface Image {}

export interface EVSE {
    /** (39) Uniquely identifies the EVSE within the CPOs platform (and suboperator platforms).
     * For example a database unique ID or the “EVSE ID”. This field can never be changed, modified or renamed.
     * This is the ‘technical’ identification of the EVSE, not to be used as ‘human readable’ identification,
     * use the field: evse_id for that. */
    uid: string;
    /** (48) Compliant with the following specification for EVSE ID from “eMI3 standard version V1.0”
     * (http: //emi3group.com/documents-links/) “Part 2: business objects.” Optional because: if an EVSE ID is
     * to be re-used the EVSE ID can be removed from an EVSE that is removed (status: REMOVED) */
    evse_id?: string;
    status: Status;
    status_schedule?: StatusSchedule[];
    capabilities?: Capability[];
    connectors: Connector[];
    floor_level: string; // (4)
    coordinates?: GeoLocation;
    /** A number/string printed on the outside of the EVSE for visual identification. */
    physical_reference?: string;
    directions?: DisplayText[];
    parking_restrictions?: ParkingRestriction[];
    images?: Image;
    last_updated: Date;
}
export enum EnergySourceCategory {
    NUCLEAR,
    GENERAL_FOSSIL,
    COAL,
    GAS,
    GENERAL_GREEN,
    SOLAR,
    WIND,
    WATER
}

export interface EnergySource {
    source: EnergySourceCategory;
    /** 0-100 */
    percentage: number;
}

export enum EnvironmentalImpactCategory {
    NUCLEAR_WASTE,
    CARBON_DIOXIDE
}

export interface EnvironmentalImpact {
    source: EnvironmentalImpactCategory;
    /** Amount of this portion in g/kWh. */
    amount: number;
}

export interface EnergyMix {
    is_green_energy: boolean;
    energy_sources: EnergySource[];
    environ_impact: EnvironmentalImpact;
    supplier_name: string;
    energy_product_name: string;
}

export enum Facility {
    HOTEL,
    RESTAURANT,
    CAFE,
    MALL,
    SUPERMARKET,
    SPORT,
    RECREATION_AREA,
    NATURE,
    MUSEUM,
    BUS_STOP,
    TAXI_STAND,
    TRAIN_STATION,
    AIRPORT,
    CARPOOL_PARKING,
    FUEL_STATION,
    WIFI
}

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RegularHours {
    /** Number of day in the week, from Monday (1) till Sunday (7) */
    weekday: Weekday;
    /** (5) Begin of the regular period given in hours and minutes. Must be in 24h format with leading zeros.
     * Example: “18:15”. Hour/Minute separator: “:” Regex: [0-2][0-9]:[0-5][0-9] */
    period_begin: string;
    /** (5) End of the regular period, syntax as for period_begin. Must be later than period_begin. */
    period_end: string;
}

export interface ExceptionalPeriod {
    period_begin: Date;
    period_end: Date;
}

export interface Hours {
    regular_hours?: RegularHours[];
    twentyfourseven: boolean;
    exceptional_openings?: ExceptionalPeriod;
    exceptional_closings?: ExceptionalPeriod;
}

/**
 * When the CPO wants to delete an EVSE they must update by setting the status field to REMOVED and call the
 * PUT or PATCH on the eMSP system.
 * A Location without valid EVSE objects can be considered as expired and should no longer be displayed.
 * There is no direct way to delete a location.
 */
export interface Location {
    /** (39) Uniquely identifies the location within the CPOs platform (and suboperator platforms).
     * This field can never be changed, modified or renamed. */
    id: string;
    /** The general type of the charge point location. */
    type: LocationType;
    /** (255) Display name of the location. */
    name?: string;
    /** (45) Street/block name and house number if available. */
    address: string;
    /** (45) City or town. */
    city: string;
    /** (10) Postal code of the location. */
    postal_code: string;
    /** (3) ISO 3166-1 alpha-3 code for the country of this location. */
    country: string;
    /**  */
    coordinates: GeoLocation;
    related_locations?: AdditionalGeoLocation[];
    evses?: EVSE[];
    directions?: DisplayText[];
    operator?: BusinessDetails;
    suboperator?: BusinessDetails;
    owner?: BusinessDetails;
    facilities?: Facility[];
    /** One of IANA tzdata’s TZ-values representing the time zone of the location. Examples: “Europe/Oslo”,
     * “Europe/Zurich”. (http://www.iana.org/time- zones) */
    time_zone?: string;
    opening_times?: Hours;
    charging_when_closed: boolean;
    images?: Image[];
    energy_mix?: EnergyMix;
    last_updated: Date;
}

export interface CredentialsObject extends OcpiSuccessResponse<Credentials> {}

export interface LocationResponse extends OcpiSuccessResponse<Location[]> {}
