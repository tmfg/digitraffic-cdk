export interface Annotation {
    _id: string,
    created_at: Date,
    recorded_at: Date,
    expires_at: Date | null,
    tags: string[],
    location: any
}