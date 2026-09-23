export type URN<
  Namespace extends string,
  NamespaceSpecificString extends string = "",
> = `urn:${Namespace}:${NamespaceSpecificString}`;
