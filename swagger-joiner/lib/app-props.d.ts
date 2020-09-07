export interface Props {
    // Digitraffic application URL
    appUrl: string;
    // API Gateway API ids
    apiGwAppIds: string[];
    // log destination ARN
    logsDestinationArn: string;
    // bucket where merged Swagger description is stored
    bucketName: string;
    // S3 VPC endpoint id
    s3VpcEndpointId: string;
}
