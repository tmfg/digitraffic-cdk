export const validRamiMonitoredJourneyScheduledMessage = {
    headers: {
        e2eId: "5639fbde-f91e-4b5d-bb28-34061b557b37",
        organisation: "MOOVA",
        source: "ihbinf-infomobilityschedule-prc-messagepublisher",
        eventType: "OperatorScheduledMessage",
        partitionKey: "MVM20230521610102170",
        recordedAtTime: "2023-05-21T06:10:10.425660994Z"
    },
    payload: {
        messageId: "MVM20230521610102170",
        messageVersion: 1,
        title: "xhm",
        messageType: "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
        operation: "INSERT",
        creationDateTime: "2023-05-21T06:10:10.217Z",
        startValidity: "2023-06-12T06:10:10.217Z",
        endValidity: "2023-06-20T00:00:00Z",
        scheduledMessage: null,
        monitoredJourneyScheduledMessage: {
            vehicleJourney: {
                datedVehicleJourneyRef: "100274",
                dataFrameRef: "2023-05-21",
                vehicleJourneyName: "274"
            },
            messageContentType: "AUDIO_VIDEO",
            deliveryPoints: [
                {
                    id: "KJÄ",
                    nameLong: "kemijärvi"
                },
                {
                    id: "MIS",
                    nameLong: "misi"
                }
            ],
            audioMessageContents: {
                audioTexts: [
                    {
                        language: "fi_FI",
                        audioText:
                            "Huomio! InterCity juna 274 Helsinkiin on korvattu linja-autolla välillä Kemijärvi-Rovaniemi. Linja-auto lähtee aseman edestä."
                    },
                    {
                        language: "sv_SE",
                        audioText:
                            "Observera! InterCity-tåg 274 till Helsingfors har ersatts av en buss mellan Kemijärvi och Rovaniemi. Bussen går framför stationen."
                    },
                    {
                        language: "en_GB",
                        audioText:
                            " Attention! InterCity train 274 to Helsinki has been replaced by a bus between Kemijärvi and Rovaniemi. The bus leaves in front of the station."
                    }
                ],
                deliveryRules: {
                    repetitions: 1,
                    repeatEvery: 5,
                    scheduledArrival: false,
                    scheduledDeparture: false,
                    estimatedArrival: false,
                    estimatedDeparture: false,
                    eventType: ""
                },
                deliveryType: "ON_SCHEDULE"
            },
            videoTexts: [
                {
                    language: "fi_FI",
                    videoText:
                        "Huomio! InterCity juna 274 Helsinkiin on korvattu linja-autolla välillä Kemijärvi-Rovaniemi. Linja-auto lähtee aseman edestä."
                },
                {
                    language: "sv_SE",
                    videoText:
                        "Observera! InterCity-tåg 274 till Helsingfors har ersatts av en buss mellan Kemijärvi och Rovaniemi. Bussen går framför stationen."
                },
                {
                    language: "en_GB",
                    videoText:
                        " Attention! InterCity train 274 to Helsinki has been replaced by a bus between Kemijärvi and Rovaniemi. The bus leaves in front of the station."
                }
            ]
        }
    }
};