export const TEST_DATEX2_37_SITUATION_PUBLICATION_1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sit:situationPublication xmlns:com="http://datex2.eu/schema/3/common" xmlns:loc="http://datex2.eu/schema/3/locationReferencing" xmlns:roa="http://datex2.eu/schema/3/roadTrafficData" xmlns:fst="http://datex2.eu/schema/3/faultAndStatus" xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure" xmlns:prk="http://datex2.eu/schema/3/parking" xmlns:fac="http://datex2.eu/schema/3/facilities" xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions" xmlns:locx="http://datex2.eu/schema/3/locationExtension" xmlns:afac="http://datex2.eu/schema/3/afirFacilities" xmlns:aegi="http://datex2.eu/schema/3/afirEnergyInfrastructure" xmlns:d2="http://datex2.eu/schema/3/d2Payload" xmlns:tro="http://datex2.eu/schema/3/trafficRegulation" xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan" xmlns:cz="http://datex2.eu/schema/3/controlledZone" xmlns:olrb="http://datex2.eu/schema/3/openLrBinary" xmlns:comx="http://datex2.eu/schema/3/commonExtension" xmlns:vms="http://datex2.eu/schema/3/vms" xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced" xmlns:sit="http://datex2.eu/schema/3/situation" lang="fi" modelBaseVersion="3">
  <com:publicationTime>2026-06-13T16:11:26.316Z</com:publicationTime>
  <com:publicationCreator>
    <com:country>FI</com:country>
    <com:nationalIdentifier>Fintraffic Road</com:nationalIdentifier>
  </com:publicationCreator>
  <sit:situation id="KRM038851">
    <sit:overallSeverity>high</sit:overallSeverity>
    <sit:situationVersionTime>2026-06-13T16:10:30.299Z</sit:situationVersionTime>
    <sit:headerInformation>
      <com:confidentiality>noRestriction</com:confidentiality>
      <com:informationStatus>real</com:informationStatus>
    </sit:headerInformation>
    <sit:situationRecord xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="sit:SpeedManagement" id="KRM038851" version="1781367030299">
      <sit:situationRecordCreationTime>2026-06-13T16:10:30.299Z</sit:situationRecordCreationTime>
      <sit:situationRecordObservationTime>2026-06-13T16:10:30.299Z</sit:situationRecordObservationTime>
      <sit:situationRecordVersionTime>2026-06-13T16:10:30.299Z</sit:situationRecordVersionTime>
      <sit:confidentialityOverride>noRestriction</sit:confidentialityOverride>
      <sit:probabilityOfOccurrence>certain</sit:probabilityOfOccurrence>
      <sit:severity>high</sit:severity>
      <sit:validity>
        <com:validityStatus>active</com:validityStatus>
        <com:validityTimeSpecification>
          <com:overallStartTime>2026-06-13T16:10:30.299Z</com:overallStartTime>
        </com:validityTimeSpecification>
      </sit:validity>
      <sit:locationReference xsi:type="loc:PointLocation">
        <loc:pointByCoordinates>
          <loc:pointCoordinates>
            <loc:latitude>6719914.0</loc:latitude>
            <loc:longitude>544004.0</loc:longitude>
          </loc:pointCoordinates>
        </loc:pointByCoordinates>
      </sit:locationReference>
      <sit:actionOrigin>internal</sit:actionOrigin>
      <sit:complianceOption>mandatory</sit:complianceOption>
      <sit:automaticallyInitiated>true</sit:automaticallyInitiated>
      <sit:speedManagementType>speedRestrictionInOperation</sit:speedManagementType>
      <sit:temporarySpeedLimit>100.0</sit:temporarySpeedLimit>
    </sit:situationRecord>
  </sit:situation>
</sit:situationPublication>`;

export const TEST_DATEX2_37_VMS_PUBLICATION_1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2:payload xmlns:com="http://datex2.eu/schema/3/common" xmlns:loc="http://datex2.eu/schema/3/locationReferencing" xmlns:roa="http://datex2.eu/schema/3/roadTrafficData" xmlns:fst="http://datex2.eu/schema/3/faultAndStatus" xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure" xmlns:prk="http://datex2.eu/schema/3/parking" xmlns:fac="http://datex2.eu/schema/3/facilities" xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions" xmlns:locx="http://datex2.eu/schema/3/locationExtension" xmlns:afac="http://datex2.eu/schema/3/afirFacilities" xmlns:aegi="http://datex2.eu/schema/3/afirEnergyInfrastructure" xmlns:d2="http://datex2.eu/schema/3/d2Payload" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tro="http://datex2.eu/schema/3/trafficRegulation" xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan" xmlns:cz="http://datex2.eu/schema/3/controlledZone" xmlns:olrb="http://datex2.eu/schema/3/openLrBinary" xmlns:comx="http://datex2.eu/schema/3/commonExtension" xmlns:vms="http://datex2.eu/schema/3/vms" xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced" xmlns:sit="http://datex2.eu/schema/3/situation" xsi:type="vms:VmsPublication">
  <com:publicationTime>2026-06-15T00:11:43.886Z</com:publicationTime>
  <com:publicationCreator>
    <com:country>FI</com:country>
    <com:nationalIdentifier>Fintraffic Road</com:nationalIdentifier>
  </com:publicationCreator>
  <vms:headerInformation>
    <com:confidentiality>noRestriction</com:confidentiality>
    <com:informationStatus>real</com:informationStatus>
  </vms:headerInformation>
  <vms:vmsControllerStatus>
    <vms:vmsControllerReference id="VME01M304"/>
    <vms:statusUpdateTime>2026-06-15T00:11:43.886Z</vms:statusUpdateTime>
    <vms:vmsStatus vmsIndex="0">
      <vms:vmsStatus>
        <vms:statusUpdateTime>2026-06-15T00:10:39.053Z</vms:statusUpdateTime>
        <vms:vmsMessage messageIndex="0">
          <vms:vmsMessage>
            <vms:displayAreaSettings displayAreaIndex="0">
              <vms:displayAreaSettings xsi:type="vms:MultiPageDisplay"/>
            </vms:displayAreaSettings>
          </vms:vmsMessage>
        </vms:vmsMessage>
      </vms:vmsStatus>
    </vms:vmsStatus>
  </vms:vmsControllerStatus>
</d2:payload>`;

export const TEST_DATEX2_37_VMS_TABLE_PUBLICATION_1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2:payload xmlns:com="http://datex2.eu/schema/3/common" xmlns:loc="http://datex2.eu/schema/3/locationReferencing" xmlns:roa="http://datex2.eu/schema/3/roadTrafficData" xmlns:fst="http://datex2.eu/schema/3/faultAndStatus" xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure" xmlns:prk="http://datex2.eu/schema/3/parking" xmlns:fac="http://datex2.eu/schema/3/facilities" xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions" xmlns:locx="http://datex2.eu/schema/3/locationExtension" xmlns:afac="http://datex2.eu/schema/3/afirFacilities" xmlns:aegi="http://datex2.eu/schema/3/afirEnergyInfrastructure" xmlns:d2="http://datex2.eu/schema/3/d2Payload" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tro="http://datex2.eu/schema/3/trafficRegulation" xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan" xmlns:cz="http://datex2.eu/schema/3/controlledZone" xmlns:olrb="http://datex2.eu/schema/3/openLrBinary" xmlns:comx="http://datex2.eu/schema/3/commonExtension" xmlns:vms="http://datex2.eu/schema/3/vms" xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced" xmlns:sit="http://datex2.eu/schema/3/situation" xsi:type="vms:VmsTablePublication">
  <com:publicationTime>2026-06-12T02:11:53.795Z</com:publicationTime>
  <com:publicationCreator>
    <com:country>FI</com:country>
    <com:nationalIdentifier>Fintraffic Road</com:nationalIdentifier>
  </com:publicationCreator>
  <vms:headerInformation>
    <com:confidentiality>noRestriction</com:confidentiality>
    <com:informationStatus>real</com:informationStatus>
  </vms:headerInformation>
  <vms:vmsControllerTable>
    <vms:vmsController id="VME015511">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6683809.0</loc:latitude>
              <loc:longitude>406975.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME015651">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6684359.0</loc:latitude>
              <loc:longitude>407918.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME015951">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6689897.0</loc:latitude>
              <loc:longitude>417152.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME016251">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6698608.0</loc:latitude>
              <loc:longitude>427887.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01K001">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6672259.0</loc:latitude>
              <loc:longitude>379389.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01K201">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6672188.0</loc:latitude>
              <loc:longitude>379256.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01K501">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6673062.0</loc:latitude>
              <loc:longitude>379488.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01K601">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6673679.0</loc:latitude>
              <loc:longitude>378867.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01K603">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6673240.0</loc:latitude>
              <loc:longitude>379427.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01M102">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677682.0</loc:latitude>
              <loc:longitude>379030.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01M201">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677683.0</loc:latitude>
              <loc:longitude>379017.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01M304">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6678631.0</loc:latitude>
              <loc:longitude>379494.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01M305">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6678831.0</loc:latitude>
              <loc:longitude>379686.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7020660.0</loc:latitude>
              <loc:longitude>221495.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME021312">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6704221.0</loc:latitude>
              <loc:longitude>287207.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME021572">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6704122.0</loc:latitude>
              <loc:longitude>288855.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME02">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7020424.0</loc:latitude>
              <loc:longitude>223243.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030625">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6767972.0</loc:latitude>
              <loc:longitude>564058.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030628">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6769845.0</loc:latitude>
              <loc:longitude>568448.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030631">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6772542.0</loc:latitude>
              <loc:longitude>572145.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030634">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6769286.0</loc:latitude>
              <loc:longitude>567517.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030637">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6767996.0</loc:latitude>
              <loc:longitude>562905.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME038611">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6717628.0</loc:latitude>
              <loc:longitude>533843.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME038713">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719449.0</loc:latitude>
              <loc:longitude>542373.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME038851">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719914.0</loc:latitude>
              <loc:longitude>544004.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME041202">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6822034.0</loc:latitude>
              <loc:longitude>335888.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME041210">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6817748.0</loc:latitude>
              <loc:longitude>343415.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME044051">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6818573.0</loc:latitude>
              <loc:longitude>328063.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME044311">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6818416.0</loc:latitude>
              <loc:longitude>324186.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME08051202">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6975936.0</loc:latitude>
              <loc:longitude>534861.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME08051208">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6979229.0</loc:latitude>
              <loc:longitude>533892.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME08051212">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6981700.0</loc:latitude>
              <loc:longitude>535300.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME08053206">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6977941.0</loc:latitude>
              <loc:longitude>534222.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME08053210">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6980534.0</loc:latitude>
              <loc:longitude>534530.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME08053214">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6981997.0</loc:latitude>
              <loc:longitude>535485.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME121031">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212422.0</loc:latitude>
              <loc:longitude>429608.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME121032">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212196.0</loc:latitude>
              <loc:longitude>429711.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME121071">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212184.0</loc:latitude>
              <loc:longitude>429613.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME121072">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212367.0</loc:latitude>
              <loc:longitude>429579.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014011">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677719.0</loc:latitude>
              <loc:longitude>370451.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014051">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677526.0</loc:latitude>
              <loc:longitude>370711.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014211">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676073.0</loc:latitude>
              <loc:longitude>374436.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014411">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676454.0</loc:latitude>
              <loc:longitude>376563.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014421">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676454.0</loc:latitude>
              <loc:longitude>376563.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014451">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676585.0</loc:latitude>
              <loc:longitude>377833.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014461">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676585.0</loc:latitude>
              <loc:longitude>377833.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014511">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676661.0</loc:latitude>
              <loc:longitude>378709.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014512">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676544.0</loc:latitude>
              <loc:longitude>377334.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014522">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676544.0</loc:latitude>
              <loc:longitude>377334.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014611">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676733.0</loc:latitude>
              <loc:longitude>379158.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/VLK014651">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676374.0</loc:latitude>
              <loc:longitude>380298.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO01K005">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6673378.0</loc:latitude>
              <loc:longitude>379871.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO01K103">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6672638.0</loc:latitude>
              <loc:longitude>379429.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO01K603">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6673144.0</loc:latitude>
              <loc:longitude>379494.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO01M301">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677906.0</loc:latitude>
              <loc:longitude>378749.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO021342">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6704255.0</loc:latitude>
              <loc:longitude>287889.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO021572">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6704122.0</loc:latitude>
              <loc:longitude>288855.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO021581">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6704206.0</loc:latitude>
              <loc:longitude>288448.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO10232349">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677823.0</loc:latitude>
              <loc:longitude>375348.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="TIO1023900">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676733.0</loc:latitude>
              <loc:longitude>375029.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01M103/TIO01M102">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677973.0</loc:latitude>
              <loc:longitude>379064.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME01M104/TIO01M103">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6678161.0</loc:latitude>
              <loc:longitude>379159.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030622/TIO030620">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6766408.0</loc:latitude>
              <loc:longitude>557273.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030623/TIO030622">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6767356.0</loc:latitude>
              <loc:longitude>560759.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030626/TIO030623">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6768641.0</loc:latitude>
              <loc:longitude>566258.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030629/TIO030624">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6772205.0</loc:latitude>
              <loc:longitude>571722.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030632/TIO030626">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6770014.0</loc:latitude>
              <loc:longitude>568696.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030635/TIO030627">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6768096.0</loc:latitude>
              <loc:longitude>564507.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME030638/TIO030628">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6766973.0</loc:latitude>
              <loc:longitude>558942.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO010301">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6694714.0</loc:latitude>
              <loc:longitude>379287.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO010302">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6689784.0</loc:latitude>
              <loc:longitude>379871.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO010303">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6689836.0</loc:latitude>
              <loc:longitude>379886.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO010304">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6684551.0</loc:latitude>
              <loc:longitude>382076.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO011111">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6758471.0</loc:latitude>
              <loc:longitude>422602.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO011341">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6758487.0</loc:latitude>
              <loc:longitude>425762.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO011441">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6758620.0</loc:latitude>
              <loc:longitude>427666.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO011481">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6758583.0</loc:latitude>
              <loc:longitude>426470.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO011581">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6758696.0</loc:latitude>
              <loc:longitude>428766.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO011781">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6759479.0</loc:latitude>
              <loc:longitude>429988.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO012701">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6682095.0</loc:latitude>
              <loc:longitude>363188.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO012751">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6685101.0</loc:latitude>
              <loc:longitude>358944.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO012801">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6679638.0</loc:latitude>
              <loc:longitude>366403.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO012851">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6681434.0</loc:latitude>
              <loc:longitude>364419.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO012951">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6678747.0</loc:latitude>
              <loc:longitude>368044.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015141">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6671126.0</loc:latitude>
              <loc:longitude>371591.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015142">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6671758.0</loc:latitude>
              <loc:longitude>374416.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015152">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6672255.0</loc:latitude>
              <loc:longitude>377811.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015181">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6672273.0</loc:latitude>
              <loc:longitude>376907.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015301">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6682033.0</loc:latitude>
              <loc:longitude>397787.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015401">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6682019.0</loc:latitude>
              <loc:longitude>397622.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015501">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6683320.0</loc:latitude>
              <loc:longitude>403027.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015611">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6684742.0</loc:latitude>
              <loc:longitude>408306.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015701">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6687528.0</loc:latitude>
              <loc:longitude>412154.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015811">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6689860.0</loc:latitude>
              <loc:longitude>417147.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO015901">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6689804.0</loc:latitude>
              <loc:longitude>416999.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO016011">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6697206.0</loc:latitude>
              <loc:longitude>424614.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO016051">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6694697.0</loc:latitude>
              <loc:longitude>422754.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO016151">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6698400.0</loc:latitude>
              <loc:longitude>425780.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO01K102">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6672517.0</loc:latitude>
              <loc:longitude>379390.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO01K600">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6673724.0</loc:latitude>
              <loc:longitude>378828.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO01K602">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6673285.0</loc:latitude>
              <loc:longitude>379378.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO01M302">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6678194.0</loc:latitude>
              <loc:longitude>379150.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO01M303">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6678485.0</loc:latitude>
              <loc:longitude>379442.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO01">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7020644.0</loc:latitude>
              <loc:longitude>221619.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO020511">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6707384.0</loc:latitude>
              <loc:longitude>244865.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO020581">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6707836.0</loc:latitude>
              <loc:longitude>243302.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO020611">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6707448.0</loc:latitude>
              <loc:longitude>246977.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO020751">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6707500.0</loc:latitude>
              <loc:longitude>248282.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO020811">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6709554.0</loc:latitude>
              <loc:longitude>253490.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO020911">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6707489.0</loc:latitude>
              <loc:longitude>260726.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO020981">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6709262.0</loc:latitude>
              <loc:longitude>255304.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021111">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6706384.0</loc:latitude>
              <loc:longitude>265819.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021112">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6706472.0</loc:latitude>
              <loc:longitude>275244.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021151">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6706506.0</loc:latitude>
              <loc:longitude>263682.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021212">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6706075.0</loc:latitude>
              <loc:longitude>279884.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021251">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6706425.0</loc:latitude>
              <loc:longitude>274848.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021311">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6705048.0</loc:latitude>
              <loc:longitude>283444.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021351">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6705671.0</loc:latitude>
              <loc:longitude>281496.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021511">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6703595.0</loc:latitude>
              <loc:longitude>289819.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021551">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6704083.0</loc:latitude>
              <loc:longitude>288924.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021651">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6700490.0</loc:latitude>
              <loc:longitude>295692.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO021653">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6703333.0</loc:latitude>
              <loc:longitude>290440.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO02">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7020455.0</loc:latitude>
              <loc:longitude>223130.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038411">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6714609.0</loc:latitude>
              <loc:longitude>517567.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038511">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6714922.0</loc:latitude>
              <loc:longitude>521684.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038551">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6714549.0</loc:latitude>
              <loc:longitude>519971.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038641">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719409.0</loc:latitude>
              <loc:longitude>536700.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038651">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6717491.0</loc:latitude>
              <loc:longitude>532280.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038711">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719767.0</loc:latitude>
              <loc:longitude>542929.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038751">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719317.0</loc:latitude>
              <loc:longitude>537590.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038811">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719329.0</loc:latitude>
              <loc:longitude>545027.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038852">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719963.0</loc:latitude>
              <loc:longitude>543604.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038871">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719938.0</loc:latitude>
              <loc:longitude>545027.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038951">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6718671.0</loc:latitude>
              <loc:longitude>545690.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038952">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6718413.0</loc:latitude>
              <loc:longitude>545369.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO038953">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6719099.0</loc:latitude>
              <loc:longitude>545206.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VMETIO08051202">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6977343.0</loc:latitude>
              <loc:longitude>534326.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VMETIO08051203">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6983618.0</loc:latitude>
              <loc:longitude>535793.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VMETIO08053201">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6976726.0</loc:latitude>
              <loc:longitude>534408.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VMETIO08053204">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6983936.0</loc:latitude>
              <loc:longitude>535815.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VMETIO08093201">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6983619.0</loc:latitude>
              <loc:longitude>536426.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120102">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7188361.0</loc:latitude>
              <loc:longitude>427719.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120201">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7188057.0</loc:latitude>
              <loc:longitude>428639.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120211">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7191762.0</loc:latitude>
              <loc:longitude>429122.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120311">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7197689.0</loc:latitude>
              <loc:longitude>430199.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120451">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7199803.0</loc:latitude>
              <loc:longitude>430698.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120452">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7196295.0</loc:latitude>
              <loc:longitude>429925.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120511">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7203672.0</loc:latitude>
              <loc:longitude>430559.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120611">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7205965.0</loc:latitude>
              <loc:longitude>429797.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120741">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7208743.0</loc:latitude>
              <loc:longitude>429541.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120751">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7206983.0</loc:latitude>
              <loc:longitude>429607.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO120941">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7211483.0</loc:latitude>
              <loc:longitude>429728.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121081">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7211499.0</loc:latitude>
              <loc:longitude>429694.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121111">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7214440.0</loc:latitude>
              <loc:longitude>427724.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121181">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212932.0</loc:latitude>
              <loc:longitude>429021.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121211">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7216798.0</loc:latitude>
              <loc:longitude>426726.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121251">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7214623.0</loc:latitude>
              <loc:longitude>427563.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121311">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7219924.0</loc:latitude>
              <loc:longitude>426474.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121351">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7216878.0</loc:latitude>
              <loc:longitude>426678.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121411">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7225965.0</loc:latitude>
              <loc:longitude>426482.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121451">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7219600.0</loc:latitude>
              <loc:longitude>426494.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121511">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7228794.0</loc:latitude>
              <loc:longitude>426258.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121551">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7222438.0</loc:latitude>
              <loc:longitude>426249.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121651">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7228877.0</loc:latitude>
              <loc:longitude>426216.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121751">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7239517.0</loc:latitude>
              <loc:longitude>423576.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO121752">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7233156.0</loc:latitude>
              <loc:longitude>425400.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122001">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212399.0</loc:latitude>
              <loc:longitude>430286.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122002">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7213095.0</loc:latitude>
              <loc:longitude>431341.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122003">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7215608.0</loc:latitude>
              <loc:longitude>434944.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122004">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7215669.0</loc:latitude>
              <loc:longitude>434985.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122005">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7223519.0</loc:latitude>
              <loc:longitude>443334.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122010">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212242.0</loc:latitude>
              <loc:longitude>429350.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122011">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7212502.0</loc:latitude>
              <loc:longitude>430474.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122210">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7209313.0</loc:latitude>
              <loc:longitude>430145.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122212">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7207722.0</loc:latitude>
              <loc:longitude>431413.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122213">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7206546.0</loc:latitude>
              <loc:longitude>433297.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122214">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7203591.0</loc:latitude>
              <loc:longitude>437354.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122215">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7209926.0</loc:latitude>
              <loc:longitude>428865.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122217">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7208973.0</loc:latitude>
              <loc:longitude>430354.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO122218">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7207739.0</loc:latitude>
              <loc:longitude>431364.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO/VLK014141">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6677248.0</loc:latitude>
              <loc:longitude>371222.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO/VLK014181">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6675945.0</loc:latitude>
              <loc:longitude>374138.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO/VLK014381">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676473.0</loc:latitude>
              <loc:longitude>377200.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO/VLK014541">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676630.0</loc:latitude>
              <loc:longitude>377828.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VME/TIO/VLK014741">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>6676218.0</loc:latitude>
              <loc:longitude>380735.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VMETIO-VT21-01">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7536723.0</loc:latitude>
              <loc:longitude>358673.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
    <vms:vmsController id="VMETIO-VT21-02">
      <vms:vms vmsIndex="0">
        <vms:vms>
          <vms:vmsType>other</vms:vmsType>
          <vms:vmsLocation xsi:type="loc:PointLocation">
            <loc:coordinatesForDisplay>
              <loc:latitude>7667843.0</loc:latitude>
              <loc:longitude>256052.0</loc:longitude>
            </loc:coordinatesForDisplay>
          </vms:vmsLocation>
        </vms:vms>
      </vms:vms>
    </vms:vmsController>
  </vms:vmsControllerTable>
</d2:payload>`;
