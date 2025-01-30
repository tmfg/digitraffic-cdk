import type { FeatureCollection } from "geojson";

export const TEST_FEATURE_COLLECTION: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        Id: 28,
        Type_Id: 1,
        StartDate: "5.4.2020 1:01",
        EndDate: "29.4.2020 1:01",
        DescriptionFi: "Sulun TESTIhäiriö. Saa poistaa.",
        DescriptionSv: null,
        DescriptionEn: null,
        AdditionalInformationFi: "TESTIhäiriö",
        AdditionalInformationSv: null,
        AdditionalInformationEn: null,
        Tooltip: null,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [20.996112096467382, 60.451085443506528],
            [20.996638860202356, 60.450687243961369],
            [20.997724312747163, 60.450687243961369],
            [20.996838391920161, 60.450348179101915],
            [20.997053886175376, 60.450107677455968],
            [20.996447309753275, 60.450253555716664],
            [20.9959205460183, 60.450091906793794],
            [20.995944489824435, 60.450356064371526],
            [20.994938849966751, 60.450663588388743],
            [20.995944489824435, 60.450679358772412],
            [20.996112096467382, 60.451085443506528],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        Id: 33,
        Type_Id: 1,
        StartDate: "1.1.2020 10:00",
        EndDate: "1.1.2030 10:00",
        DescriptionFi: "voimassa",
        DescriptionSv: null,
        DescriptionEn: null,
        AdditionalInformationFi: null,
        AdditionalInformationSv: null,
        AdditionalInformationEn: null,
        Tooltip: null,
      },
      geometry: {
        type: "Polygon",
        coordinates: [[]],
      },
    },
  ],
};
