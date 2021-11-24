import {DbFault, FaultState} from "../lib/model/fault";

const { v4: uuidv4 } = require('uuid');

export function someNumber() {
     return Math.floor(Math.random() * 999999);
}

export function newFaultWithGeometry(lat: number, lon: number): DbFault {
     return newFault({ geometry: { lat, lon} });
}

export function newFault(props?: {
     geometry?: {lat: number, lon: number},
     state?: FaultState,
     entryTimestamp?: Date,
     fixedTimestamp?: Date
}): DbFault {
     const entryTimestamp = props?.entryTimestamp ?? new Date();
     entryTimestamp.setMilliseconds(0);
     const fixedTimestamp = props?.fixedTimestamp ?? new Date();
     fixedTimestamp.setMilliseconds(0);
    return {
         id: -someNumber(), // id's in real system are negative for some obscure reason
         entry_timestamp: entryTimestamp,
         fixed_timestamp: fixedTimestamp,
         domain: 'C_NA',
         state: props?.state ?? FaultState.Avoin,
         aton_fault_type: 'Valo pimeä',
         fixed: false,
         aton_id: someNumber(),
         aton_name_fi: uuidv4(),
         aton_name_sv: uuidv4(),
         aton_type: 'Poiju',
         fairway_number: someNumber(),
         fairway_name_fi: someNumber(),
         fairway_name_sv: someNumber(),
         area_number: 1,
         area_description: 'area 51',
         geometry: `POINT(${props?.geometry?.lon ?? someNumber()} ${props?.geometry?.lat ?? someNumber()})`
    };
}

export // generated with IntelliJ IDEA tool: XML from schema
const voyagePlan = `<?xml version="1.0" encoding="UTF-8"?>
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
      <position lat="60.285805" lon="27.321650"/>
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
      <position lat="60.285815" lon="27.321660"/>
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
        <scheduleElement waypointId="200" etd="2009-05-16T15:42:28" etdWindowBefore="P3M8DT13H38M37S" etdWindowAfter="P1Y2M8DT15H6M2S" eta="2002-06-24T18:46:32+03:00" etaWindowBefore="P1Y4M4DT18H29M49S" etaWindowAfter="P10M3DT16H58M52S" stay="P1Y2M6DT16H51M39S" speed="1000.00" speedWindow="1000.00" windSpeed="1000.00" windDirection="359.0" currentSpeed="1000.00" currentDirection="359.0" windLoss="1000.00" waveLoss="1000.00" totalLoss="1000.00" rpm="200" pitch="100" fuel="1000.00" relFuelSave="1000.00" absFuelSave="1000.00" Note="string">
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
`;
