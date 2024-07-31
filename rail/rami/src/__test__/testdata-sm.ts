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

export const realMessage = {
	"headers":{
	   "e2eId":"ad64cdf2-53f8-4346-8911-9af8e9a1025b",
	   "organisation":"AlmavivA",
	   "source":"Pis.InfomobilityOperation",
	   "eventType":"StopMonitoringMessage",
	   "recordedAtTime":"2024-07-26T08:30:28Z"
	},
	"payload":{
	   "monitoredStopVisits":[
		  {
			 "monitoringRef":"KTÖ",
			 "monitoredVehicleJourney":{
				"vehicleModeName":"RAIL",
				"publishedLineName":"I",
				"productCategoryRef":"HL",
				"vehicleJourneyName":"20240726108844",
				"dataSource":"RAMI",
				"monitored":true,
				"monitoredCall":{
				   "arrivalStatus":"arrived",
				   "arrivalBoardingActivity":"alighting",
				   "departureStatus":"departed",
				   "departureBoardingActivity":"boarding",
				   "aimedArrivalTime":"2024-07-26T08:31:00",
				   "expectedArrivalTime":"2024-07-26T08:31:30",
				   "arrivalStopAssignment":{
					  "aimedQuayRef":"QUAYYY00000000000654",
					  "aimedQuayName":"2",
					  "expectedQuayRef":"QUAYYY00000000000654",
					  "expectedQuayName":"2",
					  "actualQuayRef":"QUAYYY00000000000654",
					  "actualQuayName":"2"
				   },
				   "aimedDepartureTime":"2024-07-26T08:32:00",
				   "expectedDepartureTime":"2024-07-26T08:32:30",
				   "departureStopAssignment":{
					  "aimedQuayRef":"QUAYYY00000000000654",
					  "aimedQuayName":"2",
					  "expectedQuayRef":"QUAYYY00000000000654",
					  "expectedQuayName":"2",
					  "actualQuayRef":"QUAYYY00000000000654",
					  "actualQuayName":"2"
				   },
				   "stopPointRef":"KTÖ",
				   "visitNumber":1,
				   "order":17,
				   "stopPointName":"Kivistö"
				},
				"onwardCalls":[
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:34:00",
					  "expectedArrivalTime":"2024-07-26T08:34:00",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001648",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001648",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001648",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:34:00",
					  "expectedDepartureTime":"2024-07-26T08:34:00",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001648",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001648",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001648",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"VEH",
					  "visitNumber":1,
					  "order":18,
					  "stopPointName":"Vehkala"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:35:00",
					  "expectedArrivalTime":"2024-07-26T08:35:48",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001704",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001704",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001704",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:36:00",
					  "expectedDepartureTime":"2024-07-26T08:36:48",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001704",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001704",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001704",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"VKS",
					  "visitNumber":1,
					  "order":19,
					  "stopPointName":"Vantaankoski"
				   },
				   {
					  "arrivalStatus":"noReport",
					  "arrivalBoardingActivity":"passthru",
					  "departureStatus":"noReport",
					  "departureBoardingActivity":"passthru",
					  "aimedArrivalTime":"2024-07-26T08:36:00",
					  "expectedArrivalTime":"2024-07-26T08:36:40",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000804",
						 "aimedQuayName":"156",
						 "expectedQuayRef":"QUAYYY00000000000804",
						 "expectedQuayName":"156",
						 "actualQuayRef":"QUAYYY00000000000804",
						 "actualQuayName":"156"
					  },
					  "aimedDepartureTime":"2024-07-26T08:36:00",
					  "expectedDepartureTime":"2024-07-26T08:36:40",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000804",
						 "aimedQuayName":"156",
						 "expectedQuayRef":"QUAYYY00000000000804",
						 "expectedQuayName":"156",
						 "actualQuayRef":"QUAYYY00000000000804",
						 "actualQuayName":"156"
					  },
					  "vehicleAtStop":true,
					  "timingPoint":false,
					  "stopPointRef":"LAV",
					  "visitNumber":1,
					  "order":20,
					  "stopPointName":"Laajavuori"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:37:00",
					  "expectedArrivalTime":"2024-07-26T08:37:27",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000969",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000969",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000969",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:37:00",
					  "expectedDepartureTime":"2024-07-26T08:37:27",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000969",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000969",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000969",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"MRL",
					  "visitNumber":1,
					  "order":21,
					  "stopPointName":"Martinlaakso"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:38:00",
					  "expectedArrivalTime":"2024-07-26T08:39:08",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000855",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000855",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000855",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:39:00",
					  "expectedDepartureTime":"2024-07-26T08:39:00",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000855",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000855",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000855",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"LOH",
					  "visitNumber":1,
					  "order":22,
					  "stopPointName":"Louhela"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:40:00",
					  "expectedArrivalTime":"2024-07-26T08:40:42",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001004",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001004",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001004",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:41:00",
					  "expectedDepartureTime":"2024-07-26T08:41:42",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001004",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001004",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001004",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"MYR",
					  "visitNumber":1,
					  "order":23,
					  "stopPointName":"Myyrmäki"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:42:00",
					  "expectedArrivalTime":"2024-07-26T08:42:54",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000949",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000949",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000949",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:43:00",
					  "expectedDepartureTime":"2024-07-26T08:43:54",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000949",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000949",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000949",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"MLO",
					  "visitNumber":1,
					  "order":24,
					  "stopPointName":"Malminkartano"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:44:00",
					  "expectedArrivalTime":"2024-07-26T08:45:05",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000443",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000443",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000443",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:45:00",
					  "expectedDepartureTime":"2024-07-26T08:45:00",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000443",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000000443",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000000443",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"KAN",
					  "visitNumber":1,
					  "order":25,
					  "stopPointName":"Kannelmäki"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:46:00",
					  "expectedArrivalTime":"2024-07-26T08:47:10",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001209",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001209",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001209",
						 "actualQuayName":"2"
					  },
					  "aimedDepartureTime":"2024-07-26T08:47:00",
					  "expectedDepartureTime":"2024-07-26T08:47:00",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001209",
						 "aimedQuayName":"2",
						 "expectedQuayRef":"QUAYYY00000000001209",
						 "expectedQuayName":"2",
						 "actualQuayRef":"QUAYYY00000000001209",
						 "actualQuayName":"2"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"POH",
					  "visitNumber":1,
					  "order":26,
					  "stopPointName":"Pohjois-Haaga"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:48:00",
					  "expectedArrivalTime":"2024-07-26T08:49:06",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000164",
						 "aimedQuayName":"3",
						 "expectedQuayRef":"QUAYYY00000000000164",
						 "expectedQuayName":"3",
						 "actualQuayRef":"QUAYYY00000000000164",
						 "actualQuayName":"3"
					  },
					  "aimedDepartureTime":"2024-07-26T08:49:00",
					  "expectedDepartureTime":"2024-07-26T08:49:00",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000164",
						 "aimedQuayName":"3",
						 "expectedQuayRef":"QUAYYY00000000000164",
						 "expectedQuayName":"3",
						 "actualQuayRef":"QUAYYY00000000000164",
						 "actualQuayName":"3"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"HPL",
					  "visitNumber":1,
					  "order":27,
					  "stopPointName":"Huopalahti"
				   },
				   {
					  "arrivalStatus":"noReport",
					  "arrivalBoardingActivity":"passthru",
					  "departureStatus":"noReport",
					  "departureBoardingActivity":"passthru",
					  "aimedArrivalTime":"2024-07-26T08:50:00",
					  "expectedArrivalTime":"2024-07-26T08:50:31",
					  "arrivalStopAssignment":{
						 
					  },
					  "aimedDepartureTime":"2024-07-26T08:50:00",
					  "expectedDepartureTime":"2024-07-26T08:50:31",
					  "departureStopAssignment":{
						 
					  },
					  "vehicleAtStop":true,
					  "timingPoint":false,
					  "stopPointRef":"KHK",
					  "visitNumber":1,
					  "order":28,
					  "stopPointName":"Helsinki Kivihak"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:51:00",
					  "expectedArrivalTime":"2024-07-26T08:51:19",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000221",
						 "aimedQuayName":"3",
						 "expectedQuayRef":"QUAYYY00000000000221",
						 "expectedQuayName":"3",
						 "actualQuayRef":"QUAYYY00000000000221",
						 "actualQuayName":"3"
					  },
					  "aimedDepartureTime":"2024-07-26T08:51:00",
					  "expectedDepartureTime":"2024-07-26T08:51:19",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000221",
						 "aimedQuayName":"3",
						 "expectedQuayRef":"QUAYYY00000000000221",
						 "expectedQuayName":"3",
						 "actualQuayRef":"QUAYYY00000000000221",
						 "actualQuayName":"3"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"ILA",
					  "visitNumber":1,
					  "order":29,
					  "stopPointName":"Ilmala"
				   },
				   {
					  "arrivalStatus":"arrived",
					  "arrivalBoardingActivity":"alighting",
					  "departureStatus":"departed",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:53:00",
					  "expectedArrivalTime":"2024-07-26T08:53:30",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001250",
						 "aimedQuayName":"10",
						 "expectedQuayRef":"QUAYYY00000000001250",
						 "expectedQuayName":"10",
						 "actualQuayRef":"QUAYYY00000000001250",
						 "actualQuayName":"10"
					  },
					  "aimedDepartureTime":"2024-07-26T08:54:00",
					  "expectedDepartureTime":"2024-07-26T08:54:30",
					  "departureStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000001250",
						 "aimedQuayName":"10",
						 "expectedQuayRef":"QUAYYY00000000001250",
						 "expectedQuayName":"10",
						 "actualQuayRef":"QUAYYY00000000001250",
						 "actualQuayName":"10"
					  },
					  "vehicleAtStop":false,
					  "timingPoint":false,
					  "stopPointRef":"PSL",
					  "visitNumber":2,
					  "order":30,
					  "stopPointName":"Pasila"
				   },
				   {
					  "arrivalStatus":"noReport",
					  "arrivalBoardingActivity":"alighting",
					  "departureBoardingActivity":"boarding",
					  "aimedArrivalTime":"2024-07-26T08:59:00",
					  "expectedArrivalTime":"2024-07-26T08:59:00",
					  "arrivalStopAssignment":{
						 "aimedQuayRef":"QUAYYY00000000000091",
						 "aimedQuayName":"18",
						 "expectedQuayRef":"QUAYYY00000000000091",
						 "expectedQuayName":"18",
						 "actualQuayRef":"QUAYYY00000000000091",
						 "actualQuayName":"18"
					  },
					  "departureStopAssignment":{
						 
					  },
					  "vehicleAtStop":true,
					  "timingPoint":false,
					  "stopPointRef":"HKI",
					  "visitNumber":2,
					  "order":31,
					  "stopPointName":"Helsinki"
				   }
				],
				"isCompleteStopSequence":false,
				"lineRef":"I",
				"framedVehicleJourneyRef":{
				   "dataFrameRef":"07/26/2024 00:00:00",
				   "datedVehicleJourneyRef":"108844"
				}
			 },
			 "itemIdentifier":"c5ac05f8-c2ef-47d0-b844-43532195fef3",
			 "recordedAtTime":"2024-07-26T08:30:28Z"
		  }
	   ]
	}
 }