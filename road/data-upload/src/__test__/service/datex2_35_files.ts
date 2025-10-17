export const TEST_DATEX2 = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns3:situationPublication lang="fi" modelBaseVersion="3"
	xmlns="http://datex2.eu/schema/3/common"
	xmlns:ns2="http://datex2.eu/schema/3/roadTrafficData"
	xmlns:ns4="http://datex2.eu/schema/3/urbanExtensions"
	xmlns:ns3="http://datex2.eu/schema/3/situation"
	xmlns:ns6="http://datex2.eu/schema/3/facilities"
	xmlns:ns5="http://datex2.eu/schema/3/commonExtension"
	xmlns:ns8="http://datex2.eu/schema/3/locationExtension"
	xmlns:ns7="http://datex2.eu/schema/3/parking"
	xmlns:ns13="http://datex2.eu/schema/3/vms"
	xmlns:ns9="http://datex2.eu/schema/3/locationReferencing"
	xmlns:ns12="http://datex2.eu/schema/3/reroutingManagementEnhanced"
	xmlns:ns11="http://datex2.eu/schema/3/trafficManagementPlan"
	xmlns:ns10="http://datex2.eu/schema/3/faultAndStatus"
	xmlns:ns15="http://datex2.eu/schema/3/d2Payload"
	xmlns:ns14="http://datex2.eu/schema/3/energyInfrastructure">
	<publicationTime>2025-09-22T09:29:34.995Z</publicationTime>
	<publicationCreator>
		<country>FI</country>
		<nationalIdentifier>FTA</nationalIdentifier>
	</publicationCreator>
	<ns3:situation id="KRM021323">
		<ns3:overallSeverity>high</ns3:overallSeverity>
		<ns3:situationVersionTime>2025-09-18T22:09:51.165Z</ns3:situationVersionTime>
		<ns3:headerInformation>
			<confidentiality>noRestriction</confidentiality>
			<informationStatus>real</informationStatus>
		</ns3:headerInformation>
		<ns3:situationRecord xsi:type="ns3:SpeedManagement" id="KRM021323" version="1758233391165"
			xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<ns3:situationRecordCreationTime>2025-09-18T22:09:51.165Z</ns3:situationRecordCreationTime>
			<ns3:situationRecordObservationTime>2025-09-18T22:09:51.165Z</ns3:situationRecordObservationTime>
			<ns3:situationRecordVersionTime>2025-09-18T22:09:51.165Z</ns3:situationRecordVersionTime>
			<ns3:confidentialityOverride>noRestriction</ns3:confidentialityOverride>
			<ns3:probabilityOfOccurrence>certain</ns3:probabilityOfOccurrence>
			<ns3:severity>high</ns3:severity>
			<ns3:validity>
				<validityStatus>active</validityStatus>
				<validityTimeSpecification>
					<overallStartTime>2025-09-18T22:09:51.165Z</overallStartTime>
				</validityTimeSpecification>
			</ns3:validity>
			<ns3:locationReference xsi:type="ns9:PointLocation">
				<ns9:pointByCoordinates>
					<ns9:pointCoordinates>
						<ns9:latitude>6704207.0</ns9:latitude>
						<ns9:longitude>286946.0</ns9:longitude>
					</ns9:pointCoordinates>
				</ns9:pointByCoordinates>
			</ns3:locationReference>
			<ns3:actionOrigin>internal</ns3:actionOrigin>
			<ns3:complianceOption>mandatory</ns3:complianceOption>
			<ns3:automaticallyInitiated>true</ns3:automaticallyInitiated>
			<ns3:speedManagementType>speedRestrictionInOperation</ns3:speedManagementType>
			<ns3:temporarySpeedLimit>100.0</ns3:temporarySpeedLimit>
		</ns3:situationRecord>
	</ns3:situation>
	<ns3:situation id="KRM01K001">
		<ns3:overallSeverity>high</ns3:overallSeverity>
		<ns3:situationVersionTime>2025-09-14T20:12:07.303Z</ns3:situationVersionTime>
		<ns3:headerInformation>
			<confidentiality>noRestriction</confidentiality>
			<informationStatus>real</informationStatus>
		</ns3:headerInformation>
		<ns3:situationRecord xsi:type="ns3:SpeedManagement" id="KRM01K001" version="1758247908068"
			xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<ns3:situationRecordCreationTime>2025-09-14T20:12:07.303Z</ns3:situationRecordCreationTime>
			<ns3:situationRecordObservationTime>2025-09-14T20:12:07.303Z</ns3:situationRecordObservationTime>
			<ns3:situationRecordVersionTime>2025-09-14T20:12:07.303Z</ns3:situationRecordVersionTime>
			<ns3:confidentialityOverride>noRestriction</ns3:confidentialityOverride>
			<ns3:probabilityOfOccurrence>certain</ns3:probabilityOfOccurrence>
			<ns3:severity>high</ns3:severity>
			<ns3:validity>
				<validityStatus>active</validityStatus>
				<validityTimeSpecification>
					<overallStartTime>2025-09-14T20:12:07.303Z</overallStartTime>
				</validityTimeSpecification>
			</ns3:validity>
			<ns3:locationReference xsi:type="ns9:PointLocation">
				<ns9:pointByCoordinates>
					<ns9:pointCoordinates>
						<ns9:latitude>6672259.0</ns9:latitude>
						<ns9:longitude>379389.0</ns9:longitude>
					</ns9:pointCoordinates>
				</ns9:pointByCoordinates>
			</ns3:locationReference>
			<ns3:actionOrigin>internal</ns3:actionOrigin>
			<ns3:complianceOption>mandatory</ns3:complianceOption>
			<ns3:automaticallyInitiated>true</ns3:automaticallyInitiated>
			<ns3:speedManagementType>speedRestrictionInOperation</ns3:speedManagementType>
			<ns3:temporarySpeedLimit>100.0</ns3:temporarySpeedLimit>
		</ns3:situationRecord>
	</ns3:situation>
</ns3:situationPublication>`;

export const TEST_DATEX2_2 =
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
	<publicationTime>2025-10-17T08:15:52.992Z</publicationTime>
	<publicationCreator>
		<country>FI</country>
		<nationalIdentifier>FTA</nationalIdentifier>
	</publicationCreator>
	<situation id="KRM123456">
		<overallSeverity>high</overallSeverity>
		<situationVersionTime>2024-12-03T16:01:13.526Z</situationVersionTime>
		<headerInformation>
			<confidentiality>noRestriction</confidentiality>
			<informationStatus>real</informationStatus>
		</headerInformation>
		<situationRecord xsi:type="sit:SpeedManagement" id="KRM123456" version="123"
			xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
			<situationRecordCreationTime>2024-12-03T16:01:13.526Z</situationRecordCreationTime>
			<situationRecordObservationTime>2024-12-03T16:01:13.526Z</situationRecordObservationTime>
			<situationRecordVersionTime>2024-12-03T16:01:13.526Z</situationRecordVersionTime>
			<confidentialityOverride>noRestriction</confidentialityOverride>
			<probabilityOfOccurrence>certain</probabilityOfOccurrence>
			<severity>high</severity>
			<validity>
				<validityStatus>active</validityStatus>
				<validityTimeSpecification>
					<overallStartTime>2024-12-03T16:01:13.526Z</overallStartTime>
				</validityTimeSpecification>
			</validity>
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
		</situationRecord>
	</situation>
</sit:situationPublication>`;

export const TEST_DATEX2_VMSPUBLICATION_1 =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns15:payload xsi:type="ns12:VmsPublication"
	xmlns="http://datex2.eu/schema/3/trafficManagementPlan"
	xmlns:ns2="http://datex2.eu/schema/3/common"
	xmlns:ns4="http://datex2.eu/schema/3/facilities"
	xmlns:ns3="http://datex2.eu/schema/3/roadTrafficData"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:ns6="http://datex2.eu/schema/3/situation"
	xmlns:ns5="http://datex2.eu/schema/3/parking"
	xmlns:ns8="http://datex2.eu/schema/3/commonExtension"
	xmlns:ns7="http://datex2.eu/schema/3/urbanExtensions"
	xmlns:ns13="http://datex2.eu/schema/3/energyInfrastructure"
	xmlns:ns9="http://datex2.eu/schema/3/locationExtension"
	xmlns:ns12="http://datex2.eu/schema/3/vms"
	xmlns:ns11="http://datex2.eu/schema/3/reroutingManagementEnhanced"
	xmlns:ns10="http://datex2.eu/schema/3/locationReferencing"
	xmlns:ns15="http://datex2.eu/schema/3/d2Payload"
	xmlns:ns14="http://datex2.eu/schema/3/faultAndStatus">
	<ns2:publicationTime>2025-09-30T14:03:57.516Z</ns2:publicationTime>
	<ns2:publicationCreator>
		<ns2:country>FI</ns2:country>
		<ns2:nationalIdentifier>FTA</ns2:nationalIdentifier>
	</ns2:publicationCreator>
	<ns12:headerInformation>
		<ns2:confidentiality>noRestriction</ns2:confidentiality>
		<ns2:informationStatus>real</ns2:informationStatus>
	</ns12:headerInformation>
	<ns12:vmsControllerStatus>
		<ns12:vmsControllerReference id="TIO01V101"/>
		<ns12:statusUpdateTime>2025-09-30T14:03:57.516Z</ns12:statusUpdateTime>
		<ns12:vmsStatus vmsIndex="0">
			<ns12:vmsStatus>
				<ns12:statusUpdateTime>2025-09-30T14:03:36.205Z</ns12:statusUpdateTime>
				<ns12:vmsMessage messageIndex="0">
					<ns12:vmsMessage>
						<ns12:displayAreaSettings displayAreaIndex="0">
							<ns12:displayAreaSettings xsi:type="ns12:MultiPageDisplay">
								<ns12:displayAreaSettings pageNumber="1">
									<ns12:displayAreaSettings xsi:type="ns12:TextDisplay">
										<ns12:textLine lineIndex="1">
											<ns12:textLine>
												<ns12:textLine>Ruuhkaa reitti3 pit: 14984 nop: 22</ns12:textLine>
											</ns12:textLine>
										</ns12:textLine>
									</ns12:displayAreaSettings>
								</ns12:displayAreaSettings>
							</ns12:displayAreaSettings>
						</ns12:displayAreaSettings>
					</ns12:vmsMessage>
				</ns12:vmsMessage>
				<ns12:vmsLocationOverride xsi:type="ns10:PointLocation">
					<ns10:coordinatesForDisplay>
						<ns10:latitude>6677868.0</ns10:latitude>
						<ns10:longitude>398690.0</ns10:longitude>
					</ns10:coordinatesForDisplay>
				</ns12:vmsLocationOverride>
			</ns12:vmsStatus>
		</ns12:vmsStatus>
	</ns12:vmsControllerStatus>
</ns15:payload>
`;

export const TEST_DATEX2_VMSPUBLICATION_2 =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns15:payload xsi:type="ns11:VmsPublication"
	xmlns="http://datex2.eu/schema/3/trafficManagementPlan"
	xmlns:ns2="http://datex2.eu/schema/3/situation"
	xmlns:ns4="http://datex2.eu/schema/3/urbanExtensions"
	xmlns:ns3="http://datex2.eu/schema/3/common"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:ns6="http://datex2.eu/schema/3/locationExtension"
	xmlns:ns5="http://datex2.eu/schema/3/commonExtension"
	xmlns:ns8="http://datex2.eu/schema/3/reroutingManagementEnhanced"
	xmlns:ns7="http://datex2.eu/schema/3/locationReferencing"
	xmlns:ns13="http://datex2.eu/schema/3/energyInfrastructure"
	xmlns:ns9="http://datex2.eu/schema/3/facilities"
	xmlns:ns12="http://datex2.eu/schema/3/parking"
	xmlns:ns11="http://datex2.eu/schema/3/vms"
	xmlns:ns10="http://datex2.eu/schema/3/roadTrafficData"
	xmlns:ns15="http://datex2.eu/schema/3/d2Payload"
	xmlns:ns14="http://datex2.eu/schema/3/faultAndStatus">
	<ns3:publicationTime>2025-10-01T12:11:58.746Z</ns3:publicationTime>
	<ns3:publicationCreator>
		<ns3:country>FI</ns3:country>
		<ns3:nationalIdentifier>FTA</ns3:nationalIdentifier>
	</ns3:publicationCreator>
	<ns11:headerInformation>
		<ns3:confidentiality>noRestriction</ns3:confidentiality>
		<ns3:informationStatus>real</ns3:informationStatus>
	</ns11:headerInformation>
	<ns11:vmsControllerStatus>
		<ns11:vmsControllerReference id="TIO01V310"/>
		<ns11:statusUpdateTime>2025-10-01T12:11:58.747Z</ns11:statusUpdateTime>
		<ns11:vmsStatus vmsIndex="0">
			<ns11:vmsStatus>
				<ns11:statusUpdateTime>2025-10-01T12:11:18.972Z</ns11:statusUpdateTime>
				<ns11:vmsMessage messageIndex="0">
					<ns11:vmsMessage>
						<ns11:displayAreaSettings displayAreaIndex="0">
							<ns11:displayAreaSettings xsi:type="ns11:MultiPageDisplay"/></ns11:displayAreaSettings>
					</ns11:vmsMessage>
				</ns11:vmsMessage>
				<ns11:vmsLocationOverride xsi:type="ns7:PointLocation">
					<ns7:coordinatesForDisplay>
						<ns7:latitude>6678723.0</ns7:latitude>
						<ns7:longitude>398177.0</ns7:longitude>
					</ns7:coordinatesForDisplay>
				</ns11:vmsLocationOverride>
			</ns11:vmsStatus>
		</ns11:vmsStatus>
	</ns11:vmsControllerStatus>
</ns15:payload>`;

export const TEST_DATEX2_VMS_TABLE_PUBLICATION =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ns15:payload xsi:type="ns11:VmsTablePublication"
	xmlns="http://datex2.eu/schema/3/trafficManagementPlan"
	xmlns:ns2="http://datex2.eu/schema/3/situation"
	xmlns:ns4="http://datex2.eu/schema/3/urbanExtensions"
	xmlns:ns3="http://datex2.eu/schema/3/common"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:ns6="http://datex2.eu/schema/3/locationExtension"
	xmlns:ns5="http://datex2.eu/schema/3/commonExtension"
	xmlns:ns8="http://datex2.eu/schema/3/reroutingManagementEnhanced"
	xmlns:ns7="http://datex2.eu/schema/3/locationReferencing"
	xmlns:ns13="http://datex2.eu/schema/3/energyInfrastructure"
	xmlns:ns9="http://datex2.eu/schema/3/facilities"
	xmlns:ns12="http://datex2.eu/schema/3/parking"
	xmlns:ns11="http://datex2.eu/schema/3/vms"
	xmlns:ns10="http://datex2.eu/schema/3/roadTrafficData"
	xmlns:ns15="http://datex2.eu/schema/3/d2Payload"
	xmlns:ns14="http://datex2.eu/schema/3/faultAndStatus">
	<ns3:publicationTime>2025-10-02T02:11:31.186Z</ns3:publicationTime>
	<ns3:publicationCreator>
		<ns3:country>FI</ns3:country>
		<ns3:nationalIdentifier>FTA</ns3:nationalIdentifier>
	</ns3:publicationCreator>
	<ns11:headerInformation>
		<ns3:confidentiality>noRestriction</ns3:confidentiality>
		<ns3:informationStatus>real</ns3:informationStatus>
	</ns11:headerInformation>
	<ns11:vmsControllerTable>
		<ns11:vmsController id="VME015511">
			<ns11:vms vmsIndex="0">
				<ns11:vms>
					<ns11:description>
						<ns3:values>
							<ns3:value lang="fi">Varoitusmerkki. Yhteismerkki KRM015512-merkin kanssa. Kts. Merkin IP-osoitteet VME015511/KRM015512-hallinta, VME015511/KRM015512-kontrolleri ja VME015511/KRM015512-s laitteilta.</ns3:value>
						</ns3:values>
					</ns11:description>
					<ns11:vmsType>other</ns11:vmsType>
					<ns11:vmsLocation xsi:type="ns7:PointLocation">
						<ns7:coordinatesForDisplay>
							<ns7:latitude>6683809.0</ns7:latitude>
							<ns7:longitude>406975.0</ns7:longitude>
						</ns7:coordinatesForDisplay>
					</ns11:vmsLocation>
				</ns11:vms>
			</ns11:vms>
		</ns11:vmsController>
		<ns11:vmsController id="VME015651">
			<ns11:vms vmsIndex="0">
				<ns11:vms>
					<ns11:description>
						<ns3:values>
							<ns3:value lang="fi">Varoitusmerkki. Yhteismerkki KRM015651-merkin kanssa. Kts. Merkin IP-osoitteet VME/KRM015651-hallinta, VME/KRM015651-kontrolleri ja VME/KRM015651-s laitteilta.</ns3:value>
						</ns3:values>
					</ns11:description>
					<ns11:vmsType>other</ns11:vmsType>
					<ns11:vmsLocation xsi:type="ns7:PointLocation">
						<ns7:coordinatesForDisplay>
							<ns7:latitude>6684359.0</ns7:latitude>
							<ns7:longitude>407918.0</ns7:longitude>
						</ns7:coordinatesForDisplay>
					</ns11:vmsLocation>
				</ns11:vms>
			</ns11:vms>
		</ns11:vmsController>
	</ns11:vmsControllerTable>
</ns15:payload>`;
