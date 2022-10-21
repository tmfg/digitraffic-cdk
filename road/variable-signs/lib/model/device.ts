export interface DbDevice {
    id: string;
    updated_date: Date;
    deleted_date: Date | null;
    type: string;
    road_address: string;
    direction: string;
    carriageway: string;
    etrs_tm35fin_x: number;
    etrs_tm35fin_y: number;
}
