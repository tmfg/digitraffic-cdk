export function removePathParts(uri: string, count: number): string {
  // collapse repeated slashes, nginx did this for us before CloudFront was added in front of it
  let newUri = uri.replace(/\/{2,}/g, "/");

  while (count-- > 0) {
    // remove first part of the path

    const secondSlashIndex = newUri.indexOf("/", 1);

    if (secondSlashIndex !== -1) {
      newUri = newUri.substring(secondSlashIndex);
    }
  }

  return newUri;
}
