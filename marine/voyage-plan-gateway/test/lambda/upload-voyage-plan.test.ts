import {handlerFn, SnsEvent} from '../../lib/lambda/upload-voyage-plan/lambda-upload-voyage-plan';
import * as sinon from 'sinon';
import moment from 'moment-timezone';
import {VisMessageWithCallbackEndpoint} from "../../lib/model/vismessage";
import {VtsApi} from "../../lib/api/vts";

const sandbox = sinon.createSandbox();

describe('upload-voyage-plan', () => {

    const secretFn = async (secret: string, fn: any) => await fn({});

    afterEach(() => sandbox.restore());

    test('validation failure, some string', async () => {
        const uploadEvent = createSnsEvent('<foo bar');

        await expect(handlerFn(secretFn, VtsApi)(uploadEvent)).resolves.toMatch('XML parsing failed');
    });

    test('validation success with correct voyage plan', async () => {
        sinon.stub(VtsApi.prototype, 'sendVoyagePlan').returns(Promise.resolve());

        const uploadEvent = createSnsEvent(voyagePlan());

        await expect(handlerFn(secretFn, VtsApi)(uploadEvent)).resolves.not.toThrow();
    });

});

// generated with IntelliJ IDEA tool: XML from schema
function voyagePlan() {
    return `
<?xml version="1.0" encoding="UTF-8"?>
<route version="1.2" xmlns="http://www.cirm.org/RTZ/1/2">
  <routeInfo routeName="string" routeAuthor="string" routeStatus="string" validityPeriodStart="2008-09-29T04:49:45" validityPeriodStop="2014-09-19T02:18:33" vesselName="string" vesselMMSI="200" vesselIMO="200" vesselVoyage="string" vesselDisplacement="200" vesselCargo="200" vesselGM="1000.00" optimizationMethod="string" vesselMaxRoll="200" vesselMaxWave="1000.00" vesselMaxWind="1000.00" vesselSpeedMax="1000.00" vesselServiceMin="1000.00" vesselServiceMax="1000.00" routeChangesHistory="string">
    <!--Optional:-->
    <extensions>
      <!--Zero or more repetitio-->
      <extension manufacturer="string" name="string" version="string">
        <!--You may enter ANY elements at this point-->
        <AnyElement/>
      </extension>
    </extensions>
  </routeInfo>
  <waypoints>
    <!--Optional:-->
    <defaultWaypoint radius="5.0">
      <!--Optional:-->
      <leg starboardXTD="9.0" portsideXTD="9.0" safetyContour="1000.00" safetyDepth="1000.00" geometryType="Loxodrome" speedMin="1000.00" speedMax="1000.00" draughtForward="1000.00" draughtAft="1000.00" staticUKC="1000.00" dynamicUKC="1000.00" masthead="1000.00" legReport="string" legInfo="string" legNote1="string" legNote2="string">
        <!--Optional:-->
        <extensions>
          <!--Zero or more repetitio-->
          <extension manufacturer="string" name="string" version="string">
            <!--You may enter ANY elements at this point-->
            <AnyElement/>
          </extension>
        </extensions>
      </leg>
      <!--Optional:-->
      <extensions>
        <!--Zero or more repetitio-->
        <extension manufacturer="string" name="string" version="string">
          <!--You may enter ANY elements at this point-->
          <AnyElement/>
        </extension>
      </extensions>
    </defaultWaypoint>
    <!--2 or more repetitio-->
    <waypoint id="200" revision="200" name="string" radius="5.0">
      <position lat="58.5842" lon="19.7182"/>
      <!--Optional:-->
      <leg starboardXTD="9.0" portsideXTD="9.0" safetyContour="1000.00" safetyDepth="1000.00" geometryType="Orthodrome" speedMin="1000.00" speedMax="1000.00" draughtForward="1000.00" draughtAft="1000.00" staticUKC="1000.00" dynamicUKC="1000.00" masthead="1000.00" legReport="string" legInfo="string" legNote1="string" legNote2="string">
        <!--Optional:-->
        <extensions>
          <!--Zero or more repetitio-->
          <extension manufacturer="string" name="string" version="string">
            <!--You may enter ANY elements at this point-->
            <AnyElement/>
          </extension>
        </extensions>
      </leg>
      <!--Optional:-->
      <extensions>
        <!--Zero or more repetitio-->
        <extension manufacturer="string" name="string" version="string">
          <!--You may enter ANY elements at this point-->
          <AnyElement/>
        </extension>
      </extensions>
    </waypoint>
    <waypoint id="200" revision="200" name="string" radius="5.0">
      <position lat="61.5065" lon="20.3774"/>
      <!--Optional:-->
      <leg starboardXTD="9.0" portsideXTD="9.0" safetyContour="1000.00" safetyDepth="1000.00" geometryType="Orthodrome" speedMin="1000.00" speedMax="1000.00" draughtForward="1000.00" draughtAft="1000.00" staticUKC="1000.00" dynamicUKC="1000.00" masthead="1000.00" legReport="string" legInfo="string" legNote1="string" legNote2="string">
        <!--Optional:-->
        <extensions>
          <!--Zero or more repetitio-->
          <extension manufacturer="string" name="string" version="string">
            <!--You may enter ANY elements at this point-->
            <AnyElement/>
          </extension>
        </extensions>
      </leg>
      <!--Optional:-->
      <extensions>
        <!--Zero or more repetitio-->
        <extension manufacturer="string" name="string" version="string">
          <!--You may enter ANY elements at this point-->
          <AnyElement/>
        </extension>
      </extensions>
    </waypoint>
    <!--Optional:-->
    <extensions>
      <!--Zero or more repetitio-->
      <extension manufacturer="string" name="string" version="string">
        <!--You may enter ANY elements at this point-->
        <AnyElement/>
      </extension>
    </extensions>
  </waypoints>
  <!--Optional:-->
  <schedules>
    <!--Zero or more repetitio-->
    <schedule id="200" name="string">
      <!--Optional:-->
      <manual>
        <!--1 or more repetitio-->
        <scheduleElement waypointId="200" etd="${moment().add(5, 'minutes').toISOString()}" etdWindowBefore="P3M8DT13H38M37S" etdWindowAfter="P1Y2M8DT15H6M2S" eta="${moment().add(5, 'minutes').toISOString()}" etaWindowBefore="P1Y4M4DT18H29M49S" etaWindowAfter="P10M3DT16H58M52S" stay="P1Y2M6DT16H51M39S" speed="1000.00" speedWindow="1000.00" windSpeed="1000.00" windDirection="359.0" currentSpeed="1000.00" currentDirection="359.0" windLoss="1000.00" waveLoss="1000.00" totalLoss="1000.00" rpm="200" pitch="100" fuel="1000.00" relFuelSave="1000.00" absFuelSave="1000.00" Note="string">
          <!--Optional:-->
          <extensions>
            <!--Zero or more repetitio-->
            <extension manufacturer="string" name="string" version="string">
              <!--You may enter ANY elements at this point-->
              <AnyElement/>
            </extension>
          </extensions>
        </scheduleElement>
        <!--Optional:-->
        <extensions>
          <!--Zero or more repetitio-->
          <extension manufacturer="string" name="string" version="string">
            <!--You may enter ANY elements at this point-->
            <AnyElement/>
          </extension>
        </extensions>
      </manual>
      <!--Optional:-->
      <calculated>
        <!--Zero or more repetitio-->
        <scheduleElement waypointId="200" etd="2018-02-04T16:35:59+02:00" etdWindowBefore="P2M2DT17H57M17S" etdWindowAfter="P1Y2M3DT15H5S" eta="2006-11-29T19:20:00" etaWindowBefore="P9M5DT14H25M55S" etaWindowAfter="P1Y3M8DT22H7M" stay="P1Y3M2DT8H20M34S" speed="1000.00" speedWindow="1000.00" windSpeed="1000.00" windDirection="359.0" currentSpeed="1000.00" currentDirection="359.0" windLoss="1000.00" waveLoss="1000.00" totalLoss="1000.00" rpm="200" pitch="100" fuel="1000.00" relFuelSave="1000.00" absFuelSave="1000.00" Note="string">
          <!--Optional:-->
          <extensions>
            <!--Zero or more repetitio-->
            <extension manufacturer="string" name="string" version="string">
              <!--You may enter ANY elements at this point-->
              <AnyElement/>
            </extension>
          </extensions>
        </scheduleElement>
        <!--Optional:-->
        <extensions>
          <!--Zero or more repetitio-->
          <extension manufacturer="string" name="string" version="string">
            <!--You may enter ANY elements at this point-->
            <AnyElement/>
          </extension>
        </extensions>
      </calculated>
      <!--Optional:-->
      <extensions>
        <!--Zero or more repetitio-->
        <extension manufacturer="string" name="string" version="string">
          <!--You may enter ANY elements at this point-->
          <AnyElement/>
        </extension>
      </extensions>
    </schedule>
    <!--Optional:-->
    <extensions>
      <!--Zero or more repetitio-->
      <extension manufacturer="string" name="string" version="string">
        <!--You may enter ANY elements at this point-->
        <AnyElement/>
      </extension>
    </extensions>
  </schedules>
  <!--Optional:-->
  <extensions>
    <!--Zero or more repetitio-->
    <extension manufacturer="string" name="string" version="string">
      <!--You may enter ANY elements at this point-->
      <AnyElement/>
    </extension>
  </extensions>
</route>
`.trim();
}

function createSnsEvent(xml: string): SnsEvent {
    const message: VisMessageWithCallbackEndpoint = {
        callbackEndpoint: '',
        message: xml
    };
    return {
        Records: [{
            body: JSON.stringify(message),
        }]
    };
}
