export interface Annotation {
    _id: string,
    created_at: Date,
    recorded_at: Date,
    expires_at: Date,
    tags: string[],
    location: any
}