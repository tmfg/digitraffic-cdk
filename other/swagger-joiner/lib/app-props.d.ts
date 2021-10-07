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
    // Canonical User ID if the Swagger bucket is served through CloudFront
    readonly cloudFrontCanonicalUser?: string
    // Move generated files into a directory, instead of the bucket root
    readonly directory?: string
    // Host to use as endpoint for HTTP calls from Swagger
    readonly host?: string
    // Swagger page title
    readonly title?: string
    // Swagger page description
    readonly description?: string
    // Remove security (e.g. API key) from imported Swagger descriptioin
    readonly removeSecurity?: boolean
}
