export const TEST_DATEX2 =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><d2LogicalModel modelBaseVersion="2" xsi:schemaLocation="http://datex2.eu/schema/2/2_0 https://raw.githubusercontent.com/tmfg/metadata/master/schema/DATEXIISchema_2_2_3_with_definitions_FI.xsd" xmlns="http://datex2.eu/schema/2/2_0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<exchange>
   <supplierIdentification>
      <country>fi</country>
      <nationalIdentifier>FTA</nationalIdentifier>
      </supplierIdentification>
   </exchange>
   <payloadPublication xsi:type="SituationPublication" lang="fi">
      <publicationTime>2021-04-13T05:13:39.182Z</publicationTime>
      <publicationCreator>
         <country>fi</country>
         <nationalIdentifier>FTA</nationalIdentifier>
      </publicationCreator>
      <situation id="KRM043951" version="1618301599607">
         <overallSeverity>high</overallSeverity>
         <situationVersionTime>2021-04-13T05:13:19.627Z</situationVersionTime>
         <headerInformation>
            <areaOfInterest>regional</areaOfInterest>
            <confidentiality>noRestriction</confidentiality>
            <informationStatus>real</informationStatus>
         </headerInformation>
         <situationRecord xsi:type="SpeedManagement" id="KRM043951" version="1618301599607">
            <situationRecordCreationTime>2021-04-13T05:13:19.627Z</situationRecordCreationTime>
            <situationRecordObservationTime>2021-04-13T05:13:19.627Z</situationRecordObservationTime>
            <situationRecordVersionTime>2021-04-13T05:13:19.627Z</situationRecordVersionTime>
            <confidentialityOverride>noRestriction</confidentialityOverride>
            <probabilityOfOccurrence>certain</probabilityOfOccurrence>
            <severity>high</severity>
            <validity>
                <validityStatus>active</validityStatus>
                <validityTimeSpecification>
                   <overallStartTime>2021-04-13T05:13:19.627Z</overallStartTime>
               </validityTimeSpecification>
           </validity>
           <groupOfLocations xsi:type="Point">
              <pointByCoordinates>
                 <pointCoordinates>
                    <latitude>326986.03</latitude>
                    <longitude>6818407.0</longitude>
                 </pointCoordinates>
              </pointByCoordinates>
           </groupOfLocations>
           <actionOrigin>internal</actionOrigin>
           <complianceOption>mandatory</complianceOption>
           <automaticallyInitiated>true</automaticallyInitiated>
           <speedManagementType>speedRestrictionInOperation</speedManagementType>
           <temporarySpeedLimit>100.0</temporarySpeedLimit>
         </situationRecord>
      </situation>
      <situation id="KRM044051" version="1618301601916">
         <overallSeverity>high</overallSeverity>?
         <headerInformation>
            <areaOfInterest>regional</areaOfInterest>
            <confidentiality>noRestriction</confidentiality>
            <informationStatus>real</informationStatus>
         </headerInformation>
         <situationRecord xsi:type="SpeedManagement" id="KRM044051" version="1618301601916">
            <situationRecordCreationTime>2021-04-13T05:13:21.932Z</situationRecordCreationTime>
            <situationRecordObservationTime>2021-04-13T05:13:21.932Z</situationRecordObservationTime>
            <situationRecordVersionTime>2021-04-13T05:13:21.932Z</situationRecordVersionTime>
            <confidentialityOverride>noRestriction</confidentialityOverride>
            <probabilityOfOccurrence>certain</probabilityOfOccurrence>
            <severity>high</severity>
            <validity>
               <validityStatus>active</validityStatus>
               <validityTimeSpecification>
                  <overallStartTime>2021-04-13T05:13:21.932Z</overallStartTime>
               </validityTimeSpecification>
            </validity>
            <groupOfLocations xsi:type="Point">
               <pointByCoordinates>
                  <pointCoordinates>
                     <latitude>328063.0</latitude>
                     <longitude>6818573.0</longitude>
                  </pointCoordinates>
               </pointByCoordinates>
            </groupOfLocations>
            <actionOrigin>internal</actionOrigin>
            <complianceOption>mandatory</complianceOption>
            <automaticallyInitiated>true</automaticallyInitiated>
            <speedManagementType>speedRestrictionInOperation</speedManagementType>
            <temporarySpeedLimit>100.0</temporarySpeedLimit>
         </situationRecord>
      </situation>
   </payloadPublication>
</d2LogicalModel>`;

export const TEST_DATEX2_2 =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><d2LogicalModel modelBaseVersion="2" xsi:schemaLocation="http://datex2.eu/schema/2/2_0 https://raw.githubusercontent.com/tmfg/metadata/master/schema/DATEXIISchema_2_2_3_with_definitions_FI.xsd" xmlns="http://datex2.eu/schema/2/2_0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<d2LogicalModel xmlns="http://datex2.eu/schema/2/2_0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" modelBaseVersion="2" xsi:schemaLocation="http://datex2.eu/schema/2/2_0 https://raw.githubusercontent.com/tmfg/metadata/master/schema/DATEXIISchema_2_2_3_with_definitions_FI.xsd">
    <exchange>
        <supplierIdentification>
            <country>fi</country>
            <nationalIdentifier>FTA</nationalIdentifier>
        </supplierIdentification>
    </exchange>
    <payloadPublication xsi:type="SituationPublication" lang="fi">
        <publicationTime>2021-04-11T01:17:26.586Z</publicationTime>
        <publicationCreator>
            <country>fi</country>
            <nationalIdentifier>FTA</nationalIdentifier>
        </publicationCreator>
        <situation id="KRM01" version="1618103837947">
            <overallSeverity>high</overallSeverity>
            <situationVersionTime>2021-04-11T01:17:18.080Z</situationVersionTime>
            <headerInformation>
                <areaOfInterest>regional</areaOfInterest>
                <confidentiality>noRestriction</confidentiality>
                <informationStatus>real</informationStatus>
            </headerInformation>
            <situationRecord xsi:type="SpeedManagement" id="KRM01" version="1618103837947">
                <situationRecordCreationTime>2021-04-11T01:17:18.080Z</situationRecordCreationTime>
                <situationRecordObservationTime>2021-04-11T01:17:18.080Z</situationRecordObservationTime>
                <situationRecordVersionTime>2021-04-11T01:17:18.080Z</situationRecordVersionTime>
                <confidentialityOverride>noRestriction</confidentialityOverride>
                <probabilityOfOccurrence>certain</probabilityOfOccurrence>
                <severity>high</severity>
                <validity>
                    <validityStatus>active</validityStatus>
                    <validityTimeSpecification>
                        <overallStartTime>2021-04-11T01:17:18.080Z</overallStartTime>
                    </validityTimeSpecification>
                </validity>
                <groupOfLocations xsi:type="Point">
                    <pointByCoordinates>
                        <pointCoordinates>
                            <latitude>221495.0</latitude>
                            <longitude>7020660.0</longitude>
                        </pointCoordinates>
                    </pointByCoordinates>
                </groupOfLocations>
                <actionOrigin>internal</actionOrigin>
                <complianceOption>mandatory</complianceOption>
                <automaticallyInitiated>true</automaticallyInitiated>
                <speedManagementType>speedRestrictionInOperation</speedManagementType>
                <temporarySpeedLimit>80.0</temporarySpeedLimit>
            </situationRecord>
        </situation>
        <situation id="KRM02" version="1618103837947">
            <overallSeverity>high</overallSeverity>
            <situationVersionTime>2021-04-11T01:17:18.124Z</situationVersionTime>
            <headerInformation>
                <areaOfInterest>regional</areaOfInterest>
                <confidentiality>noRestriction</confidentiality>
                <informationStatus>real</informationStatus>
            </headerInformation>
            <situationRecord xsi:type="SpeedManagement" id="KRM02" version="1618103837947">
                <situationRecordCreationTime>2021-04-11T01:17:18.124Z</situationRecordCreationTime>
                <situationRecordObservationTime>2021-04-11T01:17:18.124Z</situationRecordObservationTime>
                <situationRecordVersionTime>2021-04-11T01:17:18.124Z</situationRecordVersionTime>
                <confidentialityOverride>noRestriction</confidentialityOverride>
                <probabilityOfOccurrence>certain</probabilityOfOccurrence>
                <severity>high</severity>
                <validity>
                    <validityStatus>active</validityStatus>
                    <validityTimeSpecification>
                        <overallStartTime>2021-04-11T01:17:18.124Z</overallStartTime>
                    </validityTimeSpecification>
                </validity>
                <groupOfLocations xsi:type="Point">
                    <pointByCoordinates>
                        <pointCoordinates>
                            <latitude>223243.0</latitude>
                            <longitude>7020424.0</longitude>
                        </pointCoordinates>
                    </pointByCoordinates>
                </groupOfLocations>
                <actionOrigin>internal</actionOrigin>
                <complianceOption>mandatory</complianceOption>
                <automaticallyInitiated>true</automaticallyInitiated>
                <speedManagementType>speedRestrictionInOperation</speedManagementType>
                <temporarySpeedLimit>80.0</temporarySpeedLimit>
            </situationRecord>
        </situation>
    </payloadPublication>
</d2LogicalModel>`;
