export type ApiExcavationPermit = {
    readonly id: string;
    readonly subject: string;
    readonly gmlGeometryXmlString: string;
    readonly effectiveFrom: Date;
    readonly effectiveTo: Date;
}
