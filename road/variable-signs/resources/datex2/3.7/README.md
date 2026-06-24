# Loading Datex II Announcements 3.7 Schema

Go to https://webtool.datex2.eu/wizard/#

1. Source
   * Select: V3.7 DATEX II DATEX II
2. Selection file
   * NONE
3. Profile Selection
    * NONE -> This includes everything in the output
4. Profile Location
   * Location Selection
     * ALL:
       * AreaLocation
       * LinearLocation
       * PointLocation
5. Selection
   * PayloadPublication
      SELECT -> Selecting the top level selects all items under it
     * Note: OpenLrBinary (`olrb`) is an extension for binary location references. And it is not directly dowloadable and needs to be generated from Enterprise Architect UML model.
   * Select target PSM
     * XML Schema
   * Generate schema with definitions
   * Save selection to file selection.sel
6. Download generated schema zip file and unzip to this directory.
7. Manually add `DATEXII_3_OpenLrBinary.xsd` (not available from the wizard — must be generated from the Enterprise Architect UML model).
8. Add `xmlns:olrb="http://datex2.eu/schema/3/openLrBinary"` namespace declaration and `<xs:import namespace="http://datex2.eu/schema/3/openLrBinary" schemaLocation="DATEXII_3_OpenLrBinary.xsd" />` to `DATEXII_3_D2Payload.xsd`.
9. Finish
