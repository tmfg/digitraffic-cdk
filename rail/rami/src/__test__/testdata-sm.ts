export const validMessageUnknownTrackAndDelay = {
	"headers": {
		"e2eId": "c05645ec-fde1-4ae4-8384-d7ae632a90f0",
		"eventType": "StopMonitoringMessage",
		"organisation": "AlmavivA",
		"recordedAtTime": "2024-06-19T11:52:26Z",
		"source": "Pis.InfomobilityOperation"
	},
	"payload": {
		"monitoredStopVisits": [
			{
				"itemIdentifier": "5c690643-fb7e-48e8-9673-e9df9922cbc3",
				"monitoredVehicleJourney": {
					"dataSource": "RAMI",
					"framedVehicleJourneyRef": {
						"dataFrameRef": "06/19/2024 00:00:00",
						"datedVehicleJourneyRef": "108122"
					},
					"isCompleteStopSequence": false,
					"lineRef": "A",
					"monitored": true,
					"monitoredCall": {
						"aimedArrivalTime": "2024-06-19T11:57:00",
						"aimedDepartureTime": "2024-06-19T11:58:00",
						"arrivalBoardingActivity": "alighting",
						"arrivalStatus": "arrived",
						"arrivalStopAssignment": {
							"aimedQuayName": "10",
							"aimedQuayRef": "QUAYYY00000000001250"
						},
						"departureBoardingActivity": "boarding",
						"departureStatus": "departed",
						"departureStopAssignment": {
							"aimedQuayName": "10",
							"aimedQuayRef": "QUAYYY00000000001250"
						},
						"order": 7,
						"stopPointName": "Pasila",
						"stopPointRef": "PSL",
						"visitNumber": 1
					},
					"onwardCalls": [
						{
							"aimedArrivalTime": "2024-06-19T12:03:00",
							"arrivalBoardingActivity": "alighting",
							"arrivalStatus": "noReport",
							"arrivalStopAssignment": {
								"actualQuayName": "19",
								"actualQuayRef": "QUAYYY00000000000092",
								"aimedQuayName": "19",
								"aimedQuayRef": "QUAYYY00000000000092",
								"expectedQuayName": "19",
								"expectedQuayRef": "QUAYYY00000000000092"
							},
							"departureBoardingActivity": "boarding",
							"departureStopAssignment": {
							},
							"order": 8,
							"stopPointName": "Helsinki",
							"stopPointRef": "HKI",
							"timingPoint": false,
							"vehicleAtStop": true,
							"visitNumber": 1
						}
					],
					"productCategoryRef": "HL",
					"publishedLineName": "A",
					"vehicleJourneyName": "20240619108122",
					"vehicleModeName": "RAIL"
				},
				"monitoringRef": "PSL",
				"recordedAtTime": "2024-06-19T11:52:26Z"
			}
		]
	}
}

export const validMessage2 = {
    "headers": {
        "e2eId": "1c8b969d-1eac-4019-bb60-93b7ed81ebd4",
        "organisation": "AlmavivA",
        "source": "Pis.InfomobilityOperation",
        "eventType": "StopMonitoringMessage",
        "recordedAtTime": "2024-03-19T13:43:27Z"
    },
    "payload": {
        "monitoredStopVisits": [{
                "monitoringRef": "VSL",
                "monitoredVehicleJourney": {
                    "vehicleModeName": "RAIL",
                    "productCategoryRef": "HDM",
                    "vehicleJourneyName": "20240319100762",
                    "dataSource": "RAMI",
                    "monitored": true,
                    "monitoredCall": {
                        "arrivalStatus": "noReport",
                        "arrivalBoardingActivity": "alighting",
                        "departureStatus": "noReport",
                        "departureBoardingActivity": "boarding",
                        "aimedArrivalTime": "2024-03-19T14:45:00",
                        "expectedArrivalTime": "2024-03-19T14:45:30",
                        "arrivalStopAssignment": {
                            "aimedQuayRef": "QUAYYY00000000001771",
                            "aimedQuayName": "1",
                            "expectedQuayRef": "QUAYYY00000000001771",
                            "expectedQuayName": "1",
                            "actualQuayRef": "QUAYYY00000000001771",
                            "actualQuayName": "1"
                        },
                        "aimedDepartureTime": "2024-03-19T14:46:00",
                        "expectedDepartureTime": "2024-03-19T14:46:30",
                        "departureStopAssignment": {
                            "aimedQuayRef": "QUAYYY00000000001771",
                            "aimedQuayName": "1",
                            "expectedQuayRef": "QUAYYY00000000001771",
                            "expectedQuayName": "1",
                            "actualQuayRef": "QUAYYY00000000001771",
                            "actualQuayName": "1"
                        },
                        "stopPointRef": "VSL",
                        "visitNumber": 1,
                        "order": 6,
                        "stopPointName": "Vuonislahti"
                    },
                    "onwardCalls": [{
                            "arrivalStatus": "noReport",
                            "arrivalBoardingActivity": "alighting",
                            "departureStatus": "noReport",
                            "departureBoardingActivity": "boarding",
                            "aimedArrivalTime": "2024-03-19T15:07:00",
                            "arrivalStopAssignment": {
                                "aimedQuayRef": "QUAYYY00000000001620",
                                "aimedQuayName": "1",
                                "expectedQuayRef": "QUAYYY00000000001620",
                                "expectedQuayName": "1",
                                "actualQuayRef": "QUAYYY00000000001620",
                                "actualQuayName": "1"
                            },
                            "aimedDepartureTime": "2024-03-19T15:08:00",
                            "departureStopAssignment": {
                                "aimedQuayRef": "QUAYYY00000000001620",
                                "aimedQuayName": "1",
                                "expectedQuayRef": "QUAYYY00000000001620",
                                "expectedQuayName": "1",
                                "actualQuayRef": "QUAYYY00000000001620",
                                "actualQuayName": "1"
                            },
                            "vehicleAtStop": true,
                            "timingPoint": false,
                            "stopPointRef": "UIM",
                            "visitNumber": 1,
                            "order": 7,
                            "stopPointName": "Uimaharju"
                        }, {
                            "arrivalStatus": "noReport",
                            "arrivalBoardingActivity": "alighting",
                            "departureStatus": "noReport",
                            "departureBoardingActivity": "boarding",
                            "aimedArrivalTime": "2024-03-19T15:18:00",
                            "arrivalStopAssignment": {
                                "aimedQuayRef": "QUAYYY00000000000033",
                                "aimedQuayName": "1",
                                "expectedQuayRef": "QUAYYY00000000000033",
                                "expectedQuayName": "1",
                                "actualQuayRef": "QUAYYY00000000000033",
                                "actualQuayName": "1"
                            },
                            "aimedDepartureTime": "2024-03-19T15:19:00",
                            "departureStopAssignment": {
                                "aimedQuayRef": "QUAYYY00000000000033",
                                "aimedQuayName": "1",
                                "expectedQuayRef": "QUAYYY00000000000033",
                                "expectedQuayName": "1",
                                "actualQuayRef": "QUAYYY00000000000033",
                                "actualQuayName": "1"
                            },
                            "vehicleAtStop": true,
                            "timingPoint": false,
                            "stopPointRef": "ENO",
                            "visitNumber": 1,
                            "order": 8,
                            "stopPointName": "Eno"
                        }, {
                            "arrivalStatus": "noReport",
                            "arrivalBoardingActivity": "passthru",
                            "departureStatus": "noReport",
                            "departureBoardingActivity": "passthru",
                            "aimedArrivalTime": "2024-03-19T15:32:00",
                            "arrivalStopAssignment": {
                                "aimedQuayRef": "QUAYYY00000000000478",
                                "aimedQuayName": "151",
                                "expectedQuayRef": "QUAYYY00000000000478",
                                "expectedQuayName": "151",
                                "actualQuayRef": "QUAYYY00000000000478",
                                "actualQuayName": "151"
                            },
                            "aimedDepartureTime": "2024-03-19T15:32:00",
                            "departureStopAssignment": {
                                "aimedQuayRef": "QUAYYY00000000000478",
                                "aimedQuayName": "151",
                                "expectedQuayRef": "QUAYYY00000000000478",
                                "expectedQuayName": "151",
                                "actualQuayRef": "QUAYYY00000000000478",
                                "actualQuayName": "151"
                            },
                            "vehicleAtStop": true,
                            "timingPoint": false,
                            "stopPointRef": "KHI",
                            "visitNumber": 1,
                            "order": 9,
                            "stopPointName": "Kontiolahti"
                        }, {
                            "arrivalStatus": "noReport",
                            "arrivalBoardingActivity": "alighting",
                            "departureBoardingActivity": "boarding",
                            "aimedArrivalTime": "2024-03-19T15:45:00",
                            "arrivalStopAssignment": {
                                "aimedQuayRef": "QUAYYY00000000000373",
                                "aimedQuayName": "1",
                                "expectedQuayRef": "QUAYYY00000000000373",
                                "expectedQuayName": "1",
                                "actualQuayRef": "QUAYYY00000000000373",
                                "actualQuayName": "1"
                            },
                            "departureStopAssignment": {},
                            "vehicleAtStop": true,
                            "timingPoint": false,
                            "stopPointRef": "JNS",
                            "visitNumber": 1,
                            "order": 10,
                            "stopPointName": "Joensuu"
                        }
                    ],
                    "isCompleteStopSequence": false,
                    "lineRef": "HDM",
                    "framedVehicleJourneyRef": {
                        "dataFrameRef": "03/19/2024 00:00:00",
                        "datedVehicleJourneyRef": "100762"
                    }
                },
                "itemIdentifier": "2dbaac95-7b59-4391-b3df-640156986135",
                "recordedAtTime": "2024-03-19T13:43:27Z"
            }
        ]
    }
}
