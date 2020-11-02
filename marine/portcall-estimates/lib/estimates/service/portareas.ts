const ports: Port[] = [
    {
        locode: 'FIHKO',
        areas: [{
            longitude: 23.223845,
            latitude: 59.880550,
            portAreaCode: 'KOV'
        }, {
            longitude: 22.904302,
            latitude: 59.809312,
            portAreaCode: 'OUT'
        }],
        default: {
            // WEST
            longitude: 22.945464,
            latitude: 59.819656
        }
    },
    {
        locode: 'FIRAU',
        areas: [],
        default: {
            longitude: 21.449522,
            latitude: 61.124633
        },
    },
    {
        locode: 'FIUKI',
        areas: [],
        default: {
            longitude: 21.374408,
            latitude: 60.795706
        }
    },
    {
        locode: 'FIKOK',
        areas: [],
        default: {
            longitude: 23.016646,
            latitude: 63.864792
        }
    },
    {
        locode: 'FIMUS',
        areas: [],
        default: {
            longitude: 28.329423,
            latitude: 61.057657
        }
    },
    {
        locode: 'FIHEL',
        areas: [{
            longitude: 25.197011,
            latitude: 60.211016,
            portAreaCode: 'VUOS'
        }],
        default: null
    }
];

export function getPortAreaGeometries(): Port[] {
    return ports;
}

export interface PortAreaCoordinates {
    readonly latitude: number
    readonly longitude: number
}

export interface PortArea extends PortAreaCoordinates {
    readonly portAreaCode?: string
}

export interface Port {
    readonly locode: string
    readonly areas: PortArea[]
    readonly default: PortAreaCoordinates | null
}

