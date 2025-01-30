import mysql from "mysql";
import util from "node:util";
import { uploadToS3 } from "@digitraffic/common/dist/aws/runtime/s3";
import { getEnvVariable } from "@digitraffic/common/dist/utils/utils";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client();
interface KeyFigure {
  filter: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  name: string;
  from: Date;
  to: Date;
  id: number;
  query: string;
}

type KeyFiguresQueryResult = { from: Date; value: number }[];

const mysqlOpts = {
  host: getEnvVariable("MYSQL_ENDPOINT"),
  user: getEnvVariable("MYSQL_USERNAME"),
  password: getEnvVariable("MYSQL_PASSWORD"),
  database: getEnvVariable("MYSQL_DATABASE"),
};

const conn = mysql.createConnection(mysqlOpts);

const query = util.promisify(conn.query).bind(conn);

const BUCKET_NAME = getEnvVariable("BUCKET_NAME");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createGraph(id: string, otsikko: string, data: any): string {
  return `
	nv.addGraph(function() {
        var chart = nv.models.lineChart()
            .useInteractiveGuideline(true)
            .x(function(d) { return d[0] })
            .y(function(d) { return d[1] })
            .color(d3.scale.category10().range())
            .clipVoronoi(false); 

	      chart.yAxis.tickFormat(d3.format('.2s'));

        chart.xAxis.tickFormat(function(d) {
          return d3.time.format('%m-%Y')(new Date(d))
        });

		    chart.xScale(d3.time.scale())

        d3.select('#${id} div svg')
            .datum([${data}])
            .call(chart);
            
        const titleElement = document.createElement('h1');
        titleElement.innerText = '${otsikko}'
        document.getElementById('${id}').prepend(titleElement);                

        return chart;
    });
  `;
}

function topDataToGraphData(
  data: KeyFigure[],
): { values: [Date, number][]; key: string }[] {
  const output: { [key: string]: [Date, number][] } = {};
  for (const rivi of data) {
    const valueJson = JSON.parse(rivi.value) as Record<string, number>;
    for (const [key, value] of Object.entries(valueJson)) {
      let item = output[key];
      if (!item) {
        item = [];
      }

      item.push([rivi.from, value]);
      output[key] = item;
    }
  }

  const highlightData: { values: [Date, number][]; key: string }[] = [];

  for (const [key, values] of Object.entries(output)) {
    highlightData.push({ key, values });
  }

  return highlightData;
}

function endDataToGraphData(
  data: KeyFigure[],
): { values: [Date, number][]; key: string }[] {
  const output: { [key: string]: [Date, number][] } = {};
  for (const rivi of data) {
    const value = rivi.value as number;
    let item = output[rivi.filter];
    if (!item) {
      item = [];
    }
    item.push([rivi.from, value]);
    output[rivi.filter] = item;
  }

  const highlightData: { values: [Date, number][]; key: string }[] = [];

  for (const [key, values] of Object.entries(output)) {
    highlightData.push({ key: friendlyFilterString(key), values });
  }

  return highlightData;
}

async function createDetailPage(filter: string): Promise<string> {
  return `
  <html>
  <head>  
    <style>
      div.chart {
        height: 400px;
      }
      
      div h1 {
          text-align: center;
      }
    </style>  
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nvd3@1.8.6/build/nv.d3.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.2/d3.min.js" charset="utf-8"></script>
    <script src="https://cdn.jsdelivr.net/npm/nvd3@1.8.6/build/nv.d3.min.js"></script>
    
    <script>
  	  window.onload = function() {
        ${
    createGraph(
      "requests",
      `Requests (${friendlyFilterString(filter)})`,
      `{key:'Requests', values: [${
        (
          (await query(
            `select value, \`from\` from key_figures where filter = '${filter}' and name = 'Http req' order by \`from\` asc`,
          )) as KeyFiguresQueryResult
        )
          .map((s: { from: Date; value: number }) =>
            `[${s.from.getTime()}, ${Number(s.value)}]`
          )
          .join(",")
      } ] }`,
    )
  } 
        ${
    createGraph(
      "bytesOut",
      `Bytes out (${friendlyFilterString(filter)})`,
      `{key:'Bytes out', values: [${
        (
          (await query(
            `select value, \`from\` from key_figures where filter = '${filter}' and name = 'Bytes Out' order by \`from\` asc`,
          )) as KeyFiguresQueryResult
        )
          .map((s: { from: Date; value: number }) =>
            `[${s.from.getTime()}, ${Number(s.value)}]`
          )
          .join(",")
      } ] }`,
    )
  }
        ${
    createGraph(
      "uniqueIPs",
      `Unique IPs (${friendlyFilterString(filter)})`,
      `{key:'Unique IPs', values: [${
        (
          (await query(
            `select value, \`from\` from key_figures where filter = '${filter}' and name = 'Unique IPs' order by \`from\` asc`,
          )) as KeyFiguresQueryResult
        )
          .map((s: { from: Date; value: number }) =>
            `[${s.from.getTime()}, ${Number(s.value)}]`
          )
          .join(",")
      } ] }`,
    )
  }            
        ${
    createGraph(
      "top10digitrafficUsers",
      `Top 10 Digitraffic-Users (${friendlyFilterString(filter)})`,
      topDataToGraphData(
        (await query(
          `select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 digitraffic-users' order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }
        ${
    createGraph(
      "top10IPs",
      `Top 10 IPs (${friendlyFilterString(filter)})`,
      topDataToGraphData(
        (await query(
          `select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 IPs' order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }
        ${
    createGraph(
      "top10userAgents",
      `Top 10 User agents (${friendlyFilterString(filter)})`,
      topDataToGraphData(
        (await query(
          `select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 User Agents' order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }
        ${
    createGraph(
      "top10referers",
      `Top 10 Referers (${friendlyFilterString(filter)})`,
      topDataToGraphData(
        (await query(
          `select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 Referers' order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }
      }
    </script>
  </head>
  <body>

  <figure>
      <div id="requests">
          <div class="chart"><svg></svg></div>    
      </div>      
      <div id="bytesOut">
          <div class="chart"><svg></svg></div>    
      </div>  
      <div id="uniqueIPs">
          <div class="chart"><svg></svg></div>    
      </div>  
      <div id="top10digitrafficUsers">
          <div class="chart"><svg></svg></div>    
      </div>  
      <div id="top10IPs">
          <div class="chart"><svg></svg></div>    
      </div>  
      <div id="top10userAgents">
          <div class="chart"><svg></svg></div>    
      </div>  
      <div id="top10referers">
          <div class="chart"><svg></svg></div>    
      </div>       
  </figure>
  </body>
  </html>
`;
}

async function createIndex(): Promise<string> {
  const filters = (await query(
    "select distinct kf_outer.filter as filter, (select kf_inner.value from key_figures kf_inner where kf_inner.filter = kf_outer.filter and kf_inner.name = 'Http req' order by kf_inner.`from` desc limit 1) as filterValue from key_figures kf_outer  order by filterValue desc",
  )) as { filter: string; filterValue: number }[];
  const filterHeader =
    "<table><tr><th>Endpoint</th><th>Requests (last month)</th></tr>";

  let roadFilterHtml = filterHeader;
  for (
    const row of filters.filter((s) => s.filter.includes("transport_type:road"))
  ) {
    roadFilterHtml += `<tr><td><a href="${
      base64encodeFilter(row.filter)
    }.html">${
      friendlyFilterString(
        row.filter,
      )
    }</a></td><td>${
      row.filterValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }</td></tr>`;
  }
  roadFilterHtml += "</table>";

  let railFilterHtml = filterHeader;
  for (
    const row of filters.filter((s) => s.filter.includes("transport_type:rail"))
  ) {
    railFilterHtml += `<tr><td><a href="${
      base64encodeFilter(row.filter)
    }.html">${
      friendlyFilterString(
        row.filter,
      )
    }</a></td><td>${
      row.filterValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }</td></tr>`;
  }
  railFilterHtml += "</table>";

  let marineFilterHtml = filterHeader;
  for (
    const row of filters.filter((s) =>
      s.filter.includes("transport_type:marine")
    )
  ) {
    marineFilterHtml += `<tr><td><a href="${
      base64encodeFilter(row.filter)
    }.html">${
      friendlyFilterString(
        row.filter,
      )
    }</a></td><td>${
      row.filterValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }</td></tr>`;
  }
  marineFilterHtml += "</table>";

  return `
  <html>
  <head>  
    <style>
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 400px 800px 1fr;
  gap: 40px 0px;
  grid-template-areas:
    "requests bytesOut uniqueIPs"
    "road-endpoints rail-endpoints marine-endpoints"
    "road-links rail-links marine-links"    ;
}

.requests { grid-area: requests; }
.bytesOut { grid-area: bytesOut; }
.uniqueIPs { grid-area: uniqueIPs; }
.road-links { grid-area: road-links; }
.rail-links { grid-area: rail-links; }
.marine-links { grid-area: marine-links; }
.road-endpoints { grid-area: road-endpoints; }
.rail-endpoints { grid-area: rail-endpoints; }
.marine-endpoints { grid-area: marine-endpoints; }
      
      div h1 {
          text-align: center;
      }
      
      footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: gainsboro;
        text-align: center;
      }
    </style>  
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nvd3@1.8.6/build/nv.d3.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.2/d3.min.js" charset="utf-8"></script>
    <script src="https://cdn.jsdelivr.net/npm/nvd3@1.8.6/build/nv.d3.min.js"></script>
    
    <script>
  	  window.onload = function() {  	      	            
        ${
    createGraph(
      "requests",
      `Requests`,
      endDataToGraphData(
        (await query(
          `select * from key_figures where filter in ('@transport_type:road','@transport_type:rail','@transport_type:marine','@transport_type:*') and name = 'Http req' order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }            
        ${
    createGraph(
      "bytesOut",
      `Bytes out`,
      endDataToGraphData(
        (await query(
          `select * from key_figures where filter in ('@transport_type:road','@transport_type:rail','@transport_type:marine','@transport_type:*') and name = 'Bytes Out' order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }
        ${
    createGraph(
      "uniqueIPs",
      `Unique IPs`,
      endDataToGraphData(
        (await query(
          `select * from key_figures where filter in ('@transport_type:road','@transport_type:rail','@transport_type:marine','@transport_type:*') and name = 'Unique IPs' order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }                                    
        ${
    createGraph(
      "roadEndpoints",
      `Road Requests`,
      endDataToGraphData(
        (await query(
          `select * from key_figures where filter like '@transport_type:road AND %' and name = 'Http req' and value > 50000 order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }         
        ${
    createGraph(
      "railEndpoints",
      `Rail Requests`,
      endDataToGraphData(
        (await query(
          `select * from key_figures where filter like '@transport_type:rail AND %' and name = 'Http req' and value > 50000 order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }   
        ${
    createGraph(
      "marineEndpoints",
      `Marine Requests`,
      endDataToGraphData(
        (await query(
          `select * from key_figures where filter like '@transport_type:marine AND %' and name = 'Http req' and value > 50000 order by \`from\` asc`,
        )) as KeyFigure[],
      ).map(
        (s) =>
          `{key:'${s.key}', values: [${
            s.values.map((o) => `[${o[0].getTime()}, ${o[1]}]`)
          } ] }`,
      ),
    )
  }                   
      }
    </script>
  </head>
  <body>

  <div class="grid-container">
      <div id="requests" class="requests"><div><svg></svg></div></div>
      <div id="bytesOut" class="bytesOut"><div><svg></svg></div></div>
      <div id="uniqueIPs" class="uniqueIPs"><div><svg></svg></div></div> 
      <div id="roadEndpoints" class="road-endpoints"><div><svg></svg></div></div>
      <div id="railEndpoints" class="rail-endpoints"><div><svg></svg></div></div>
      <div id="marineEndpoints" class="marine-endpoints"><div><svg></svg></div></div>      
      <div class="road-links"><h1>Road details</h1>${roadFilterHtml}</div>
      <div class="rail-links"><h1>Rail details</h1>${railFilterHtml}</div>
      <div class="marine-links"><h1>Marine details</h1>${marineFilterHtml}</div>
  
  </div>
  <footer>
    <span>Details for whole service <a href="${
    base64encodeFilter(
      "@transport_type:*",
    )
  }.html">here</a>. Graphs only show endpoints which receive over 50k requests. Last updated: ${
    new Date().toISOString()
  }</span>
  </footer>
  </body>
  </html>
`;
}

function base64encodeFilter(filter: string): string {
  return Buffer.from(filter).toString("base64");
}

function friendlyFilterString(filter: string): string {
  return filter.match('request_uri:"(.*)"')?.[1] ?? filter;
}

export async function handler(): Promise<boolean> {
  const filters = (await query("select distinct filter from key_figures")) as {
    filter: string;
  }[];
  logger.info({
    message: filters.toString(),
    method: "create-visualizations.handler",
  });

  const bucketName = BUCKET_NAME;
  await uploadToS3(
    s3,
    bucketName,
    await createIndex(),
    `index.html`,
    undefined,
    "text/html",
  );

  for (const row of filters) {
    const filter = row.filter;
    logger.info({
      message: `Processing: ${filter}`,
      method: "create-visualizations.handler",
    });
    await uploadToS3(
      s3,
      bucketName,
      await createDetailPage(filter),
      `${base64encodeFilter(filter)}.html`,
      undefined,
      "text/html",
    );
  }

  return Promise.resolve(true);
}
