/* eslint-disable max-lines */
import { type JsonSchema, JsonSchemaType, JsonSchemaVersion } from "aws-cdk-lib/aws-apigateway";

export const EpcMessageSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    type: JsonSchemaType.OBJECT,
    title: "EPCMessage",
    additionalProperties: false,
    properties: {
        EPCMessageHeader: {
            oneOf: [
                {
                    type: JsonSchemaType.NULL
                },
                {
                    ref: "#/definitions/EPCMessageHeaderType"
                }
            ]
        },
        EPCRequestBody: {
            oneOf: [
                {
                    type: JsonSchemaType.NULL
                },
                {
                    ref: "#/definitions/EPCAcknowledgeBodyType"
                },
                {
                    ref: "#/definitions/EPCCancelBodyType"
                },
                {
                    ref: "#/definitions/EPCReceiptBodyType"
                },
                {
                    ref: "#/definitions/EPCMessageEPCRequestBody"
                }
            ]
        }
    },
    definitions: {
        EPCMessageHeaderType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                ReplyURI: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SenderId: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SentTime: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                ShipMessageId: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ArrivalDeparture: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Authenticator: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/AuthenticatorType"
                        }
                    ]
                },
                SenderDuty: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CrewDutyType"
                        }
                    ]
                },
                JournalNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                MessageType: {
                    ref: "#/definitions/MessageTypeContentType"
                },
                SenderName: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/NameType"
                        }
                    ]
                },
                AuthenticatorName: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/NameType"
                        }
                    ]
                },
                ReportingSystem: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                RelayReportingSystem: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        type: JsonSchemaType.STRING
                    }
                },
                Version: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        AuthenticatorType: {
            allOf: [
                {
                    ref: "#/definitions/ContactInfoType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    properties: {
                        AuthenticationDate: {
                            type: JsonSchemaType.STRING,
                            format: "date-time"
                        },
                        AuthenticationDateSpecified: {
                            type: JsonSchemaType.BOOLEAN
                        },
                        AuthenticatorRoleCode: {
                            oneOf: [
                                {
                                    type: JsonSchemaType.NULL
                                },
                                {
                                    ref: "#/definitions/CrewDutyType"
                                }
                            ]
                        },
                        AuthenticatorLocation: {
                            oneOf: [
                                {
                                    type: JsonSchemaType.NULL
                                },
                                {
                                    ref: "#/definitions/LocationType"
                                }
                            ]
                        }
                    }
                }
            ]
        },
        CrewDutyType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Text: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Code: {
                    ref: "#/definitions/CrewDutyCodeContentType"
                },
                CodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        CrewDutyCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
                72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
                95, 96, 97, 98, 99, 100, 101, 102, 103
            ]
        },
        LocationType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Name: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CountryCode: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                CountryCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                FacilityName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                FacilityCode: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                GLN: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Position: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PositionType"
                        }
                    ]
                },
                Track: {
                    ref: "#/definitions/TrackContentType"
                },
                TrackSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                UNLoCode: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        CountryCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
                72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
                95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
                115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
                134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152,
                153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
                172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
                191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
                210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228,
                229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247,
                248
            ]
        },
        PositionType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Latitude: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                Longitude: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                }
            }
        },
        TrackContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2]
        },
        ContactInfoType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Company: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CompanyId: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ContactNumbers: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CommunicationNumberType"
                        }
                    ]
                },
                Person: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/NameType"
                        }
                    ]
                },
                Address: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PostalAddressType"
                        }
                    ]
                }
            }
        },
        CommunicationNumberType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                BusinessTelephone: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                EMail: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                HomeTelephone: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                MobileTelephone: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Telefax: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        NameType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                FamilyName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                GivenName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                MiddleName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        PostalAddressType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                CityName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CountrySubdivisionName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                LineFive: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                LineFour: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                LineOne: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                LineThree: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                LineTwo: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                PostCodeCode: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                PostOfficeBox: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                StreetName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                StreetNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CountryCode: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                CountryCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        MessageTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
        },
        EPCAcknowledgeBodyType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                EPCClearanceStatus: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/EPCClearanceStatusType"
                    }
                }
            }
        },
        EPCClearanceStatusType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Authority: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                RequestStatus: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/RequestStatusType"
                        }
                    ]
                },
                UsesSW: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        RequestStatusType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Comment: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Status: {
                    ref: "#/definitions/RequestStatusTypeContentType"
                }
            }
        },
        RequestStatusTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4]
        },
        EPCCancelBodyType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Cancel: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        EPCReceiptBodyType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                CurrentPortSecurityLevel: {
                    ref: "#/definitions/CurrentPortSecurityLevelType"
                },
                RequestErrorCode: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                RequestProcessed: {
                    type: JsonSchemaType.BOOLEAN
                },
                RequestStatus: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/RequestStatusTypeContentType"
                    }
                },
                EPCClearanceStatus: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/EPCClearanceStatusType"
                    }
                }
            }
        },
        CurrentPortSecurityLevelType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2]
        },
        EPCMessageEPCRequestBody: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Agent: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/AgentType"
                        }
                    ]
                },
                AirDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                AirDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                AnchorageArrival: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/AnchorageArrivalType"
                    }
                },
                AnchorageDeparture: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/AnchorageDepartureType"
                    }
                },
                ArrivalDraught: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ArrivalDraughtType"
                        }
                    ]
                },
                ATP: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ATPType"
                        }
                    ]
                },
                Authenticator: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/AuthenticatorType"
                        }
                    ]
                },
                BallastStatus: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/BallastStatusType"
                        }
                    ]
                },
                Beam: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                BeamSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                BerthArrival: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/BerthArrivalType"
                    }
                },
                BerthDeparture: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/BerthDepartureType"
                    }
                },
                BulkLoadUnloadData: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/BulkLoadUnloadDataType"
                        }
                    ]
                },
                CallPurpose: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/CallPurposeType"
                    }
                },
                CargoData: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CargoDataType"
                        }
                    ]
                },
                CargoOverview: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Company: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CompanyType"
                        }
                    ]
                },
                CrewList: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/CrewMemberDataType"
                    }
                },
                CSO: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CompanySecurityOfficerType"
                        }
                    ]
                },
                CurrentShipSecurityLevel: {
                    ref: "#/definitions/CurrentPortSecurityLevelType"
                },
                CurrentShipSecurityLevelSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                DangerousGoodsCargoIndicator: {
                    type: JsonSchemaType.BOOLEAN
                },
                DangerousGoodsCargoIndicatorSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                DeadWeight: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                DeadWeightSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                DepartureDraught: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/DepartureDraughtType"
                        }
                    ]
                },
                DoubleBottomContent: {
                    ref: "#/definitions/DoubleBottomContentType"
                },
                DoubleBottomContentSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                DutiableCrewEffects: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/CrewEffectItemType"
                    }
                },
                ETP: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ETPType"
                        }
                    ]
                },
                GeneralDescriptionOfDG: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/DGInfoType"
                    }
                },
                GeneralRemark: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                GrossTonnage: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                GrossTonnageSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                HasSecurityPlan: {
                    type: JsonSchemaType.BOOLEAN
                },
                HasSecurityPlanSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                HealthData: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/HealthDataType"
                        }
                    ]
                },
                IceClass: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/IceClassType"
                        }
                    ]
                },
                INFClassContent: {
                    ref: "#/definitions/INFClassContentType"
                },
                INFClassContentSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                InmarsatCallNumber: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/InmarsatCallNumberType"
                        }
                    ]
                },
                ISSCertificate: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CertificateType"
                        }
                    ]
                },
                ISSCertificateStatus: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ISSCertificateStatusType"
                        }
                    ]
                },
                LastPortOfCall: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/LastPortOfCallType"
                        }
                    ]
                },
                LengthOverall: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                LengthOverallSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NavigationalStatus: {
                    ref: "#/definitions/NavigationalStatusContentType"
                },
                NavigationalStatusSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NetTonnage: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                NetTonnageSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NextPortOfCall: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/NextPortOfCallType"
                        }
                    ]
                },
                NextReportTime: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                NextReportTimeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                OBOLoadUnloadData: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/OBOLoadUnloadDataType"
                        }
                    ]
                },
                OtherServiceRequest: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/OtherServiceRequestType"
                    }
                },
                PassengerList: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/PassengerDataType"
                    }
                },
                PeriodOfStay: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                PersonsOnboard: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PersonsOnboardNumberType"
                        }
                    ]
                },
                PortCallList: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/ShipToPortActivityType"
                    }
                },
                PortOfArrival: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortOfArrivalType"
                        }
                    ]
                },
                PortOfDeparture: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortOfDepartureType"
                        }
                    ]
                },
                RadioCommunications: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                RegistryCertificate: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CertificateType"
                        }
                    ]
                },
                ReportingEvent: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/LocationCallType"
                        }
                    ]
                },
                ROBBunkers: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/ROBBunkersType"
                    }
                },
                SecurityOtherMattersToReport: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ShipClass: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ShipClassType"
                        }
                    ]
                },
                ShipDefects: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ShipDefectsType"
                        }
                    ]
                },
                ShipID: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ShipIDType"
                        }
                    ]
                },
                ShipSanitationControlCertificate: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CertificateType"
                        }
                    ]
                },
                ShipSanitationControlExemptionCertificate: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CertificateType"
                        }
                    ]
                },
                ShipStatus: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ShipStatusType"
                        }
                    ]
                },
                ShipStore: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/ShipStoreItemType"
                    }
                },
                ShipToShipActivityList: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/ShipToShipActivityType"
                    }
                },
                ShipType: {
                    ref: "#/definitions/ShipTypeContentType"
                },
                ShipTypeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SummerDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                SummerDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                VoyageDescription: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/VoyageDescriptionItemType"
                    }
                },
                VoyageEvent: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/VoyageEventType"
                    }
                },
                VoyageNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                WasteDisposalRequirements: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                WasteInformation: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/WasteInformationType"
                        }
                    ]
                },
                WayPointList: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/WaypointType"
                    }
                },
                WeatherInformation: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/WeatherInformationType"
                        }
                    ]
                }
            }
        },
        AgentType: {
            allOf: [
                {
                    ref: "#/definitions/ContactInfoType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        AnchorageArrivalType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        LocationCallType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                ArrivalTime: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/DateTimeType"
                    }
                },
                DepartureTime: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/DateTimeType"
                    }
                },
                Location: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/LocationType"
                        }
                    ]
                }
            }
        },
        DateTimeType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                DateTime: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                TimeType: {
                    ref: "#/definitions/TimeTypeContentType"
                },
                TimeTypeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        TimeTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3]
        },
        AnchorageDepartureType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        ArrivalDraughtType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                AftDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                AftDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ForeDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                ForeDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                MidShipDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                MidShipDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        ATPType: {
            allOf: [
                {
                    ref: "#/definitions/DateTimeType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        BallastStatusType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                IsClean: {
                    type: JsonSchemaType.BOOLEAN
                },
                IsCleanSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Remarks: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        BerthArrivalType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    properties: {
                        BerthType: {
                            ref: "#/definitions/BerthTypeContentType"
                        },
                        BerthTypeSpecified: {
                            type: JsonSchemaType.BOOLEAN
                        }
                    }
                }
            ]
        },
        BerthTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3]
        },
        BerthDepartureType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    properties: {
                        BerthType: {
                            ref: "#/definitions/BerthTypeContentType"
                        },
                        BerthTypeSpecified: {
                            type: JsonSchemaType.BOOLEAN
                        }
                    }
                }
            ]
        },
        BulkLoadUnloadDataType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                AccommodationLadder: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CargoHandlingGear: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CargoType: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ChecklistCompleted: {
                    type: JsonSchemaType.BOOLEAN
                },
                ChecklistCompletedSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                DistanceSideToHatch: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                DistanceSideToHatchSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                DistanceWaterlineToHatch: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                DistanceWaterlineToHatchSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                IsLoading: {
                    type: JsonSchemaType.BOOLEAN
                },
                IsLoadingSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                LengthOfCargoArea: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                LengthOfCargoAreaSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                MooringLines: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Remarks: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                RequiredRepairs: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SpecificInstructions: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                TimeForBallasting: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                TotalQuantity: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/BulkCargoPartType"
                        }
                    ]
                },
                OperationPlan: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/BulkCargoListType"
                    }
                }
            }
        },
        BulkCargoPartType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Hatch: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Quantity: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                }
            }
        },
        MeasureType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Content: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                UnitCode: {
                    ref: "#/definitions/MeasurementUnitContentType"
                }
            }
        },
        MeasurementUnitContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
                72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
                95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
                115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
                134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152,
                153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
                172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
                191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
                210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228,
                229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247,
                248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266,
                267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285,
                286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304,
                305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323,
                324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342,
                343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361,
                362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380,
                381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399,
                400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418,
                419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437,
                438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456,
                457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475,
                476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494,
                495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513,
                514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532,
                533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551,
                552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570,
                571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589,
                590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608,
                609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627,
                628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646,
                647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665,
                666, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684,
                685, 686, 687, 688, 689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703,
                704, 705, 706, 707, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720, 721, 722,
                723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736, 737, 738, 739, 740, 741,
                742, 743, 744, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760,
                761, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779,
                780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798,
                799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 816, 817,
                818, 819, 820, 821, 822, 823, 824, 825, 826, 827, 828, 829, 830, 831, 832, 833, 834, 835, 836,
                837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 848, 849, 850, 851, 852, 853, 854, 855,
                856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870, 871, 872, 873, 874,
                875, 876, 877, 878, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893,
                894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912,
                913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930, 931,
                932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950,
                951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962, 963, 964, 965, 966, 967, 968, 969,
                970, 971, 972, 973, 974, 975, 976, 977, 978, 979, 980, 981, 982, 983, 984, 985, 986, 987, 988,
                989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005,
                1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020,
                1021, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033, 1034, 1035,
                1036, 1037, 1038, 1039, 1040, 1041, 1042, 1043, 1044, 1045, 1046, 1047, 1048, 1049, 1050,
                1051, 1052, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1060, 1061, 1062, 1063, 1064, 1065,
                1066, 1067, 1068, 1069, 1070, 1071, 1072, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080,
                1081, 1082, 1083, 1084, 1085, 1086, 1087, 1088, 1089, 1090, 1091, 1092, 1093, 1094, 1095,
                1096, 1097, 1098, 1099, 1100, 1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109, 1110,
                1111, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122, 1123, 1124, 1125,
                1126, 1127, 1128, 1129, 1130, 1131, 1132, 1133, 1134, 1135, 1136, 1137, 1138, 1139, 1140,
                1141, 1142, 1143, 1144, 1145, 1146, 1147, 1148, 1149, 1150, 1151, 1152, 1153, 1154, 1155,
                1156, 1157, 1158, 1159, 1160, 1161, 1162, 1163, 1164, 1165, 1166, 1167, 1168, 1169, 1170,
                1171, 1172, 1173, 1174, 1175, 1176, 1177, 1178, 1179, 1180, 1181, 1182, 1183, 1184, 1185,
                1186, 1187, 1188, 1189, 1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1198, 1199, 1200,
                1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209, 1210, 1211, 1212, 1213, 1214, 1215,
                1216, 1217, 1218, 1219, 1220, 1221, 1222, 1223, 1224, 1225, 1226, 1227, 1228, 1229, 1230,
                1231, 1232, 1233, 1234, 1235, 1236, 1237, 1238, 1239, 1240, 1241, 1242, 1243, 1244, 1245,
                1246, 1247, 1248, 1249, 1250, 1251, 1252, 1253, 1254, 1255, 1256, 1257, 1258, 1259, 1260,
                1261, 1262, 1263, 1264, 1265, 1266, 1267, 1268, 1269, 1270, 1271, 1272, 1273, 1274, 1275,
                1276, 1277, 1278, 1279, 1280, 1281, 1282, 1283, 1284, 1285, 1286, 1287, 1288, 1289, 1290,
                1291, 1292, 1293, 1294, 1295, 1296, 1297, 1298, 1299, 1300, 1301, 1302, 1303, 1304, 1305,
                1306, 1307, 1308, 1309, 1310, 1311, 1312, 1313, 1314, 1315, 1316, 1317, 1318, 1319, 1320,
                1321, 1322, 1323, 1324, 1325, 1326, 1327, 1328, 1329, 1330, 1331, 1332, 1333, 1334, 1335,
                1336, 1337, 1338, 1339, 1340, 1341, 1342, 1343, 1344, 1345, 1346, 1347, 1348, 1349, 1350,
                1351, 1352, 1353, 1354, 1355, 1356, 1357, 1358, 1359, 1360, 1361, 1362, 1363, 1364, 1365,
                1366, 1367, 1368, 1369, 1370, 1371, 1372, 1373, 1374, 1375, 1376, 1377, 1378, 1379
            ]
        },
        BulkCargoListType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Stage: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Unit: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/BulkCargoPartType"
                    }
                }
            }
        },
        CallPurposeType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                CallPurposeText: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CallPurposeCode: {
                    ref: "#/definitions/CallPurposeCodeContentType"
                },
                CallPurposeCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        CallPurposeCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
        },
        CargoDataType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Consignment: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/ConsignmentType"
                    }
                },
                TransportEquipment: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/TransportEquipmentType"
                    }
                }
            }
        },
        ConsignmentType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                ConsignmentNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                DangerousGoodsShippersReferenceNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                NumberOfItems: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NumberOfItemsSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                TransportDocumentId: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CargoItem: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/CargoItemType"
                    }
                },
                PortOfLoading: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                },
                PortOfDischarge: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                }
            }
        },
        CargoItemType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                ItemNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                MarksAndNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                NoOfPackages: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NoOfPackagesSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NoOfUnits: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NoOfUnitsSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SealNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                TransportDocumentId: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                VehicleIdentificationNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CargoType: {
                    ref: "#/definitions/CargoTypeContentType"
                },
                CargoTypeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Consignee: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ContactInfoType"
                        }
                    ]
                },
                GoodsType: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/GoodsTypeType"
                        }
                    ]
                },
                LostDGDetails: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/LostCargoDetailsType"
                        }
                    ]
                },
                Quantity: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                GrossWeight: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                GrossVolume: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                PackageType: {
                    ref: "#/definitions/PackageTypeContentType"
                },
                PackageTypeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SpecialCargoDetails: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/SpecialCargoDetailsType"
                    }
                },
                TransportEquipment: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/TransportEquipmentType"
                    }
                }
            }
        },
        CargoTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        GoodsTypeType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Description: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                HSCode: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        LostCargoDetailsType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                CauseOfLoss: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                EstimatedArea: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                EstimatedAreaSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                EstimatedMovement: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                GoodsCondition: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                LossContinuing: {
                    type: JsonSchemaType.BOOLEAN
                },
                LostGoodsStatus: {
                    ref: "#/definitions/LostGoodsStatusContentType"
                },
                LostGoodsStatusSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                EstimatedGoodsLost: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                }
            }
        },
        LostGoodsStatusContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1]
        },
        PackageTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
                72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
                95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
                115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
                134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152,
                153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
                172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
                191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
                210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228,
                229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247,
                248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266,
                267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285,
                286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304,
                305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323,
                324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342,
                343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361,
                362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380,
                381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398
            ]
        },
        SpecialCargoDetailsType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Comment: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                NoOfPackages: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NoOfPackagesSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                VehicleIdentificationNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SafetyDataSheetReference: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/AttachmentType"
                        }
                    ]
                },
                CargoInformationHolder: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ContactInfoType"
                        }
                    ]
                },
                Consignor: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ContactInfoType"
                        }
                    ]
                },
                Packer: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ContactInfoType"
                        }
                    ]
                },
                DGSafetyDataSheet: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/DGSafetyDataSheetType"
                        }
                    ]
                },
                DangerousGoodsPackageType: {
                    ref: "#/definitions/PackageTypeContentType"
                },
                DangerousGoodsPackageTypeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                OriginalPortOfShipment: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                }
            }
        },
        AttachmentType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Description: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                URI: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        DGSafetyDataSheetType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                AdditionalInformation: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ProperShippingName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SegregationInformation: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                TechnicalSpecification: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                UNNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                DGClassification: {
                    ref: "#/definitions/DGClassificationContentType"
                },
                DGClassificationSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                EmergencyInstruction: {
                    ref: "#/definitions/EmergencyInstructionContentType"
                },
                EmergencyInstructionSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                MARPOLPollutionCode: {
                    ref: "#/definitions/MARPOLPollutionCodeContentType"
                },
                MARPOLPollutionCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Mass: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                Volume: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                FlashPoint: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                PackingGroup: {
                    ref: "#/definitions/PackingGroupCodeContentType"
                },
                UNClass: {
                    ref: "#/definitions/UNHazardClassContentType"
                },
                UNClassSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SubsidiaryRisks: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/UNHazardClassContentType"
                    }
                }
            }
        },
        DGClassificationContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4]
        },
        EmergencyInstructionContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51
            ]
        },
        MARPOLPollutionCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4]
        },
        PackingGroupCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3]
        },
        UNHazardClassContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51, 52, 53, 54, 55
            ]
        },
        PortType: {
            allOf: [
                {
                    ref: "#/definitions/LocationType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        TransportEquipmentType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                MarksAndNumbers: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                OnboardLocation: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        CompanyType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                IMOCompanyId: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Contact: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ContactInfoType"
                        }
                    ]
                },
                Organisation: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/OrganisationType"
                        }
                    ]
                }
            }
        },
        OrganisationType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Name: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                RegistrationDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                RegistrationDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                TaxIdentifier: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        type: JsonSchemaType.STRING
                    }
                },
                RegistrationCountryCode: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                RegistrationCountryCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        CrewMemberDataType: {
            allOf: [
                {
                    ref: "#/definitions/PersonOnboardType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    properties: {
                        Duty: {
                            oneOf: [
                                {
                                    type: JsonSchemaType.NULL
                                },
                                {
                                    ref: "#/definitions/CrewDutyType"
                                }
                            ]
                        }
                    }
                }
            ]
        },
        PersonOnboardType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                DateOfBirth: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                DateOfBirthSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                DebarkationDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                DebarkationDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                EmbarkationDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                EmbarkationDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                PlaceOfBirth: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Remarks: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Transit: {
                    type: JsonSchemaType.BOOLEAN
                },
                TransitSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                CountryOfBirth: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                CountryOfBirthSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Nationality: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                NationalitySpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                CountryOfResidence: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                CountryOfResidenceSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Gender: {
                    ref: "#/definitions/GenderContentType"
                },
                GenderSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Name: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/NameType"
                        }
                    ]
                },
                PersonHealthParticulars: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PersonHealthParticularsType"
                        }
                    ]
                },
                PersonIdDocument: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/PersonIdDocumentType"
                    }
                },
                VisaNumber: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/PersonIdDocumentType"
                    }
                },
                PersonReference: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                EmbarkationPort: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                },
                DebarkationPort: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                },
                HomeAddress: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PostalAddressType"
                        }
                    ]
                },
                VisitAddress: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PostalAddressType"
                        }
                    ]
                }
            }
        },
        GenderContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3]
        },
        PersonHealthParticularsType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Comments: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ReportedToPortMedical: {
                    type: JsonSchemaType.BOOLEAN
                },
                ReportedToPortMedicalSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SymptomsDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                SymptomsDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Treatment: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                CaseDisposal: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CaseOfDisposalType"
                        }
                    ]
                },
                IllnessCode: {
                    ref: "#/definitions/IllnessCodeContentType"
                },
                IllnessCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        CaseOfDisposalType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                CaseDisposalCode: {
                    ref: "#/definitions/CaseDisposalCodeContentType"
                },
                CaseDisposalCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                HealthStateCode: {
                    ref: "#/definitions/HealthStateCodeContentType"
                },
                HealthStateCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                LocationOfEvaculation: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                }
            }
        },
        CaseDisposalCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2]
        },
        HealthStateCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2]
        },
        IllnessCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
            ]
        },
        PersonIdDocumentType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                ExpirationDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                ExpirationDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                IdNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                IssueDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                IssueDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                IssuingCountry: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                IdDocument: {
                    ref: "#/definitions/IdDocumentCodeContentType"
                },
                IdDocumentSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        IdDocumentCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
                72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
                95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
                115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
                134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152,
                153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
                172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
                191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
                210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228,
                229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247,
                248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266,
                267, 268, 269, 270, 271, 272, 273, 274,

                275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293,
                294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312,
                313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331,
                332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350,
                351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369,
                370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388,
                389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407,
                408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426,
                427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445,
                446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464,
                465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483,
                484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502,
                503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521,
                522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540,
                541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559,
                560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578,
                579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597,
                598, 599, 600, 601, 602
            ]
        },
        CompanySecurityOfficerType: {
            allOf: [
                {
                    ref: "#/definitions/ContactInfoType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        DepartureDraughtType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                AftDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                AftDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ForeDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                ForeDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                MidShipDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                MidShipDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        DoubleBottomContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2]
        },
        CrewEffectItemType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                EffectDescription: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SequenceNumber: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SequenceNumberSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                CrewEffectItemCode: {
                    ref: "#/definitions/CrewEffectCodeContentType"
                },
                CrewEffectItemCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Measurement: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                CrewReference: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        CrewEffectCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        },
        ETPType: {
            allOf: [
                {
                    ref: "#/definitions/DateTimeType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        DGInfoType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Description: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Remarks: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                UNNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                MARPOLCode: {
                    ref: "#/definitions/MARPOLPollutionCodeContentType"
                },
                MARPOLCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Measure: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                UNHazardClass: {
                    ref: "#/definitions/UNHazardClassContentType"
                },
                UNHazardClassSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        HealthDataType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                DiseaseOnBoard: {
                    type: JsonSchemaType.BOOLEAN
                },
                DiseaseOnBoardSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                IllPersonsGreaterThanExpected: {
                    type: JsonSchemaType.BOOLEAN
                },
                IllPersonsGreaterThanExpectedSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                IllPersonsNow: {
                    type: JsonSchemaType.BOOLEAN
                },
                IllPersonsNowSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                InfectionConditionOnBoard: {
                    type: JsonSchemaType.BOOLEAN
                },
                InfectionConditionOnBoardSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                MedicalConsulted: {
                    type: JsonSchemaType.BOOLEAN
                },
                MedicalConsultedSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NumberOfDeaths: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NumberOfDeathsSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NumberOfIllPersons: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NumberOfIllPersonsSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                PersonDied: {
                    type: JsonSchemaType.BOOLEAN
                },
                PersonDiedSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ReInspectionRequired: {
                    type: JsonSchemaType.BOOLEAN
                },
                ReInspectionRequiredSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SanitaryMeasureApplied: {
                    type: JsonSchemaType.BOOLEAN
                },
                SanitaryMeasureAppliedSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SickAnimal: {
                    type: JsonSchemaType.BOOLEAN
                },
                SickAnimalSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                StowawaysFound: {
                    type: JsonSchemaType.BOOLEAN
                },
                StowawaysFoundSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ValidShipSanitationControlCertificate: {
                    type: JsonSchemaType.BOOLEAN
                },
                ValidShipSanitationControlCertificateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ValidShipSanitationControlExemptionCertificate: {
                    type: JsonSchemaType.BOOLEAN
                },
                ValidShipSanitationControlExemptionCertificateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                VisitedInfectedArea: {
                    type: JsonSchemaType.BOOLEAN
                },
                VisitedInfectedAreaSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ShipSanitationControlExemptionCertificate: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CertificateType"
                        }
                    ]
                },
                ShipSanitationControlCertificate: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CertificateType"
                        }
                    ]
                },
                LocationStowawaysJoinedShip: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/LocationType"
                    }
                },
                SanitaryMeasure: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/SanitaryMeasureType"
                    }
                },
                CallInInfectedArea: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/ShipToPortActivityType"
                    }
                },
                LastPortCalls: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/ShipToPortActivityType"
                    }
                }
            }
        },
        CertificateType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                CertificateNumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Comment: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ExpiryDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                ExpiryDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ExtendedUntil: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                ExtendedUntilSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                IssueDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                IssueDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                LastEndorsementDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                LastEndorsementDateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Name: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Restrictions: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Code: {
                    ref: "#/definitions/CertificateCodeContentType"
                },
                CodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                IssuerType: {
                    ref: "#/definitions/CertificateIssuerTypeContentType"
                },
                IssuerTypeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                CertificateStatus: {
                    ref: "#/definitions/CertificateStatusContentType"
                },
                Issuer: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/OrganisationType"
                        }
                    ]
                },
                IsssuerLocation: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                },
                IssuerLocationCode: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        CertificateCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39
            ]
        },
        CertificateIssuerTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4]
        },
        CertificateStatusContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4]
        },
        SanitaryMeasureType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Date: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                DateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                LocationOnBoard: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SanitaryMeasureCode: {
                    ref: "#/definitions/SanitaryMeasureCodeContentType"
                },
                SanitaryMeasureCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        SanitaryMeasureCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4]
        },
        ShipToPortActivityType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                FromDateTime: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                FromDateTimeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SequenceNumber: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SequenceNumberSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ToDateTime: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                ToDateTimeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                PortSecurityLevel: {
                    ref: "#/definitions/CurrentPortSecurityLevelType"
                },
                PortSecurityLevelSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Port: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                },
                AdditionalSecurityMeasure: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/SecurityMeasureType"
                    }
                }
            }
        },
        SecurityMeasureType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Description: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Code: {
                    ref: "#/definitions/SecurityMeasureCodeContentType"
                },
                CodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        SecurityMeasureCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7]
        },
        IceClassType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Comment: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                BalticIceClass: {
                    ref: "#/definitions/IceClassBalticContentType"
                },
                BalticIceClassSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                PolarClass: {
                    ref: "#/definitions/PolarClassContentType"
                },
                PolarClassSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        IceClassBalticContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4]
        },
        PolarClassContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6]
        },
        INFClassContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3]
        },
        InmarsatCallNumberType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Alternative: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Inmarsat: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        ISSCertificateStatusType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                ISSCertificateStatusReasonNotValid: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ISSCStatus: {
                    type: JsonSchemaType.BOOLEAN
                },
                ISSCStatusSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ISSCertificateStatusReasonNotValidCode: {
                    ref: "#/definitions/ISSCertificateStatusReasonNotValidCodeContentType"
                },
                ISSCertificateStatusReasonNotValidCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        ISSCertificateStatusReasonNotValidCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7]
        },
        LastPortOfCallType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        NavigationalStatusContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8]
        },
        NextPortOfCallType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        OBOLoadUnloadDataType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                LastOilCargoDate: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                PrecedingCargo1: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                PrecedingCargo2: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                PrecedingCargo3: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SlopTankStatus: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                GasFreeCertificate: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/CertificateType"
                        }
                    ]
                },
                LastOilCargoPort: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                }
            }
        },
        OtherServiceRequestType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Description: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ServiceType: {
                    ref: "#/definitions/OtherServiceContentType"
                }
            }
        },
        OtherServiceContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7]
        },
        PassengerDataType: {
            allOf: [
                {
                    ref: "#/definitions/PersonOnboardType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        PersonsOnboardNumberType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Crew: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                CrewSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NumberOfMedicalPersonsOnboard: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NumberOfMedicalPersonsOnboardSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NumberOfPersonsOnboard: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                NumberOfPersonsOnboardSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Passengers: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                PassengersSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        PortOfArrivalType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        PortOfDepartureType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        ROBBunkersType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                RemainOnBoard: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                RemainOnBoardSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Remarks: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                BunkersType: {
                    ref: "#/definitions/BunkersTypeContentType"
                },
                BunkersTypeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        BunkersTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        ShipClassType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Notation: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SocietyName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SocietyCode: {
                    ref: "#/definitions/ClassSocietyContentType"
                },
                SocietyCodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Country: {
                    ref: "#/definitions/CountryCodeContentType"
                },
                CountrySpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        ClassSocietyContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45
            ]
        },
        ShipDefectsType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                AbilityToTransferCargoBallastFuel: {
                    type: JsonSchemaType.BOOLEAN
                },
                AbilityToTransferCargoBallastFuelSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                CargoHandling: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Commuication: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                HullIntegrity: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Maneuvrability: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Mooring: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Navigation: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Other: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                }
            }
        },
        ShipIDType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                CallSign: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Comment: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                IMONumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                MMSINumber: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ShipName: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                RegistrationPort: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/RegistrationPortType"
                        }
                    ]
                }
            }
        },
        RegistrationPortType: {
            allOf: [
                {
                    ref: "#/definitions/PortType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        ShipStatusType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Course: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                CourseSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                PilotOnboard: {
                    type: JsonSchemaType.BOOLEAN
                },
                PilotOnboardSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                PresentDraught: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                PresentDraughtSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Speed: {
                    type: JsonSchemaType.NUMBER,
                    format: "decimal"
                },
                SpeedSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                NavigationalStatus: {
                    ref: "#/definitions/NavigationalStatusContentType"
                },
                NavigationalStatusSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        ShipStoreItemType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Description: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                LocationOfStorage: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SequenceNumber: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SequenceNumberSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Measurement: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                Code: {
                    ref: "#/definitions/ShipStoreItemCodeContentType"
                },
                CodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        ShipStoreItemCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
        },
        ShipToShipActivityType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Activity: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                FromDateTime: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                FromDateTimeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SequenceNumber: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SequenceNumberSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                ToDateTime: {
                    type: JsonSchemaType.STRING,
                    format: "date-time"
                },
                ToDateTimeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Location: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/LocationType"
                        }
                    ]
                },
                ShipSecurityMeasure: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/SecurityMeasureType"
                    }
                },
                Code: {
                    ref: "#/definitions/ShipToShipActivityCodeContentType"
                },
                CodeSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        },
        ShipToShipActivityCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
        },
        ShipTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
                49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
                72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89
            ]
        },
        VoyageDescriptionItemType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Load: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Unload: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                ETA: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/DateTimeType"
                        }
                    ]
                },
                Port: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                }
            }
        },
        VoyageEventType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false,
                    properties: {
                        EventType: {
                            ref: "#/definitions/VoyageEventTypeContentType"
                        },
                        EventTypeSpecified: {
                            type: JsonSchemaType.BOOLEAN
                        }
                    }
                }
            ]
        },
        VoyageEventTypeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2]
        },
        WasteInformationType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Comment: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                PointOfContact: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/ContactInfoType"
                        }
                    ]
                },
                LastPortDelivered: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/LocationCallType"
                        }
                    ]
                },
                NextPortToDeliver: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                },
                WasteDeliveryStatus: {
                    ref: "#/definitions/WasteDeliveryStatusContentType"
                },
                WasteDeliveryStatusSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                WasteDisposalInformation: {
                    type: [JsonSchemaType.ARRAY, JsonSchemaType.NULL],
                    items: {
                        ref: "#/definitions/WasteDisposalInformationType"
                    }
                }
            }
        },
        WasteDeliveryStatusContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1]
        },
        WasteDisposalInformationType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                EstimatedGenerated: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                MaxStorage: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                RetainedOnboard: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                ToBeDelivered: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/MeasureType"
                        }
                    ]
                },
                DisposedOfInPort: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/PortType"
                        }
                    ]
                },
                WasteType: {
                    oneOf: [
                        {
                            type: JsonSchemaType.NULL
                        },
                        {
                            ref: "#/definitions/WasteTypeType"
                        }
                    ]
                }
            }
        },
        WasteTypeType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Description: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                Code: {
                    ref: "#/definitions/WasteTypeCodeContentType"
                }
            }
        },
        WasteTypeCodeContentType: {
            type: JsonSchemaType.INTEGER,
            description: "",
            enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
        },
        WaypointType: {
            allOf: [
                {
                    ref: "#/definitions/LocationCallType"
                },
                {
                    type: JsonSchemaType.OBJECT,
                    additionalProperties: false
                }
            ]
        },
        WeatherInformationType: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                Remarks: {
                    type: [JsonSchemaType.NULL, JsonSchemaType.STRING]
                },
                SeaState: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SeaStateSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SeaStateDirection: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SeaStateDirectionSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                Swell: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SwellSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                SwellDirection: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                SwellDirectionSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                WindDirection: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                WindDirectionSpecified: {
                    type: JsonSchemaType.BOOLEAN
                },
                WindForce: {
                    type: JsonSchemaType.INTEGER,
                    format: "int32"
                },
                WindForceSpecified: {
                    type: JsonSchemaType.BOOLEAN
                }
            }
        }
    }
};
