export interface Props {
    // Digitraffic application URL
    readonly appUrl?: string;
    // Digitraffic beta application URL
    readonly betaAppUrl?: string
    // API Gateway API ids
    readonly apiGwAppIds: string[];
    // log destination ARN
    readonly logsDestinationArn: string;
    // bucket where merged Swagger description is stored
    readonly bucketName: string;
    // S3 VPC endpoint id
    readonly s3VpcEndpointId?: string;
    // S3 website, s3VpcEndpointId is ignored if true
    readonly s3Website: boolean
    // Canonical User ID if the Swagger bucket is served through CloudFront
    readonly cloudFrontCanonicalUser?: string
}
