export interface PortSuspensionWithLocations {
  readonly id: string;
  readonly start_time: Date;
  readonly end_time?: Date;
  readonly prenotification: string;
  readonly ports_closed: boolean;
  readonly due_to: string;
  readonly specifications?: string;

  // from locations
  readonly location_id: string;
}
