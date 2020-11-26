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