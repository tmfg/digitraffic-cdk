/* eslint-disable @rushstack/no-new-null */
import type { Generated } from "kysely"
import type { Direction, Domain, Granularity, TravelMode } from "./v2/types.js"

export interface SiteTable {
    id: number
    name: string
    domain: Domain
    description: string | null
    custom_id: string | null
    latitude: number
    longitude: number
    granularity: Granularity | null
    directional: boolean
    travel_modes: TravelMode[]
    removed_timestamp: Date | null
    last_data_timestamp: Date | null
    created: Generated<Date>
    modified: Generated<Date>
}

export interface DataTable {
    site_id: number
    travel_mode: TravelMode
    direction: Direction
    data_timestamp: Date
    granularity: Granularity
    counts: number
    created: Generated<Date>
    modified: Generated<Date>
}

export interface Database {
    cs2_site: SiteTable
    cs2_data: DataTable
  }