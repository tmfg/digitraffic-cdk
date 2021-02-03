interface Props {
    accounts: Account[];
    elasticSearchEndpoint: string;
    elasticSearchDomainArn: string;
}

interface Account {
    accountNumber: string;
    app: string;
    env: string;
}

interface AppLogSubscription {
    destinationArn: string,
    logGroupNames: string[]
}