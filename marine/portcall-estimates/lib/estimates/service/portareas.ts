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
        },
        {
            locode: 'FIRAU',
            longitude: 61.124633,
            latitude: 21.449522
        },
        {
            locode: 'FIUKI',
            longitude: 60.795706,
            latitude: 21.374408
        },
        {
            locode: 'FIHEL',
            longitude: 60.211016,
            latitude: 25.197011
        },
        {
            locode: 'FIKOK',
            longitude: 63.864792,
            latitude: 23.016646
        },
        {
            locode: 'FIMUS',
            longitude: 61.057657,
            latitude: 28.329423
        }
    ];
}

export interface PortareaGeometry {
    readonly locode: string
    readonly latitude: number
    readonly longitude: number
}
