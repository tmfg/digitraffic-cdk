export type DbCamera = {
    readonly id: string;
    readonly name: string;
    readonly camera_group_id: string;
    readonly last_updated: Date;
}

export type Camera = {
    readonly id: string,
    readonly name: string,
    readonly cameraGroupId: string,
    readonly lastUpdated: Date
}
