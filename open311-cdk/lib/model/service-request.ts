export enum ServiceRequestStatus {
    open = 'open',
    closed = 'closed'
}

export interface ServiceRequest {
    readonly service_request_id: string;
    readonly status: ServiceRequestStatus;
    readonly status_notes: string | null;
    readonly service_name: string | null;
    readonly service_code: string | null;
    readonly description: string;
    readonly agency_responsible: string | null;
    readonly service_notice: string | null;
    readonly requested_datetime: Date;
    readonly updated_datetime: Date | null;
    readonly expected_datetime: Date | null;
    readonly address: string | null;
    readonly address_id: string | null;
    readonly zipcode: string | null;
    readonly geometry: Open311Point | null;
    readonly media_url: string | null;
}

export interface Open311Point {
    readonly long: number;
    readonly lat: number;
}