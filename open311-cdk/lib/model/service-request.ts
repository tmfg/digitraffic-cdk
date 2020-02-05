export enum ServiceRequestStatus {
    open = 'open',
    closed = 'closed'
}

export interface ServiceRequest {
    readonly service_request_id: string;
    readonly status: ServiceRequestStatus;
    readonly status_notes?: string;
    readonly service_name?: string;
    readonly service_code?: string;
    readonly description: string;
    readonly agency_responsible?: string;
    readonly service_notice?: string;
    readonly requested_datetime: Date;
    readonly updated_datetime?: Date;
    readonly expected_datetime?: Date;
    readonly address?: string;
    readonly address_id?: string;
    readonly zipcode?: string;
    readonly long?: number;
    readonly lat?: number;
    readonly media_url?: string;
    readonly status_id?: string;
    readonly title?: string;
    readonly service_object_id?: string;
    readonly service_object_type?: string;
    readonly media_urls?: string[];
}
