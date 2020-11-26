import {Location} from "../../../../common/postgres/geometry";

export interface Annotation {
    _id: string,
    author: string,
    created_at: Date,
    updated_at: Date,
    recorded_at: Date,
    expires_at: Date | null,
    tags: string[],
    location: Location
}