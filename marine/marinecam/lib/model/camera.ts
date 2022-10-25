export interface DbCamera {
    readonly id: string
    readonly name: string
    readonly camera_group_id: string
    readonly last_updated: Date
    readonly lat: number
    readonly long: number
}

export interface Camera {
    readonly id: string
    readonly name: string
    readonly cameraGroupId: string
    readonly lastUpdated: Date
    readonly latitude: number
    readonly longitude: number
}
