export const FormalityResponseJson = {
  "0": {
    ReportingObligation: "Required",
    MrsName: "GOFREP",
    AreaCoveredByMrs:
      "POLYGON((21.5 59.166667,22.5 59.555,22.501667 59.723333,22.836667 59.740833,22.836667 59.675,23.371667 59.675,23.55 59.7,24.725 59.925,25.033333 59.97,25.741667 59.991667,25.716667 60.093333,26.65 60.171667,26.765 60.201667,27.293333 60.2,26.816667 60.148333,26.5 60.083333,26.5 59.95,25.857667 59.904667,25.763167 59.888833,25.665 59.880667,25.179333 59.840167,25.1145 59.832833,24.596 59.775,24.523833 59.765167,24.480167 59.740333,24.363 59.740333,24.2995 59.730833,22.746667 59.500167,22.563333 59.466833,22.413333 59.4085,21.865333 59.1915,21.707333 59.1265,21.668 59.098,21.5 59.166667))",
    Iso28005Payload:
      '<?xml version="1.0" encoding="utf-16"?><EPCMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.iso.org/28005-2"><EPCMessageHeader xmlns=""><SentTime>0001-01-01T00:00:00</SentTime><MessageType>ACK</MessageType></EPCMessageHeader><EPCRequestBody xmlns=""><Agent><Company /><ContactNumbers><BusinessTelephone /></ContactNumbers><Person /></Agent><AirDraught>1</AirDraught><Beam>1</Beam><Company><Contact><Company /><ContactNumbers><BusinessTelephone /></ContactNumbers><Person /></Contact></Company><DeadWeight>1</DeadWeight><GeneralRemark /><GrossTonnage>1</GrossTonnage><LengthOverall>1</LengthOverall><NetTonnage>1</NetTonnage><PersonsOnboard><NumberOfPersonsOnboard>1</NumberOfPersonsOnboard></PersonsOnboard><PortOfArrival><ArrivalTime><DateTime>2021-06-08T12:48:20.7729775+02:00</DateTime><TimeType>Estimated</TimeType></ArrivalTime><Location><Name /><UNLoCode /></Location></PortOfArrival><ReportingEvent><ArrivalTime><DateTime>2021-06-08T12:48:20.7729775+02:00</DateTime><TimeType>Actual</TimeType></ArrivalTime><Location><Position><Latitude>1</Latitude><Longitude>1</Longitude></Position></Location></ReportingEvent><ShipDefects /><ShipID><CallSign /><MMSINumber /><ShipName /><RegistrationPort><CountryCode>AD</CountryCode></RegistrationPort></ShipID><ShipStatus><Course>1</Course><PresentDraught>1</PresentDraught><Speed>1</Speed></ShipStatus><ShipType>50</ShipType><WayPointList /></EPCRequestBody></EPCMessage>',
    AcceptedDesignators: [
      {
        Telegraphy: "A",
        Function: "Vessel",
        InformationRequired:
          "Vessel’s name, call sign and IMO identification. MMSI may be reported.",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "C",
        Function: "Position",
        InformationRequired: "Geographical position by two 6 digit groups;",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "E",
        Function: "True course",
        InformationRequired: "True course in three (3) digit groups",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "F",
        Function: "Speed",
        InformationRequired: "Speed in knots with one decimal",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "I",
        Function: "Destination and ETA",
        InformationRequired: "Destination and ETA",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "O",
        Function: "Draught",
        InformationRequired:
          "Vessel’s present draught in metres with one decimal",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "P",
        Function: "Cargo on board",
        InformationRequired:
          "Hazardous cargo onboard, IMO main classes and quantity in metric tonnes  with up to two decimals.",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "T",
        Function: "Ship's representative and/or owner",
        InformationRequired:
          "Contact information of agent in the Gulf of Finland",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "U",
        Function: "Ship size and type",
        InformationRequired: "Vessel type and length",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "W",
        Function: "Number of persons on board",
        InformationRequired: "Total number of persons onboard",
        SemanticsVariesWithReportType: "false",
      },
      {
        Telegraphy: "X",
        Function: "Miscellaneous",
        InformationRequired:
          "Characteristics and estimated quantity of bunker fuel for ships carrying more  than 5,000 tons of bunkers and navigational status.",
        SemanticsVariesWithReportType: "false",
      },
    ],
    ReportingTriggers: [],
  },
} as const;
