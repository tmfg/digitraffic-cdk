export interface IpSetProps {
    readonly name: string
    readonly addresses: string[]
}

export interface Props {
    readonly ipSets: IpSetProps[]
    readonly ipRestrictions: IpRestrictionProps[]
}

export interface IpRestrictionProps {
    readonly name: string
    readonly resourceArn: string
    readonly ipSetNames: string[]
}
