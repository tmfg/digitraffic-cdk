export interface Location {
    type: string,
    coordinates: any
}

export function createGeometry(location: Location): string {
    if(location.type === 'LineString') {
        const coordinates = linestring(location.coordinates);

        return `LINESTRING(${coordinates})`;
    } else if(location.type === 'Point') {
        const coordinates = coordinatePair(location.coordinates);

        return `POINT(${coordinates})`;
    } else if(location.type === 'Polygon') {
        const coordinates = polygon(location.coordinates);

        return `POLYGON(${coordinates})`;
    } else if(location.type === 'MultiPolygon') {
        const coordinates = multiPolygon(location.coordinates);

        return `MULTIPOLYGON(${coordinates})`;
    }

    console.error("unsupported locationType=%s", location.type);
    return "POLYGON EMPTY";
}

function linestring(coordinates: any): string {
    return coordinates.map((c: any) =>  coordinatePair(c)).join(',');
}

function polygon(coordinates: any):string {
    const list = coordinates.map((c: any) => linestring(c)).join(',');
    return `(${list})`;
}

function multiPolygon(coordinates: any):string {
    const list = coordinates.map((c: any) => polygon(c)).join(',');
    return `(${list})`;
}

function coordinatePair(coordinate: [number, number, number]): string {
    return `${coordinate[0]} ${coordinate[1]}`;
}
