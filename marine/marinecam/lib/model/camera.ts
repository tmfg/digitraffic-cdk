export type DbCamera = {
    readonly id: string;
    readonly name: string;
    // eslint-disable-next-line camelcase
    readonly camera_group_id: string;
    // eslint-disable-next-line camelcase
    readonly last_updated: Date;
}

export type Camera = {
    readonly id: string,
    readonly name: string,
    readonly cameraGroupId: string,
    readonly lastUpdated: Date
}
