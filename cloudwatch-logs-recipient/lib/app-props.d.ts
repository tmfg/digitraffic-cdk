declare interface Props {

    accounts: Account[];
    elasticSearchEndpoint: string;
    elasticSearchDomainArn: string;
}

interface Account {
    accountNumber: string;
    env: string;
    app: string;
}