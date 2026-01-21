export const TEST_DATEX2_SITUATION_PUBLICATION =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sit:situationPublication lang="fi" modelBaseVersion="3"
	xmlns:com="http://datex2.eu/schema/3/common"
	xmlns:loc="http://datex2.eu/schema/3/locationReferencing"
	xmlns:roa="http://datex2.eu/schema/3/roadTrafficData"
	xmlns:fst="http://datex2.eu/schema/3/faultAndStatus"
	xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure"
	xmlns:prk="http://datex2.eu/schema/3/parking"
	xmlns:fac="http://datex2.eu/schema/3/facilities"
	xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions"
	xmlns:locx="http://datex2.eu/schema/3/locationExtension"
	xmlns:d2="http://datex2.eu/schema/3/d2Payload"
	xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan"
	xmlns:comx="http://datex2.eu/schema/3/commonExtension"
	xmlns:vms="http://datex2.eu/schema/3/vms"
	xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced"
	xmlns:sit="http://datex2.eu/schema/3/situation">
	<com:publicationTime>2025-10-17T08:15:52.992Z</com:publicationTime>
	<com:publicationCreator>
		<com:country>FI</com:country>
		<com:nationalIdentifier>FTA</com:nationalIdentifier>
	</com:publicationCreator>
	<sit:situation id="KRM123456">
		<overallSeverity>high</overallSeverity>
		<situationVersionTime>2024-12-03T16:01:13.526Z</situationVersionTime>
		<headerInformation>
			<confidentiality>noRestriction</confidentiality>
			<informationStatus>real</informationStatus>
		</headerInformation>
		<sit:situationRecord xsi:type="sit:SpeedManagement" id="KRM123456" version="123"
			xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<situationRecordCreationTime>2024-12-03T16:01:13.526Z</situationRecordCreationTime>
			<situationRecordObservationTime>2024-12-03T16:01:13.526Z</situationRecordObservationTime>
			<situationRecordVersionTime>2024-12-03T16:01:13.526Z</situationRecordVersionTime>
			<confidentialityOverride>noRestriction</confidentialityOverride>
			<probabilityOfOccurrence>certain</probabilityOfOccurrence>
			<severity>high</severity>
			<sit:validity>
				<com:validityStatus>active</com:validityStatus>
				<com:validityTimeSpecification>
					<com:overallStartTime>2024-12-03T16:01:13.526Z</com:overallStartTime>
				</com:validityTimeSpecification>
			</sit:validity>
			<locationReference xsi:type="PointLocation">
				<pointByCoordinates>
					<pointCoordinates>
						<latitude>123.0</latitude>
						<longitude>456.0</longitude>
					</pointCoordinates>
				</pointByCoordinates>
			</locationReference>
			<actionOrigin>internal</actionOrigin>
			<complianceOption>mandatory</complianceOption>
			<automaticallyInitiated>true</automaticallyInitiated>
			<speedManagementType>speedRestrictionInOperation</speedManagementType>
		</sit:situationRecord>
	</sit:situation>
</sit:situationPublication>`;

export const TEST_DATEX2_SITUATION =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <d2:payload xsi:type="sit:SituationPublication">
  	<com:publicationTime>2025-10-17T08:15:52.992Z</com:publicationTime>
	<sit:situation id="KRM123456">
		<overallSeverity>high</overallSeverity>
		<situationVersionTime>2024-12-03T16:01:13.526Z</situationVersionTime>
		<headerInformation>
			<confidentiality>noRestriction</confidentiality>
			<informationStatus>real</informationStatus>
		</headerInformation>
		<sit:situationRecord xsi:type="sit:SpeedManagement" id="KRM123456" version="123"
			xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<situationRecordCreationTime>2024-12-03T16:01:13.526Z</situationRecordCreationTime>
			<situationRecordObservationTime>2024-12-03T16:01:13.526Z</situationRecordObservationTime>
			<situationRecordVersionTime>2024-12-03T16:01:13.526Z</situationRecordVersionTime>
			<confidentialityOverride>noRestriction</confidentialityOverride>
			<probabilityOfOccurrence>certain</probabilityOfOccurrence>
			<severity>high</severity>
			<sit:validity>
				<com:validityStatus>active</com:validityStatus>
				<com:validityTimeSpecification>
					<com:overallStartTime>2024-12-03T16:01:13.526Z</com:overallStartTime>
				</com:validityTimeSpecification>
			</sit:validity>
			<locationReference xsi:type="PointLocation">
				<pointByCoordinates>
					<pointCoordinates>
						<latitude>123.0</latitude>
						<longitude>456.0</longitude>
					</pointCoordinates>
				</pointByCoordinates>
			</locationReference>
			<actionOrigin>internal</actionOrigin>
			<complianceOption>mandatory</complianceOption>
			<automaticallyInitiated>true</automaticallyInitiated>
			<speedManagementType>speedRestrictionInOperation</speedManagementType>
		</sit:situationRecord>
	</sit:situation>
</d2:payload>`;

export const TEST_DATEX2_VMSPUBLICATION_1 =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2:payload xsi:type="vms:VmsPublication"
	xmlns:com="http://datex2.eu/schema/3/common"
	xmlns:loc="http://datex2.eu/schema/3/locationReferencing"
	xmlns:roa="http://datex2.eu/schema/3/roadTrafficData"
	xmlns:fst="http://datex2.eu/schema/3/faultAndStatus"
	xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure"
	xmlns:prk="http://datex2.eu/schema/3/parking"
	xmlns:fac="http://datex2.eu/schema/3/facilities"
	xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions"
	xmlns:locx="http://datex2.eu/schema/3/locationExtension"
	xmlns:d2="http://datex2.eu/schema/3/d2Payload"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan"
	xmlns:comx="http://datex2.eu/schema/3/commonExtension"
	xmlns:vms="http://datex2.eu/schema/3/vms"
	xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced"
	xmlns:sit="http://datex2.eu/schema/3/situation">
	<publicationTime>2025-10-20T05:11:10.570Z</publicationTime>
	<publicationCreator>
		<country>FI</country>
		<nationalIdentifier>FTA</nationalIdentifier>
	</publicationCreator>
	<headerInformation>
		<confidentiality>noRestriction</confidentiality>
		<informationStatus>real</informationStatus>
	</headerInformation>
	<vms:vmsControllerStatus>
		<vms:vmsControllerReference id="VME038713"/>
		<vms:statusUpdateTime>2025-10-20T05:11:10.570Z</vms:statusUpdateTime>
		<vms:vmsStatus vmsIndex="0">
			<vmsStatus>
				<statusUpdateTime>2025-10-20T05:10:23.783Z</statusUpdateTime>
				<vmsMessage messageIndex="0">
					<vmsMessage>
						<displayAreaSettings displayAreaIndex="0">
							<displayAreaSettings xsi:type="vms:MultiPageDisplay"/></displayAreaSettings>
					</vmsMessage>
				</vmsMessage>
				<vmsLocationOverride xsi:type="PointLocation">
					<coordinatesForDisplay>
						<latitude>6719449.0</latitude>
						<longitude>542373.0</longitude>
					</coordinatesForDisplay>
				</vmsLocationOverride>
			</vmsStatus>
		</vms:vmsStatus>
	</vms:vmsControllerStatus>
</d2:payload>
`;

export const TEST_DATEX2_VMS_TABLE_PUBLICATION =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<d2:payload xsi:type="vms:VmsTablePublication"
	xmlns:com="http://datex2.eu/schema/3/common"
	xmlns:loc="http://datex2.eu/schema/3/locationReferencing"
	xmlns:roa="http://datex2.eu/schema/3/roadTrafficData"
	xmlns:fst="http://datex2.eu/schema/3/faultAndStatus"
	xmlns:egi="http://datex2.eu/schema/3/energyInfrastructure"
	xmlns:prk="http://datex2.eu/schema/3/parking"
	xmlns:fac="http://datex2.eu/schema/3/facilities"
	xmlns:ubx="http://datex2.eu/schema/3/urbanExtensions"
	xmlns:locx="http://datex2.eu/schema/3/locationExtension"
	xmlns:d2="http://datex2.eu/schema/3/d2Payload"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:tmp="http://datex2.eu/schema/3/trafficManagementPlan"
	xmlns:comx="http://datex2.eu/schema/3/commonExtension"
	xmlns:vms="http://datex2.eu/schema/3/vms"
	xmlns:rer="http://datex2.eu/schema/3/reroutingManagementEnhanced"
	xmlns:sit="http://datex2.eu/schema/3/situation">
	<publicationTime>2025-10-20T02:12:19.331Z</publicationTime>
	<publicationCreator>
		<country>FI</country>
		<nationalIdentifier>FTA</nationalIdentifier>
	</publicationCreator>
	<headerInformation>
		<confidentiality>noRestriction</confidentiality>
		<informationStatus>real</informationStatus>
	</headerInformation>
	<vmsControllerTable>
		<vmsController id="VME015511">
			<vms vmsIndex="0">
				<vms>
					<description>
						<values>
							<com:value lang="fi">Varoitusmerkki. Yhteismerkki KRM015512-merkin kanssa. Kts. Merkin IP-osoitteet VME015511/KRM015512-hallinta, VME015511/KRM015512-kontrolleri ja VME015511/KRM015512-s laitteilta.</com:value>
						</values>
					</description>
					<vmsType>other</vmsType>
					<vmsLocation xsi:type="PointLocation">
						<coordinatesForDisplay>
							<latitude>6683809.0</latitude>
							<longitude>406975.0</longitude>
						</coordinatesForDisplay>
					</vmsLocation>
				</vms>
			</vms>
		</vmsController>
	</vmsControllerTable>
</d2:payload>`;
