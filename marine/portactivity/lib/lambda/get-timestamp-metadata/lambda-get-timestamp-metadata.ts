const metadata: {[key: string] : string} = {
    ETA: 'ETA',
    ETD: 'ETD',
    ATA: 'ATA',
    ATD: 'ATD',
    EPO: 'EPO',
    EPS: 'EPS',
    EPC: 'EPC',
    APO: 'APO',
    APS: 'APS',
    APC: 'APC'
};

export async function handler(): Promise<object> {
    // statusCode: 200 and content-type: application/json are inferred by API Gateway on a valid JSON body
    return {
        body: JSON.stringify(metadata)
    }
}
