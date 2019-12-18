export interface Annotation {
    _id: string,
    created_at: Date,
    recorded_at: Date,
    tags: string[],
    location: any
}