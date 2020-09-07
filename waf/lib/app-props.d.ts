export interface IpSetProps {
    readonly name: string
    readonly addresses: string[]
}

export interface Props {
    readonly ipSets: IpSetProps[]
    readonly ipRestrictions: IpRestrictionProps[]
}

export interface IpRestrictionProps {
    // IP restriction name
    readonly name: string
    // API Gateway arn
    readonly resourceArn: string
    // IP Set names
    readonly ipSetNames: string[]
}
