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