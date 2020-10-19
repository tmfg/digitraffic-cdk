export function getPortAreaGeometries(): PortareaGeometry[] {
    return [
        {
            locode: 'FIHKO',
            latitude: 59.880550,
            longitude: 23.223845
        },
        {
            locode: 'FIKVH',
            latitude: 59.819656,
            longitude: 22.945464
        }
    ];
}

export interface PortareaGeometry {
    readonly locode: string
    readonly latitude: number
    readonly longitude: number
}
