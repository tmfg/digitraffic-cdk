export const ramiSmMessageJsonSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "StopMonitoring Kafka topic - description",
    "description": "No description provided",
    "type": "object",
    "properties": {
      "stopMonitoringMsg": {
        "$ref": "#/definitions/StopMonitoringMsg",
        "description": "Object to deserialize from Kafka"
      }
    },
    "required": [
      "payload"
    ],
    "definitions": {
      "KafkaMessageHeaders": {
        "type": "object",
        "required": [
          "e2eId",
          "eventType",
          "source",
          "recordedAtTime"
        ],
        "description": "Header of the message",
        "properties": {
          "e2eId": {
            "type": "string",
            "format": "uuid",
            "example": "c45c7f92-5f96-4059-b0b3-20295388e4f6",
            "description": "Correlational event unique identifier"
          },
          "organisation": {
            "type": "string",
            "example": "",
            "description": "Identifier of external organization that sends the message"
          },
          "source": {
            "type": "string",
            "description": "Module identifier that publishes the message"
          },
          "eventType": {
            "type": "string",
            "description": "Type of event"
          },
          "partitionKey": {
            "type": "string",
            "example": "",
            "description": "Partition key value. It will be valorized only if set by the producer."
          },
          "recordedAtTime": {
            "type": "string",
            "format": "date-time",
            "example": "2019-02-07T07:30:00.000Z",
            "description": "Registration date"
          }
        }
      },
      "StopMonitoringMsg": {
        "type": "object",
        "required": [
          "headers",
          "payload"
        ],
        "properties": {
          "headers": {
            "$ref": "#/definitions/KafkaMessageHeaders"
          },
          "payload": {
            "$ref": "#/definitions/StopMonitoring"
          }
        }
      },
      "ControlAction": {
        "type": "object",
        "description": "An action resulting from a decision taken by the controller causing an amendment of the operation planned in the production plan.",
        "properties": {
          "id": {
            "type": "string"
          },
          "type": {
            "$ref": "#/definitions/ControlActionType"
          },
          "status": {
            "$ref": "#/definitions/ControlActionStatus"
          },
          "lastUpdate": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "ControlActionStatus": {
        "description": "Status of the Control Action",
        "type": "string",
        "enum": [
          "draft",
          "pendingValidation",
          "validated",
          "cancelled"
        ]
      },
      "ControlActionType": {
        "description": "Descriminator for the type of the Control Action",
        "example": "journeyCreation",
        "type": "string",
        "enum": [
          "journeyCreation",
          "journeyCancellation",
          "partialJourneyCancellation",
          "changeOfJourneyPattern",
          "changeOfJourneyTiming",
          "changeOfPlatform",
          "journeyInterchangeCreation",
          "journeyInterchangeCancellation"
        ]
      },
      "Situation": {
        "type": "object",
        "description": "An incident or deviation affecting the planned Public Transport service operation.",
        "properties": {
          "strictScope": {
            "$ref": "#/definitions/StrictScopeEnum"
          },
          "situationNumber": {
            "type": "string",
            "description": "Unique Identifier of the Situation for this specific version."
          },
          "severity": {
            "$ref": "#/definitions/SeverityEnum"
          },
          "situationType": {
            "$ref": "#/definitions/SituationTypeEnum"
          },
          "progress": {
            "$ref": "#/definitions/SituationStatusProgressEnum"
          },
          "reasonType": {
            "$ref": "#/definitions/ReasonTypeEnum"
          }
        }
      },
      "StopMonitoring": {
        "type": "object",
        "properties": {
          "monitoredStopVisits": {
            "$ref": "#/definitions/MonitoredStopVisits"
          },
          "monitoredStopVisitCancellations": {
            "$ref": "#/definitions/MonitoredStopVisitCancellations"
          }
        },
        "required": [
          "monitoredStopVisits"
        ]
      },
      "MonitoredStopVisit": {
        "description": "A visit to a SCHEDULED STOP POINT by a VEHICLE as an arrival and /or departure. Associated with each MonitoredStopVisit is a MonitoredVehicleJourney instance, which may be populated to different levels of detail depending on the information known by PIS",
        "allOf": [
          {
            "$ref": "#/definitions/AbstractIdentifiedItemStructure"
          },
          {
            "type": "object",
            "properties": {
              "monitoringRef": {
                "type": "string",
                "description": "Code of the stoppoint wich this Stopmonitoring is related to"
              },
              "vehicleActivityNote": {
                "type": "string",
                "description": "Empty"
              },
              "validUntilTime": {
                "type": "string",
                "format": "date-time",
                "description": "Empty"
              },
              "monitoredVehicleJourney": {
                "$ref": "#/definitions/MonitoredVehicleJourney"
              },
              "stopVisitNote": {
                "type": "string",
                "description": "Empty."
              }
            },
            "required": [
              "monitoringRef",
              "monitoredVehicleJourney"
            ]
          }
        ]
      },
      "MonitoredStopVisits": {
        "type": "array",
        "description": "A list of visits to a SCHEDULED STOP POINT by VEHICLEs as arrivals and / or departures.",
        "items": {
          "$ref": "#/definitions/MonitoredStopVisit"
        }
      },
      "MonitoredStopVisitCancellation": {
        "description": "This structure in PIS is not used becouse all information related to the journey in the stop point (arrival, departure, cancellation)  are in the MonitoredvehicleJourney object ",
        "allOf": [
          {
            "$ref": "#/definitions/AbstractReferencingItemStructure"
          },
          {
            "$ref": "#/definitions/StopVisitCancellationIdentityGroup"
          },
          {
            "$ref": "#/definitions/JourneyPatternInfoGroup"
          },
          {
            "type": "object",
            "properties": {
              "reason": {
                "type": "string",
                "description": "Reason for cancellation."
              }
            }
          }
        ]
      },
      "MonitoredStopVisitCancellations": {
        "type": "array",
        "items": {
          "$ref": "#/definitions/MonitoredStopVisitCancellation"
        }
      },
      "MonitoredVehicleJourney": {
        "type": "object",
        "description": "Provides real-time information about the VEHICLE JOURNEY along which a VEHICLE is running.",
        "allOf": [
          {
            "$ref": "#/definitions/MonitoredJourneyIdentityGroup"
          },
          {
            "$ref": "#/definitions/JourneyPatternInfoGroup"
          },
          {
            "$ref": "#/definitions/VehicleJourneyInfoGroup"
          },
          {
            "$ref": "#/definitions/JourneyProgressGroup"
          },
          {
            "$ref": "#/definitions/TrainOperationalInfoGroup"
          },
          {
            "$ref": "#/definitions/MonitoredCallingPatternGroup"
          },
          {
            "type": "object",
            "properties": {
              "extensions": {
                "description": "optional fields, now not used",
                "type": "object",
                "properties": {
                  "custom": {
                    "type": "string"
                  },
                  "native": {
                    "$ref": "#/definitions/MonitoredVehicleJourneyExtension"
                  }
                }
              }
            }
          }
        ]
      },
      "FramedVehicleJourneyRef": {
        "type": "object",
        "description": "A reference to the journey",
        "properties": {
          "dataFrameRef": {
            "type": "string",
            "description": "Day date is used for this purpose."
          },
          "datedVehicleJourneyRef": {
            "type": "string",
            "description": "identifier of the journey"
          }
        },
        "required": [
          "dataFrameRef",
          "datedVehicleJourneyRef"
        ]
      },
      "Via": {
        "type": "object",
        "description": "Description of a VIA point",
        "properties": {
          "viaRef": {
            "type": "string",
            "description": "Identifier of a VIA point of the journey"
          },
          "viaName": {
            "type": "string",
            "description": "The name of a VIA point of the journey, used to help"
          }
        }
      },
      "JourneyPartInfo": {
        "type": "object",
        "description": "Information about JOURNEY PARTs. (Empty).",
        "properties": {
          "journeyPartRef": {
            "type": "string",
            "description": "Reference to a JOURNEY PART. (Enpty)."
          },
          "trainNumberRef": {
            "type": "string",
            "description": "Reference to TRAIN NUMBER for a JOURNEY PART. (Empty)."
          },
          "operatorRef": {
            "type": "string",
            "description": "Reference to OPERATOR of a JOURNEY PART. (Empty)."
          }
        }
      },
      "PreviousCall": {
        "description": "Information on a stop previously called at by the VEHICLE before the current stop.",
        "allOf": [
          {
            "$ref": "#/definitions/AbstractMonitoredCall"
          },
          {
            "$ref": "#/definitions/VehicleArrivalTimesGroup"
          },
          {
            "$ref": "#/definitions/VehicleDepartureTimesGroup"
          },
          {
            "type": "object",
            "properties": {
              "vehicleAtStop": {
                "type": "boolean",
                "description": "Wether VEHICLE is currently at stop.  Default is false"
              },
              "extensions": {
                "type": "object",
                "properties": {
                  "custom": {
                    "type": "string"
                  },
                  "native": {
                    "$ref": "#/definitions/PreviousCallExtension"
                  }
                }
              }
            }
          }
        ]
      },
      "MonitoredCall": {
        "description": "The stoppoint relating to this StopMonitoring instance.",
        "allOf": [
          {
            "$ref": "#/definitions/AbstractMonitoredCall"
          },
          {
            "$ref": "#/definitions/CallRealtimeGroup"
          },
          {
            "$ref": "#/definitions/CallRailGroup"
          },
          {
            "$ref": "#/definitions/CallPropertyGroup"
          },
          {
            "$ref": "#/definitions/CallNoteGroup"
          },
          {
            "$ref": "#/definitions/StopArrivalGroup"
          },
          {
            "$ref": "#/definitions/StopDepartureGroup"
          },
          {
            "$ref": "#/definitions/HeadwayIntervalGroup"
          },
          {
            "$ref": "#/definitions/StopProximityGroup"
          },
          {
            "type": "object",
            "properties": {
              "extensions": {
                "description": "optional fields, used for replacements and sectoring",
                "type": "object",
                "properties": {
                  "custom": {
                    "type": "string"
                  },
                  "native": {
                    "allOf": [
                      {
                        "$ref": "#/definitions/MonitoredCallExtension"
                      },
                      {
                        "$ref": "#/definitions/ReplacementsAndSectoringExtension"
                      }
                    ]
                  }
                }
              }
            }
          }
        ]
      },
      "OnwardCall": {
        "description": "Information on a call at a stop after the current call.",
        "allOf": [
          {
            "$ref": "#/definitions/AbstractMonitoredCall"
          },
          {
            "$ref": "#/definitions/OnwardsCallGroup"
          },
          {
            "type": "object",
            "properties": {
              "vehicleAtStop": {
                "type": "boolean",
                "description": "Wether VEHICLE is currently at stop.  Default is false"
              },
              "timingPoint": {
                "type": "boolean",
                "description": "Whether the stop is a TIMING POINT, i.e. times are measured at it. In Some systems this is a measure of data quality as non-timing points are interpolated."
              },
              "extensions": {
                "description": "optional fields, now not used",
                "type": "object",
                "properties": {
                  "custom": {
                    "type": "string"
                  },
                  "native": {
                    "$ref": "#/definitions/OnwardCallExtension"
                  }
                }
              }
            }
          }
        ]
      },
      "StopAssignment": {
        "type": "object",
        "description": "Assignment of arrival/departure at scheduled STOP POINT to a physical QUAY (platform).",
        "properties": {
          "aimedQuayRef": {
            "type": "string",
            "description": "Reference (id) to the physical QUAY to use according to the planned timetable."
          },
          "aimedQuayName": {
            "type": "string",
            "description": "Scheduled Platform name. Can be used to indicate a platform change."
          },
          "expectedQuayRef": {
            "type": "string",
            "description": "Reference (id) to the physical QUAY to use according to the real-time prediction"
          },
          "expectedQuayName": {
            "type": "string",
            "description": "Expected Platform name"
          },
          "actualQuayRef": {
            "type": "string",
            "description": "Reference (id) to the physical QUAY actually used."
          },
          "actualQuayName": {
            "type": "string",
            "description": "Actual Platform name."
          }
        }
      },
      "Location": {
        "type": "object",
        "description": "Type for geospatial Position of a point (Empty)",
        "properties": {
          "latitude": {
            "type": "number",
            "description": "Latitude from equator. -90° (South) to +90° (North). Decimal degrees. e.g. 56.356."
          },
          "longitude": {
            "type": "number",
            "description": "Longitude from Greenwich Meridian. -180° (East) to +180° (West). Decimal degrees. e.g. 2.356."
          },
          "precision": {
            "type": "number",
            "description": "Precision for point measurement. In meters."
          }
        }
      },
      "AbstractMonitoredCall": {
        "type": "object",
        "description": "Type for Abstract CALL at stop.",
        "properties": {
          "stopPointRef": {
            "type": "string",
            "description": "Code of the stop point (es HKI)"
          },
          "visitNumber": {
            "type": "integer"
          },
          "order": {
            "type": "integer",
            "description": "Overall Order within a JOURNEY PATTERN."
          },
          "stopPointName": {
            "type": "string",
            "description": "eg. Helsinki."
          }
        }
      },
      "CallRealtimeGroup": {
        "type": "object",
        "description": "Elements describing the Real-time CALL properties. (Empty)",
        "properties": {
          "vehicleAtStop": {
            "type": "boolean",
            "description": "Wether VEHICLE is currently at stop.  Default is false. (Empty)"
          },
          "vehicleLocationAtStop": {
            "description": "Empty",
            "$ref": "#/definitions/Location"
          }
        }
      },
      "CallRailGroup": {
        "type": "object",
        "description": "Elements describing the Properties specific to a rail CALL.",
        "properties": {
          "reversesAtStop": {
            "type": "boolean",
            "description": "Whether VEHICLE will reverse at stop. Default is 'false'. (Empty)."
          },
          "platformTraversal": {
            "type": "boolean",
            "description": "(Empty)."
          }
        }
      },
      "CallPropertyGroup": {
        "type": "object",
        "description": "Elements describing the CALL Properties.",
        "properties": {
          "timingPoint": {
            "type": "boolean",
            "description": "Whether the stop is a TIMING POINT, i.e. times are measured at it. In Some systems this is a measure of data quality as non-timing points are interpolated. (EMpty)."
          },
          "destinationDisplay": {
            "type": "string",
            "description": "The name of the destination of the journey"
          }
        }
      },
      "CallNoteGroup": {
        "type": "object",
        "description": "Annotations of the CALL.",
        "properties": {
          "callNote": {
            "type": "string",
            "description": "Text annotation that applies to this call. (Empty)."
          }
        }
      },
      "VehicleArrivalTimesGroup": {
        "type": "object",
        "description": "Arrival times for CALL.",
        "properties": {
          "aimedArrivalTime": {
            "type": "string",
            "format": "date-time",
            "description": "Arrival time of VEHICLE at STOP POINT in either the original or Production Timetable. Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          },
          "actualArrivalTime": {
            "type": "string",
            "format": "date-time",
            "description": "Observed time of arrival of VEHICLE at STOP POINT. Date and time in [ISO 8601 format](Empty)."
          },
          "expectedArrivalTime": {
            "type": "string",
            "format": "date-time",
            "description": "Estimated time of arrival of VEHICLE at STOP POINT. Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          }
        }
      },
      "MonitoredCallArrivalTimesGroup": {
        "description": "Arrival times for CALL.",
        "allOf": [
          {
            "$ref": "#/definitions/VehicleArrivalTimesGroup"
          }
        ]
      },
      "MonitoredStopArrivalStatusGroup": {
        "type": "object",
        "description": "Elements describing the the arrival status of a VEHICLE at a stop.",
        "properties": {
          "arrivalStatus": {
            "type": "string",
            "description": "Classification of the timeliness of the arrival part of the CALL according to a fixed list of values.",
            "enum": [
              "onTime",
              "early",
              "delayed",
              "cancelled",
              "arrived",
              "departed",
              "missed",
              "noReport"
            ]
          },
          "arrivalProximityTextRef": {
            "type": "string",
            "description": "Uinique identifier of the proximity status of the arrival of the VEHICLE. (Empty)."
          },
          "arrivalProximityTextName": {
            "type": "string",
            "description": "Arbitrary text string to show to indicate the proximity status of the arrival of the VEHICLE. (Empty)."
          },
          "arrivalPlatformName": {
            "type": "string",
            "description": "Arrival QUAY (bay or platform) name."
          },
          "arrivalBoardingActivity": {
            "type": "string",
            "description": "Type of alighting activity allowed at stop.",
            "enum": [
              "alighting",
              "noAlighting",
              "passthru"
            ]
          },
          "arrivalStopAssignment": {
            "$ref": "#/definitions/StopAssignment"
          }
        }
      },
      "StopArrivalGroup": {
        "description": "Elements describing the the arrival of a VEHICLE at a stop.",
        "allOf": [
          {
            "$ref": "#/definitions/MonitoredCallArrivalTimesGroup"
          },
          {
            "$ref": "#/definitions/MonitoredStopArrivalStatusGroup"
          }
        ]
      },
      "VehicleDepartureTimesGroup": {
        "type": "object",
        "description": "Departure times for CALL.",
        "properties": {
          "aimedDepartureTime": {
            "type": "string",
            "format": "date-time",
            "description": "Departure time of VEHICLE from STOP POINT in either the original or Production Timetable. Date and time in [ISO 8601 format]"
          },
          "actualDepartureTime": {
            "type": "string",
            "format": "date-time",
            "description": "Actual observed time of departure of VEHICLE from STOP POINT. Date and time in [ISO 8601 format](Empty)."
          },
          "expectedDepartureTime": {
            "type": "string",
            "format": "date-time",
            "description": "Estimated time of departure of VEHICLE from STOP POINT. Date and time in [ISO 8601 format]"
          }
        }
      },
      "MonitoredCallDepartureTimesGroup": {
        "description": "Departure times for CALL.",
        "allOf": [
          {
            "$ref": "#/definitions/VehicleDepartureTimesGroup"
          },
          {
            "type": "object",
            "properties": {
              "provisionalExpectedDepartureTime": {
                "type": "string",
                "format": "date-time",
                "description": "Estimated departure time of VEHICLE  (Empty)."
              },
              "earliestExpectedDepartureTime": {
                "type": "string",
                "format": "date-time",
                "description": "Earliest time at which VEHICLE may leave the stop.  Date and time in ISO 8601 format(Empty)."
              }
            }
          }
        ]
      },
      "MonitoredStopDepartureStatusGroup": {
        "type": "object",
        "description": "Elements describing the the departure status of a VEHICLE from a stop.",
        "properties": {
          "departureStatus": {
            "type": "string",
            "description": "Classification of the timeliness of the departure part of the CALL, according to a fixed list of values.",
            "enum": [
              "onTime",
              "early",
              "delayed",
              "cancelled",
              "arrived",
              "departed",
              "missed",
              "noReport"
            ]
          },
          "departureProximityTextRef": {
            "type": "string",
            "description": "Uinique identifier of the proximity status of the departure of the VEHICLE. (Empty)."
          },
          "departureProximityTextName": {
            "type": "string",
            "description": "Arbitrary text string to show to indicate the proximity status of the departure of the VEHICLE  (Empty)."
          },
          "departurePlatformName": {
            "type": "string",
            "description": "Departure QUAY (bay or platform) name from which VEHICLE will depart."
          },
          "departureBoardingActivity": {
            "type": "string",
            "description": "Type of boarding activity allowed at stop.<br>The value will be calculated based on the type of point:<br>point of origin: if empty or different from 'boarding' and flag is true => 'boarding';<br>destination point: if empty or different from 'noBoarding' and flag is true => 'noBoarding';<br>other points: if empty => 'boarding';",
            "enum": [
              "boarding",
              "noBoarding",
              "passthru"
            ]
          },
          "departureStopAssignment": {
            "$ref": "#/definitions/StopAssignment"
          }
        }
      },
      "StopDepartureGroup": {
        "description": "Elements describing the the departure of a VEHICLE from a stop.",
        "allOf": [
          {
            "$ref": "#/definitions/MonitoredCallDepartureTimesGroup"
          },
          {
            "$ref": "#/definitions/MonitoredStopDepartureStatusGroup"
          }
        ]
      },
      "HeadwayIntervalGroup": {
        "type": "object",
        "description": "Elements describing the HEADWAY INTERVALs (Empty)",
        "properties": {
          "aimedHeadwayInterval": {
            "type": "string",
            "format": "duration",
            "description": "For frequency based services, target interval between services at stop. (Empty)"
          },
          "expectedHeadwayInterval": {
            "type": "string",
            "format": "duration",
            "description": "For frequency based services, estimated interval between services at stop.(Empty)"
          }
        }
      },
      "StopProximityGroup": {
        "type": "object",
        "description": "Elements describing the distance from the stop of a VEHICLE (Empty)",
        "properties": {
          "distanceFromStop": {
            "type": "number",
            "description": "Distance of VEHICLE from stop of CALL as measured along ROUTE track. Positive value denotes distance before stop. Default unit is SI Kilometres.(Empty)"
          },
          "numberOfStopsAway": {
            "type": "integer",
            "description": "Count of stops along SERVICE PATTERN between current position of VEHICLE and stop of CALL as measured along ROUTE track. (Empty)"
          }
        }
      },
      "OnwardsCallGroup": {
        "description": "Elements describing the CALL. Values for these elements can be specified on an production VEHICLE JOURNEY CALL. Each real-time journey CALL takes its values from the corresponding dated VEHICLE JOURNEY CALL.",
        "allOf": [
          {
            "$ref": "#/definitions/OnwardVehicleArrivalTimesGroup"
          },
          {
            "$ref": "#/definitions/MonitoredStopArrivalStatusGroup"
          },
          {
            "$ref": "#/definitions/OnwardVehicleDepartureTimesGroup"
          },
          {
            "$ref": "#/definitions/MonitoredStopDepartureStatusGroup"
          },
          {
            "$ref": "#/definitions/HeadwayIntervalGroup"
          },
          {
            "$ref": "#/definitions/StopProximityGroup"
          }
        ]
      },
      "OnwardVehicleArrivalTimesGroup": {
        "type": "object",
        "description": "Elements for Arrival in ONWARD CALL.",
        "properties": {
          "aimedArrivalTime": {
            "type": "string",
            "format": "date-time",
            "description": "Target arrival time of VEHICLE at stop according to latest working timetable. Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          },
          "expectedArrivalTime": {
            "type": "string",
            "format": "date-time",
            "description": "Estimated time of arrival of VEHICLE at STOP POINT. Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          }
        }
      },
      "OnwardVehicleDepartureTimesGroup": {
        "type": "object",
        "description": "Elements for Departure in ONWARD CALL.",
        "properties": {
          "aimedDepartureTime": {
            "type": "string",
            "format": "date-time",
            "description": "Target departure time of VEHICLE according to latest working timetable. Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          },
          "expectedDepartureTime": {
            "type": "string",
            "format": "date-time",
            "description": "Estimated time of departure of VEHICLE Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          },
          "provisionalExpectedDepartureTime": {
            "type": "string",
            "format": "date-time",
            "description": "Expected departure time of VEHICLE without waiting time due to operational actions.(Empty)."
          },
          "earliestExpectedDepartureTime": {
            "type": "string",
            "format": "date-time",
            "description": "Earliest time at which VEHICLE may leave the stop. Used to secure connections. Used for passenger announcements. Date and time in ISO 8601 format (Empty)."
          }
        }
      },
      "MonitoredJourneyIdentityGroup": {
        "type": "object",
        "description": "Elements identifying a VEHICLE JOURNEY. LINE and DIRECTION will be same as for journey unless overridden.",
        "properties": {
          "lineRef": {
            "type": "string",
            "description": "Reference to a LINE (eg. 11)"
          },
          "directionRef": {
            "type": "string",
            "description": "Empty"
          },
          "framedVehicleJourneyRef": {
            "$ref": "#/definitions/FramedVehicleJourneyRef"
          }
        }
      },
      "JourneyPatternInfoGroup": {
        "type": "object",
        "properties": {
          "journeyPatternRef": {
            "type": "string",
            "description": "Identifier (JourneyPatternCode) of JOURNEY PATTERN that journey follows. (Empty)."
          },
          "vehicleModeRef": {
            "type": "string",
            "description": "Unique identifier of a method of transportation such as bus, rail, etc. TPEG Pti21 classification. (Empty)."
          },
          "vehicleModeName": {
            "type": "string",
            "description": "Text description of a method of transportation. (RAIL)."
          },
          "publishedLineName": {
            "type": "string",
            "description": "Name or Number by which the LINE is known to the public. (eg. Y U L E A P)."
          },
          "directionName": {
            "type": "string",
            "description": "Name of the relative direction the VEHICLE is running along the LINE, for example, \"inbound\" or \"outbound”. (Empty)."
          }
        }
      },
      "VehicleJourneyInfoGroup": {
        "description": "Common information about a VEHICLE JOURNEY.",
        "allOf": [
          {
            "$ref": "#/definitions/ServiceInfoGroup"
          },
          {
            "$ref": "#/definitions/JourneyEndNamesGroup"
          },
          {
            "$ref": "#/definitions/JourneyInfoGroup"
          }
        ]
      },
      "ServiceInfoGroup": {
        "description": "Elements classifying the Service or journey. Values for these elements can be specified on a timetabled schedule and will be inherited, unless overriden, onto the production timetable and then onto the individul dated VEHICLE JOURNEYs of the timetable. Each monitored journey takes its values from the dated VEHICLE JOURNEY that it follows. The absence of a value on an entity at a given level indicates that the value should be inherited (i) from any recent preceding update message for the same entity, or if there is no previous override, (ii) from its immediate parent entity.",
        "allOf": [
          {
            "$ref": "#/definitions/BasicServiceInfoGroup"
          },
          {
            "type": "object",
            "properties": {
              "vehicleFeatureRef": {
                "type": "array",
                "description": "Identifier  of a Feature (Empty)",
                "items": {
                  "type": "string"
                }
              }
            }
          }
        ]
      },
      "BasicServiceInfoGroup": {
        "type": "object",
        "description": "Information that classifies journey.",
        "properties": {
          "operatorRef": {
            "type": "string",
            "description": "Identifier (OperatorCode) of OPERATOR of journey. (Empty)."
          },
          "productCategoryRef": {
            "type": "string",
            "description": "Identifier of a product category of the journey – (eg. S HL IC)."
          },
          "serviceFeatureRef": {
            "type": "array",
            "description": "Identifier (ServiceFeatureCode) of a Service Feature (Empty).",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "JourneyEndNamesGroup": {
        "type": "object",
        "description": "End names for journey.",
        "properties": {
          "originRef": {
            "type": "string",
            "description": "The identifier of the origin of the journey (eg. HKI)"
          },
          "originName": {
            "type": "string",
            "description": "The name of the origin of the journey (eg. Helsinki)"
          },
          "via": {
            "type": "array",
            "description": "List of VIA points on a journey.",
            "items": {
              "$ref": "#/definitions/Via"
            }
          },
          "destinationRef": {
            "type": "string",
            "description": "The identifier of the destination (eg. HKI)"
          },
          "destinationName": {
            "type": "string",
            "description": "The name of the destination (eg. Helsinki)."
          }
        }
      },
      "JourneyInfoGroup": {
        "type": "object",
        "description": "Elements describing a VEHICLE JOURNEY. Values for these elements can be specified on an annual schedule",
        "properties": {
          "vehicleJourneyName": {
            "type": "string",
            "description": "Name of VEHICLE JOURNEY."
          },
          "journeyNote": {
            "type": "string",
            "description": "Additional descriptive text associated with journey. (Empty)"
          }
        }
      },
      "JourneyProgressGroup": {
        "description": "Elements describing the real-time progress of a monitored VEHICLE JOURNEY.",
        "allOf": [
          {
            "$ref": "#/definitions/ProgressDataQualityGroup"
          },
          {
            "$ref": "#/definitions/ProgressDataGroup"
          },
          {
            "type": "object",
            "properties": {
              "monitored": {
                "type": "boolean",
                "description": "Whether there is real-time information available for journey. If not present, not known."
              }
            }
          }
        ]
      },
      "ProgressDataQualityGroup": {
        "type": "object",
        "description": "Elements describing the quality of real-time progress data of a journey.",
        "properties": {
          "dataSource": {
            "type": "string",
            "description": "System originating real-time data. (RAMI)"
          },
          "inCongestion": {
            "type": "boolean",
            "description": "Whether the vehicle is in congestion. If not present, not known. (Empty)."
          },
          "inPanic": {
            "type": "boolean",
            "description": "Whether the vehicle alarm is on. Likely to indicate unpredictable progress. If not present, false. (Empty)."
          },
          "predictionInaccurate": {
            "type": "boolean",
            "description": "Whether the prediction should be judged as inaccurate. (Empty)."
          }
        }
      },
      "ProgressDataGroup": {
        "type": "object",
        "description": "Elements describing the real-time progress of a journey.",
        "properties": {
          "vehicleLocation": {
            "$ref": "#/definitions/Location"
          },
          "locationRecordedAtTime": {
            "type": "string",
            "format": "date-time",
            "description": "Time at which location was recorded. If not present assume that the recorded at time on the containing delivery (Empty)"
          },
          "bearing": {
            "type": "number",
            "description": "Bearing in degrees in which VEHICLE is heading. North = 0, clockwise. (Empty)."
          },
          "progressRate": {
            "type": "string",
            "description": "Classification of the rate of progress of VEHICLE. (Unknown).",
            "enum": [
              "noProgress",
              "slowProgress",
              "normalProgress",
              "fastProgress",
              "unknown"
            ]
          },
          "engineOn": {
            "type": "boolean",
            "default": true,
            "description": "Whether the engine of the vehicle is on. Default is 'true' (Empty)"
          },
          "velocity": {
            "type": "number",
            "description": "Velocity of vehicle in metres per second. Either actual speed or average speed may be used. (Empty)."
          },
          "occupancy": {
            "type": "string",
            "description": "How full VEHICLE is. If omitted, not known. (Empty).",
            "enum": [
              "full",
              "standingAvailable",
              "seatsAvailable"
            ]
          },
          "delay": {
            "type": "string",
            "format": "duration",
            "description": "Delay in minutes. Information about delays are in call objects (Empty)"
          },
          "vehicleStatus": {
            "type": "string",
            "description": "A classification of the progress state of the VEHICLE JOURNEY. (Empty)",
            "enum": [
              "expected",
              "notExpected",
              "cancelled",
              "assigned",
              "signedOn",
              "atOrigin",
              "inProgress",
              "aborted",
              "offRoute",
              "completed",
              "assumedCompleted",
              "notRun"
            ]
          }
        }
      },
      "TrainOperationalInfoGroup": {
        "description": "Operational information about the monitored VEHICLE JOURNEY. (Empty)",
        "type": "object",
        "properties": {
          "trainNumbers": {
            "type": "array",
            "description": "One or more train numbers in a sequence (Empty).",
            "items": {
              "type": "object",
              "properties": {
                "trainNumberRef": {
                  "type": "string",
                  "description": "UE regulation 454/2011 primary code or UIC Train Number (Empty)"
                }
              }
            }
          },
          "journeyParts": {
            "type": "array",
            "description": "One or more part of journey (Empty).",
            "items": {
              "$ref": "#/definitions/JourneyPartInfo"
            }
          }
        }
      },
      "MonitoredCallingPatternGroup": {
        "type": "object",
        "description": "The service pattern of a monitored VEHICLE JOURNEY.",
        "properties": {
          "previousCalls": {
            "type": "array",
            "description": "Information on stop required and onward calls are present. No previous call are available. (Empty)",
            "items": {
              "$ref": "#/definitions/PreviousCall"
            }
          },
          "monitoredCall": {
            "$ref": "#/definitions/MonitoredCall"
          },
          "onwardCalls": {
            "type": "array",
            "description": "Information on calls at the intermediate stops beyond the current stop, up to and including the DESTINATION. ",
            "items": {
              "$ref": "#/definitions/OnwardCall"
            }
          },
          "isCompleteStopSequence": {
            "type": "boolean",
            "description": "Whether the call sequence is simple, i.e. represents every call of the route and so can be used to replace a previous call sequence. "
          }
        }
      },
      "AbstractItem": {
        "type": "object",
        "description": "Empty.",
        "properties": {
          "recordedAtTime": {
            "type": "string",
            "format": "date-time",
            "description": "Time at which data was recorded. Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          }
        },
        "required": [
          "recordedAtTime"
        ]
      },
      "AbstractIdentifiedItemStructure": {
        "description": "Type for an Activity that can be referenced.",
        "allOf": [
          {
            "$ref": "#/definitions/AbstractItem"
          },
          {
            "type": "object",
            "properties": {
              "itemIdentifier": {
                "type": "string",
                "description": "uuid"
              }
            }
          }
        ]
      },
      "AbstractReferencingItemStructure": {
        "description": "Empty",
        "allOf": [
          {
            "$ref": "#/definitions/AbstractItem"
          },
          {
            "type": "object",
            "properties": {
              "itemRef": {
                "type": "string",
                "description": "Reference to an Activity Element of a delivery."
              }
            }
          }
        ]
      },
      "LineIdentityGroup": {
        "type": "object",
        "description": "Elements for identifying a LINE and DIRECTION.",
        "properties": {
          "lineRef": {
            "type": "string",
            "description": "Reference to a LINE."
          },
          "directionRef": {
            "type": "string",
            "description": "empty"
          }
        }
      },
      "StopVisitCancellationIdentityGroup": {
        "description": "External identifiers of Cancelled Stop Visit.",
        "allOf": [
          {
            "$ref": "#/definitions/LineIdentityGroup"
          },
          {
            "type": "object",
            "properties": {
              "monitoringRef": {
                "type": "string",
                "description": "Reference to a Stop Monitoring point at which visits happen"
              },
              "visitNumber": {
                "type": "integer",
                "description": "For JOURNEY PATTERNs that involve repeated visits by a VEHICLE to a stop, the VisitNumber is used to distinguish each separate visit."
              },
              "vehicleJourneyRef": {
                "$ref": "#/definitions/FramedVehicleJourneyRef"
              }
            }
          }
        ]
      },
      "OnwardCallExtension": {
        "type": "object",
        "properties": {
          "departureDelay": {
            "type": "string",
            "description": "Journey departure delay in minutes"
          },
          "arrivalDelay": {
            "type": "string",
            "description": "Journey arrival delay in minutes"
          },
          "stopExtraInfo": {
            "type": "object",
            "$ref": "#/definitions/StopExtraInfo"
          }
        }
      },
      "PreviousCallExtension": {
        "type": "object",
        "properties": {
          "departureDelay": {
            "type": "string",
            "description": "Journey departure delay in minutes"
          },
          "arrivalDelay": {
            "type": "string",
            "description": "Journey arrival delay in minutes"
          },
          "stopExtraInfo": {
            "type": "object",
            "$ref": "#/definitions/StopExtraInfo"
          },
          "arrivalStopAssignment": {
            "type": "object",
            "$ref": "#/definitions/StopAssignment"
          },
          "departureStopAssignment": {
            "type": "object",
            "$ref": "#/definitions/StopAssignment"
          }
        }
      },
      "ReplacementsAndSectoringExtension": {
        "type": "object",
        "properties": {
          "vehicle": {
            "type": "object",
            "$ref": "#/definitions/Vehicle"
          },
          "replacement": {
            "type": "object",
            "$ref": "#/definitions/VehicleReplacement"
          },
          "externalReplacement": {
            "type": "object",
            "$ref": "#/definitions/VehicleReplacement"
          }
        }
      },
      "Point": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "TNPNTS00000000000009"
          },
          "nameLong": {
            "type": "string",
            "example": "Metro Garibaldi FS"
          },
          "nameShort": {
            "type": "string",
            "example": "Garibaldi FS"
          }
        }
      },
      "TransportMode": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "bus"
          },
          "dsc": {
            "type": "string",
            "example": "string"
          }
        }
      },
      "VehicleReplacement": {
        "type": "object",
        "properties": {
          "vehicleJourneyId": {
            "type": "string"
          },
          "vehicleJourneyDataFrame": {
            "type": "string"
          },
          "vehicleJourneyName": {
            "type": "string"
          },
          "transportMode": {
            "$ref": "#/definitions/TransportMode"
          },
          "vehicleNumber": {
            "type": "string"
          },
          "stopPointReplacements": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/ReplacedStopPoint"
            }
          }
        }
      },
      "ReplacedVehicleJourney": {
        "type": "object",
        "properties": {
          "vehicleJourneyId": {
            "type": "string"
          },
          "vehicleJourneyDataFrame": {
            "type": "string"
          },
          "timetabledCallStart": {
            "type": "string"
          },
          "timetabledCallEnd": {
            "type": "string"
          },
          "serviceCategory": {
            "type": "string"
          },
          "serviceCategoryType": {
            "type": "string"
          },
          "operator": {
            "type": "string"
          }
        }
      },
      "ReplacedStopPoint": {
        "type": "object",
        "properties": {
          "stopPointId": {
            "$ref": "#/definitions/Point"
          },
          "sequenceNumber": {
            "type": "integer"
          },
          "replacementType": {
            "$ref": "#/definitions/ReplacementType"
          },
          "arrivalTime": {
            "type": "string",
            "format": "date-time",
            "example": "2018-03-07T14:33:54.839Z"
          },
          "departureTime": {
            "type": "string",
            "format": "date-time",
            "example": "2018-03-07T14:33:54.839Z"
          },
          "departurePlace": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/MultiLanguageDescription"
            }
          },
          "text": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/MultiLanguageDescription"
            }
          }
        }
      },
      "ReplacementType": {
        "type": "string",
        "enum": [
          "ARRIVAL",
          "DEPARTURE",
          "ARRIVALDEPARTURE"
        ]
      },
      "MultiLanguageDescription": {
        type: "object",
        "properties": {
          "text": {
            "type": "string"
          },
          "language": {
            "type": "string"
          }
        }
      },
      "Vehicle": {
        "type": "object",
        "properties": {
          "vehicleModel": {
            "description": "vehicle model ",
            "type": "string"
          },
          "vehicleModelDirection": {
            "description": "direction related to startingSector of the first wagon ",
            "type": "string",
            "enum": [
              "N",
              "S"
            ]
          },
          "vehicleElements": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/VehicleElement"
            }
          }
        }
      },
      "VehicleElementKindEnum": {
        "type": "string",
        "enum": [
          "locomotive",
          "wagon"
        ]
      },
      "VehicleElement": {
        "type": "object",
        "properties": {
          "transportReferenceId": {
            "description": "Unique identifier of the vehicle journey",
            "type": "string"
          },
          "departed": {
            "type": "boolean",
            "description": "True if vehicle element is gone"
          },
          "commercialName": {
            "description": "it is not  empty if passenger service is present",
            "type": "string"
          },
          "vehicleElementKind": {
            "$ref": "#/definitions/VehicleElementKindEnum"
          },
          "serviceFacilities": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/ServiceFacility"
            }
          },
          "sector": {
            "description": "index of the sector where vehicle element will stop",
            "type": "integer"
          },
          "position": {
            "description": "position of the wagon when counting locomoives and wagons from the start of the train",
            "type": "integer"
          },
          "commercialClass": {
            "type": "string"
          },
          "passengerService": {
            "type": "boolean"
          },
          "locomotiveType": {
            "description": "type of locomotive if vehicleElementKind is Locomotive, it could be empty",
            "type": "string"
          }
        }
      },
      "ServiceFacility": {
        "type": "object",
        "properties": {
          "serviceType": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "disabled": {
            "type": "boolean"
          }
        }
      },
      "MonitoredCallExtension": {
        "type": "object",
        "properties": {
          "departureDelay": {
            "type": "string",
            "description": "Journey departure delay in minutes"
          },
          "arrivalDelay": {
            "type": "string",
            "description": "Journey arrival delay in minutes"
          },
          "previousLinks": {
            "type": "array",
            "description": "Links ordered from this MonitoredCall to the previous MonitoredCall of the route.",
            "items": {
              "type": "string"
            }
          },
          "onwardLinks": {
            "type": "array",
            "description": "Links ordered from this MonitoredCall to the next MonitoredCall of the route.",
            "items": {
              "type": "string"
            }
          },
          "stopExtraInfo": {
            "type": "object",
            "$ref": "#/definitions/StopExtraInfo"
          }
        }
      },
      "MonitoredVehicleJourneyExtension": {
        "description": "Empty",
        "type": "object",
        "properties": {
          "orderedLinks": {
            "type": "array",
            "description": "Links ordered of the route.",
            "items": {
              "type": "string"
            }
          },
          "routeRef": {
            "type": "string",
            "description": "Unique identifier of the route."
          },
          "logicalVehicleCodes": {
            "type": "array",
            "description": "The id of the logical vehicle",
            "items": {
              "type": "string"
            }
          },
          "vehicleCodes": {
            "type": "array",
            "description": "The unique string that identifies the phisical vehicle",
            "items": {
              "type": "string",
              "minLength": 0,
              "maxLength": 255
            }
          },
          "registrationNumber": {
            "type": "string",
            "description": "Serial Number that uniquely identifies a Vehicle within the owner organization.",
            "example": "MATR_101",
            "minLength": 0,
            "maxLength": 255
          },
          "isService": {
            "type": "boolean",
            "description": "Whether the journey type is service or technical. Default false."
          },
          "usage": {
            "$ref": "#/definitions/UsageTypeEnum"
          },
          "dangerousGoods": {
            "type": "boolean",
            "description": "Whether journey carries dangerous goods"
          },
          "exceptionalGauging": {
            "type": "boolean",
            "description": "Whether journey carries exceptional Gauging"
          },
          "exceptionalLoad": {
            "type": "boolean",
            "description": "Whether journey carries exceptional Load"
          },
          "controlAction": {
            "type": "object",
            "$ref": "#/definitions/ControlAction"
          },
          "situations": {
            "type": "array",
            "description": "One or more Situations.",
            "items": {
              "$ref": "#/definitions/Situation"
            }
          },
          "serviceJourneyInterchange": {
            "type": "object",
            "$ref": "#/definitions/ServiceJourneyInterchange"
          },
          "contracts": {
            "type": "array",
            "description": "List of contracts associated with the monitored journey.",
            "items": {
              "$ref": "#/definitions/Contract"
            }
          }
        }
      },
      "Contract": {
        "type": "object",
        "description": "The contract associated with the journey.",
        "properties": {
          "contractId": {
            "type": "string",
            "description": "The unique string that identifies the Contract."
          },
          "contractDate": {
            "type": "string",
            "format": "date-time",
            "description": "The date and time of Contact. Date and time in [ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)."
          },
          "customerDisplayName": {
            "type": "string",
            "description": "The display name of the Customer."
          },
          "customerRef": {
            "type": "string",
            "description": "Reference to a Customer."
          }
        }
      },
      "StrictScopeEnum": {
        "type": "string",
        "description": "Involvement type.",
        "enum": [
          "related",
          "affected"
        ]
      },
      "SeverityEnum": {
        "type": "string",
        "enum": [
          "unknown",
          "verySlight",
          "slight",
          "normal",
          "severe",
          "verySevere",
          "noImpact"
        ],
        "default": "normal",
        "description": "Severity of the Situation. Corresponds to TPEG Pti26 severities:\n  * unknown - Unknown (pti26_0)\n  * verySlight - Very Slight (pti26_1)\n  * slight - Slight (pti26_2)\n  * normal - Normal (pti26_3)\n  * severe - Severe (pti26_4)\n  * verySevere - Very severe (pti26_5)\n  * noImpact - No impact (pti26_6)\n  * normal - Normal (pti26_255)"
      },
      "SituationStatusProgressEnum": {
        "type": "string",
        "enum": [
          "draft",
          "pendingApproval",
          "approvedDraft",
          "open",
          "published",
          "closing",
          "closed"
        ],
        "description": "Describes the Life Cycle status of the Situation. The values are based on TPEG pti32. The Progress status allows distributed workflow applications to coordinate their handling of live situations:\n  * draft - Content is being drafted\n  * pendingApproval - Content is pending approval\n  * approvedDraft - Content is approved\n  * open - Situation is open\n  * published - Situation is open and published\n  * closing - Situation is in the process of closing\n  * closed - Situation is closed\n\nThe following state transitions are allowed:\n  - draft -> pending approval or open\n  - pending approval -> draft or  approved draft\n  - approved draft -> open\n  - open -> closing or closed\n  - closing -> closed or open\n  - closed -> open\n\nIf the staus is \"open\", the Situation is processed and published to the specific IMS Kafka topic.\nNB: The cancelled Situation - in Progress closed - has to be Verification and Reality with the following values: Verification: unverified, Reality: unconfirmed."
      },
      "ReasonTypeEnum": {
        "type": "string",
        "enum": [
          "unknownReason",
          "miscellaneousReason",
          "personnelReason",
          "equipmentReason",
          "environmentReason",
          "undefinedReason"
        ],
        "description": "There are six main Reason types as described by TPEG Pti18. Allowed values:\n  * unknownReason - Unknown (pti18_0)\n  * miscellaneousReason - Miscellaneous event reason (pti18_1)\n  * personnelReason - Personnel event reason (pti18_2)\n  * equipmentReason - Equipment event reason (pti18_3)\n  * environmentReason - Environment event reason (pti18_4)\n  * undefinedReason - Undefined event reason (pti18_255)"
      },
      "SituationTypeEnum": {
        "type": "string",
        "enum": [
          "external",
          "transport",
          "vehicle",
          "crew",
          "traffic",
          "infomobility"
        ],
        "description": "Intended the competence scope of the Situation. Allowed values:\n  *  External – Situation domain of  external sources (i.e. civil protection, weather system)\n  *  Transport – Situation domain of Transport Management system\n  *  Vehicle - Situation domain of Vehicle Management system\n  *  Crew - Situation domain of Crew Management system\n  *  Traffic- Situation domain of Traffic Management system\n  *  Infomobility - Situation domain of Infomobility Management system"
      },
      "ServiceJourneyInterchange": {
        "type": "object",
        "description": "A planned SERVICE JOURNEY INTERCHANGE between two journeys.",
        "properties": {
          "interchangeCode": {
            "type": "string",
            "description": "Identifier of SERVICE JOURNEY INTERCHANGE."
          },
          "journeyMeeting": {
            "type": "boolean",
            "description": "Whether the SERVICE JOURNEY INTERCHANGE is a JOURNEY MEETING. Default is 'false'."
          },
          "interchangeJourneyRef": {
            "description": "A reference to the DATED VEHICLE JOURNEY (feeder/distributor based on feeder flag)",
            "$ref": "#/definitions/FramedVehicleJourneyRef"
          },
          "interchangeRole": {
            "$ref": "#/definitions/InterchangeRoleEnum"
          },
          "stopPointRef": {
            "type": "string",
            "description": "Identifier of Stop Point where the coincidence occurs."
          },
          "stopPointName": {
            "type": "string",
            "description": "Name of Stop Point where the coincidence occurs."
          },
          "visitNumber": {
            "type": "number",
            "description": "For JOURNEY PATTERNs that involve repeated visits by a VEHICLE to the same stop, the VisitNumber is used to distinguish each separate visit. Default is 1. Will be higher for routes that visit the same stop twice."
          }
        }
      },
      "InterchangeRoleEnum": {
        "type": "string",
        "enum": [
          "Feeder",
          "Distributor"
        ]
      },
      "UsageTypeEnum": {
        "type": "string",
        "enum": [
          "passenger",
          "freight"
        ]
      },
      "StopExtraInfo": {
        "type": "object",
        "properties": {
          "doorsOpenedTime": {
            "type": "string",
            "description": "Time at which VEHICLE doors were opened.",
            "format": "date-time"
          },
          "doorsClosedTime": {
            "type": "string",
            "description": "Time at which VEHICLE doors were closed.",
            "format": "date-time"
          },
          "numberOfAlighters": {
            "type": "integer",
            "description": "Number of passengers alighting."
          },
          "numberOfBoarders": {
            "type": "integer",
            "description": "Number of passengers boarding."
          },
          "occupancy": {
            "type": "boolean",
            "description": "Whether the VEHICLE is occupied."
          },
          "numberOfPassengersBefore": {
            "type": "number",
            "description": "Total number of passengers on board before stopping."
          },
          "numberOfPassengersAfter": {
            "type": "number",
            "description": "Total number of passengers on board after departing."
          }
        }
      }
    }
  };