export interface Props {
    logsDestinationArn: string;
    elasticSearchEndpoint: string;
    elasticSearchDomainArn: string;
    s3BucketName: string;
    emails: string[];
    app: string;
    env: string;
}

