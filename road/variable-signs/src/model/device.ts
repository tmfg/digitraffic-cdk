export interface DbDevice {
  id: string;
  modified: Date;
  deleted_date: Date | undefined;
  type: string;
  road_address: string;
  direction: string;
  carriageway: string;
  etrs_tm35fin_x: number;
  etrs_tm35fin_y: number;
}
