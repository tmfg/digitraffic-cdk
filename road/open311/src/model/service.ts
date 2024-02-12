export type ServiceType = "realtime" | "batch" | "blackbox";

export interface Service {
    service_code: string;
    service_name: string;
    description: string;
    metadata: boolean;
    type: ServiceType;
    keywords: string;
    group: string;
}
