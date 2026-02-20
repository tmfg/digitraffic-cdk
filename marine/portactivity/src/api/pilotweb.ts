import * as https from "node:https";

const PILOTAGES_PATH = "/digitraffic/pilotages/active";

export function getMessages(host: string, authHeader: string): Promise<string> {
  let content = "";

  return new Promise((resolve, reject) => {
    https
      .request(
        {
          host: host,
          path: PILOTAGES_PATH,
          method: "GET",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "text/plain",
          },
        },
        (response) => {
          //another chunk of data has been received, so append it to `str`
          response.on("data", (chunk) => {
            content += chunk;
          });

          //the whole response has been received, so we just print it out here
          response.on("end", () => {
            resolve(content);
          });

          response.on("error", (error) => {
            reject(error);
          });
        },
      )
      .end();
  });
}
