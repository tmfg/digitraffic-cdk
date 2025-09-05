export function removePathParts(uri: string, count: number): string {
  let newUri = uri;

  while (count-- > 0) {
    // remove first part of the path

    const secondSlashIndex = newUri.indexOf("/", 1);

    if (secondSlashIndex !== -1) {
      newUri = newUri.substring(secondSlashIndex);
    }
  }

  return newUri;
}
