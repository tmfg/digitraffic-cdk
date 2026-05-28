export const generalNotes =
  "### General notes of the API\n" +
  "* Many Digitraffic APIs use the GeoJSON format. The definition of GeoJSON can be found at [https://tools.ietf.org/html/rfc7946](https://tools.ietf.org/html/rfc7946).\n" +
  '* For dates and times, the [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format is used with "Zulu" zero offset from UTC unless otherwise specified ' +
  '(i.e., "yyyy-mm-ddThh:mm:ss[.mmm]Z"). E.g. 2019-11-01T06:30:00Z.';

export function digitrafficDescription(
  googleGroupName: string,
  googleGroupId: string,
): string {
  return (
    "[OpenAPI document](/swagger/openapi.json)\n\n" +
    "Digitraffic is a service operated by [Fintraffic](https://www.fintraffic.fi), offering real time traffic information. " +
    "Currently the service covers *road, marine and rail* traffic. More information can be found at the [Digitraffic website](https://www.digitraffic.fi/)\n\n" +
    `The service has a public Google-group [${googleGroupName}](https://groups.google.com/forum/#!forum/${googleGroupId}) for ` +
    "communication between developers, service administrators and Fintraffic. " +
    "The discussion in the forum is mostly in Finnish, but you're welcome to communicate in English too.\n\n" +
    generalNotes
  );
}

export const digitrafficContact = {
  name: "Digitraffic / Fintraffic",
  url: "https://www.digitraffic.fi/",
} as const;

export const digitrafficTermsOfService =
  "https://www.digitraffic.fi/en/terms-of-service/";

export const cc4ByLicense = {
  name: "Creative Commons 4.0 BY",
  url: "https://creativecommons.org/licenses/by/4.0/",
} as const;

export const euplLicense = {
  name: "European Union Public License 1.2",
  url: "https://www.eupl.eu/1.2/en",
} as const;

export const afirTitle = "Digitraffic AFIR API";

export const afirDescription =
  "[OpenAPI document](/swagger/openapi.json)\n\n" +
  "REST/JSON API for alternative fuels infrastructure (AFIR) data.\n\n" +
  "Data is gathered from charging point operators (CPO) and contains information about\n" +
  "electric vehicle charging station locations, statuses, and tariffs.\n" +
  "More information at [Digitraffic](https://www.digitraffic.fi/en/road-traffic/afir/).\n\n" +
  generalNotes;
