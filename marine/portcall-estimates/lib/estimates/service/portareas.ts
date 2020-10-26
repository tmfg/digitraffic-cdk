export function getPortAreaGeometries(): PortareaGeometry[] {
    return [
        {
            locode: 'FIHKO',
            longitude: 22.945464,
            latitude: 59.819656
        },
        {
            locode: 'FIKVH',
            longitude: 23.223845,
            latitude: 59.880550
        },
        {
            locode: 'FIRAU',
            longitude: 21.449522,
            latitude: 61.124633
        },
        {
            locode: 'FIUKI',
            longitude: 21.374408,
            latitude: 60.795706
        },
        {
            locode: 'FIHEL',
            longitude: 25.197011,
            latitude: 60.211016
        },
        {
            locode: 'FIKOK',
            longitude: 23.016646,
            latitude: 63.864792
        },
        {
            locode: 'FIMUS',
            longitude: 28.329423,
            latitude: 61.057657
        }
    ];
}

export interface PortareaGeometry {
    readonly locode: string
    readonly latitude: number
    readonly longitude: number
}
