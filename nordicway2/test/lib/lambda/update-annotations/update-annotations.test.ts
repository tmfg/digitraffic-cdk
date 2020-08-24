import {handler} from "../../../../lib/lambda/update-annotations/lambda-update-annotations";
import {testBase} from "../../db-testutil";
import {findActiveAnnotations, findAllAnnotations} from "../../../../lib/service/annotations";
import {TestHttpServer} from "../../../../../common/test/httpserver";

const SERVER_PORT = 8089;

process.env.ENDPOINT_LOGIN_URL = `http://localhost:${SERVER_PORT}/login`;
process.env.ENDPOINT_URL = `http://localhost:${SERVER_PORT}/annotations`;

describe('update-annotations', testBase(async () => {
    test('test update', async () => {
        const server = new TestHttpServer();
        server.listen(SERVER_PORT, {
            "/annotations": () => {
                return fakeAnnotations();
            },
            "/login": () => {
                return fakeLogin();
            }
        });

        try {
            await handler();

            // find all annotations
            const annotations = await findAllAnnotations();
            expect(annotations.features).toHaveLength(2);
            if (annotations.features[0].properties != null) {
               expect(annotations.features[0].properties.type).toEqual('slipperyRoad');
            }

            // find active annotations
            const activeAnnotations = await findActiveAnnotations(null, null);
            expect(activeAnnotations.features).toHaveLength(1);
            if (annotations.features[0].properties != null) {
                expect(annotations.features[0].properties.type).toEqual('slipperyRoad');
            }

            // find testusers annotations
            const testUserAnnotations = await findActiveAnnotations('testuser', null);
            expect(testUserAnnotations.features).toHaveLength(1);

            // find vionice annotations(not finding any)
            const vioniceAnnotations = await findActiveAnnotations('vionice', null);
            expect(vioniceAnnotations.features).toHaveLength(0);

        } finally {
            server.close();
        }
    });
}));

function fakeLogin() {
    return `
{
  "status": "success",
  "data": {
    "authToken": "xxx",
    "userId": "xx"
  }
}    
`;
}

function fakeAnnotations() {
    return `
[
   {
    "_id": "test1",
    "user": "vionice",
    "author": "vionice",
    "address": [],
    "created_at": "2019-12-10T13:02:37.681Z",
    "tags": [
      "NonWeatherRelatedRoadConditions:slipperyRoad"
    ],
    "shares": [
      {
        "id": "zGWmHYMeBkdggqNfo"
      }
    ],
    "text": null,
    "type": "image",
    "video_id": "DzuJAZShueHHBfO3Wd05aTbVyJCsU6fG",
    "resolved": false,
    "image_url": null,
    "recorded_at": "2019-12-10T12:48:01.955Z",
    "expires_at": "2019-12-10T13:48:01.955Z",
    "location": {
      "type": "LineString",
      "coordinates": [
        [
          26.66730664221279,
          60.863140990337484,
          77
        ],
        [
          26.667362152425937,
          60.863047901146146,
          77
        ]
      ]
    }
  },
  {
    "_id": "test2",
    "user": "vionice",
    "author": "testuser",
    "address": [],
    "created_at": "2019-12-10T13:02:34.681Z",
    "tags": [
      "NonWeatherRelatedRoadConditions:slipperyRoad"
    ],
    "shares": [
      {
        "id": "zGWmHYMeBkdggqNfo"
      }
    ],
    "text": null,
    "type": "image",
    "video_id": "DzuJAZShueHHBfO3Wd05aTbVyJCsU6fG",
    "resolved": false,
    "image_url": null,
    "recorded_at": "2019-12-10T12:48:04.955Z",
    "expires_at": "2119-12-10T13:48:01.955Z",
    "location": {
      "type": "Point",
      "coordinates": [
      27.66730664221279,
      61.863140990337484,
      77
      ]
    }
  }    
]  
`;
}

