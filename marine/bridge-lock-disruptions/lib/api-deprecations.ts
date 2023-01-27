export class ApiDeprecations {
    /**
     * To return Deprecation and Sunset headers, pass sunset date in format YYYY-MM-DD
     * to the deprecated DigitrafficIntegration.
     *
     * Also set deprecation=true for relevant DigitrafficMethodResponses.
     *
     * For example:
     * new DigitrafficIntegration(
     *             getDisruptionsLambda,
     *             MediaType.APPLICATION_JSON,
     *             SUNSET_2023_06_01
     *         ).build()
     *
     * DigitrafficMethodResponse.response(
     *            "200",
     *            disruptionsJsonModel,
     *            MediaType.APPLICATION_JSON,
     *            false,
     *            true
     *            )
     */
    static SUNSET_DATE_2023_06_01 = "2023-06-01";

    /**
     * Add a note in the following format to the documentation of the deprecated method.
     *
     * DocumentationPart.method(
     *            ["bridge-lock-disruptions"],
     *            "getDisruptions",
     *            "Return all waterway traffic disruptions"
     *         ).deprecated(API_SUNSET_NOTE_2023_06_01)
     */
    static SUNSET_NOTE = "Will be removed after ";
    static SUNSET_NOTE_2023_06_01 =
        this.SUNSET_NOTE + this.SUNSET_DATE_2023_06_01;
}
