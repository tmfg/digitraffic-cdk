/*
// Signers API as well as NodeHttpClient are part of private API in AWS SDK v2.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace AWS {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Signers {
      class V4 {
        constructor(request, serviceName, options)
        addAuthorization(...args)
      }
    }
    class NodeHttpClient {
      handleRequest(...args)
    }
  }
}
export {}*/
