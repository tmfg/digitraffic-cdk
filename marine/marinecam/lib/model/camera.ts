export type DbCamera = {
    readonly id: string
    readonly name: string
    // eslint-disable-next-line camelcase
    readonly camera_group_id: string
    // eslint-disable-next-line camelcase
    readonly last_updated: Date
    readonly lat: number
    readonly long: number
}

export type Camera = {
    readonly id: string
    readonly name: string
    readonly cameraGroupId: string
    readonly lastUpdated: Date
    readonly latitude: number
    readonly longitude: number
}
