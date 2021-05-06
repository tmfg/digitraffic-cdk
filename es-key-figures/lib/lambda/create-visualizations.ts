import {uploadToS3} from "digitraffic-common/stack/s3-utils";

interface KeyFigure {
  filter: string
  value: any
  name: string
  from: Date
  to: Date
  id: number
  query: string
}

const mysql = require('mysql');
const util = require('util');
const conn = mysql.createConnection({
  host: process.env.MYSQL_ENDPOINT,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});
// const conn = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'jaakko',
//   database: 'key_figures'
// });
const query = util.promisify(conn.query).bind(conn)

const createGraph = function (id: string, otsikko: string, data: any): string {
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

const topDataToGraphData = function (data: KeyFigure[]): { values: [Date, number][]; key: string }[] {
  const output: { [key: string]: [Date, number][] } = {}
  for (const rivi of data) {
    const valueJson = JSON.parse(rivi.value)
    for (const key of Object.keys(valueJson)) {
      if (output[key] == null) {
        output[key] = []
      }

      output[key].push([rivi.from, valueJson[key]])
    }
  }

  const highlightData: { values: [Date, number][]; key: string }[] = []

  for (const key of Object.keys(output)) {
    highlightData.push({key: key, values: output[key]})
  }

  return highlightData
}

const endDataToGraphData = function (data: KeyFigure[]): { values: [Date, number][]; key: string }[] {
  const output: { [key: string]: [Date, number][] } = {}
  for (const rivi of data) {
    const value = rivi.value as number
    if (output[rivi.filter] == null) {
      output[rivi.filter] = []
    }
    output[rivi.filter].push([rivi.from, value])
  }

  const highlightData: { values: [Date, number][]; key: string }[] = []

  for (const key of Object.keys(output)) {
    highlightData.push({key: friendlyFilterString(key), values: output[key]})
  }

  return highlightData
}

const createDetailPage = async function (filter: string): Promise<string> {
  const html = `
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
        ${createGraph("requests", `Requests (${friendlyFilterString(filter)})`, `{key:'Requests', values: [${(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Http req' order by \`from\` asc`))
    .map((s: { from: Date; value: number; }) => `[${s.from.getTime()}, ${Number(s.value)}]`)} ] }`)} 
        ${createGraph("bytesOut", `Bytes out (${friendlyFilterString(filter)})`, `{key:'Bytes out', values: [${(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Bytes Out' order by \`from\` asc`))
    .map((s: { from: Date; value: number; }) => `[${s.from.getTime()}, ${Number(s.value)}]`)} ] }`)}
        ${createGraph("uniqueIPs", `Unique IPs (${friendlyFilterString(filter)})`, `{key:'Unique IPs', values: [${(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Unique IPs' order by \`from\` asc`))
    .map((s: { from: Date; value: number; }) => `[${s.from.getTime()}, ${Number(s.value)}]`)} ] }`)}            
        ${createGraph("top10digitrafficUsers", `Top 10 Digitraffic-Users (${friendlyFilterString(filter)})`, topDataToGraphData(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 digitraffic-users' order by \`from\` asc`))
    .map(s => `{key:'${s.key}', values: [${s.values.map(o => `[${o[0].getTime()}, ${o[1]}]`)} ] }`))}
        ${createGraph("top10IPs", `Top 10 IPs (${friendlyFilterString(filter)})`, topDataToGraphData(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 IPs' order by \`from\` asc`))
    .map(s => `{key:'${s.key}', values: [${s.values.map(o => `[${o[0].getTime()}, ${o[1]}]`)} ] }`))}
        ${createGraph("top10userAgents", `Top 10 User agents (${friendlyFilterString(filter)})`, topDataToGraphData(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 User Agents' order by \`from\` asc`))
    .map(s => `{key:'${s.key}', values: [${s.values.map(o => `[${o[0].getTime()}, ${o[1]}]`)} ] }`))}
        ${createGraph("top10referers", `Top 10 Referers (${friendlyFilterString(filter)})`, topDataToGraphData(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Top 10 Referers' order by \`from\` asc`))
    .map(s => `{key:'${s.key}', values: [${s.values.map(o => `[${o[0].getTime()}, ${o[1]}]`)} ] }`))}
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

  return html
}

const createIndex = async function (): Promise<string> {
  const filter = '@transport_type:*'

  const filters: { filter: string }[] = await query("select distinct filter from key_figures")
  let roadFilterHtml = ''
  for (let row of filters.filter(s => s.filter.includes('transport_type:road'))) {
    roadFilterHtml += `<li><a href="${base64encodeFilter(row.filter)}.html">${friendlyFilterString(row.filter)}</a></li>`
  }
  let railFilterHtml = ''
  for (let row of filters.filter(s => s.filter.includes('transport_type:rail'))) {
    railFilterHtml += `<li><a href="${base64encodeFilter(row.filter)}.html">${friendlyFilterString(row.filter)}</a></li>`
  }
  let marineFilterHtml = ''
  for (let row of filters.filter(s => s.filter.includes('transport_type:marine'))) {
    marineFilterHtml += `<li><a href="${base64encodeFilter(row.filter)}.html">${friendlyFilterString(row.filter)}</a></li>`
  }

  const html = `
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
        ${createGraph("requests", `Requests`, `{key:'Requests', values: [${(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Http req' order by \`from\` asc`))
    .map((s: { from: Date; value: number; }) => `[${s.from.getTime()}, ${Number(s.value)}]`)} ] }`)} 
        ${createGraph("bytesOut", `Bytes out`, `{key:'Bytes out', values: [${(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Bytes Out' order by \`from\` asc`))
    .map((s: { from: Date; value: number; }) => `[${s.from.getTime()}, ${Number(s.value)}]`)} ] }`)}
        ${createGraph("uniqueIPs", `Unique IPs`, `{key:'Unique IPs', values: [${(await query(`select value, \`from\` from key_figures where filter = '${filter}' and name = 'Unique IPs' order by \`from\` asc`))
    .map((s: { from: Date; value: number; }) => `[${s.from.getTime()}, ${Number(s.value)}]`)} ] }`)}            
        ${createGraph("roadEndpoints", `Road Requests`, endDataToGraphData(await query(`select * from key_figures where filter like '@transport_type:road AND %' and name = 'Http req' and value > 50000 order by \`from\` asc`))
    .map(s => `{key:'${s.key}', values: [${s.values.map(o => `[${o[0].getTime()}, ${o[1]}]`)} ] }`))}         
        ${createGraph("railEndpoints", `Rail Requests`, endDataToGraphData(await query(`select * from key_figures where filter like '@transport_type:rail AND %' and name = 'Http req' and value > 50000 order by \`from\` asc`))
    .map(s => `{key:'${s.key}', values: [${s.values.map(o => `[${o[0].getTime()}, ${o[1]}]`)} ] }`))}   
        ${createGraph("marineEndpoints", `Marine Requests`, endDataToGraphData(await query(`select * from key_figures where filter like '@transport_type:marine AND %' and name = 'Http req' and value > 50000 order by \`from\` asc`))
    .map(s => `{key:'${s.key}', values: [${s.values.map(o => `[${o[0].getTime()}, ${o[1]}]`)} ] }`))}                   
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
      <div class="road-links"><h1>Road details</h1><ul>${roadFilterHtml}</ul></div>
      <div class="rail-links"><h1>Rail details</h1><ul>${railFilterHtml}</ul></div>
      <div class="marine-links"><h1>Marine details</h1><ul>${marineFilterHtml}</ul></div>
  
  </div>
  <footer>
    <span>Details for whole service <a href="${base64encodeFilter('@transport_type:*')}.html">here</a>. Graphs only show endpoints which receive over 50k requests. Last updated: ${new Date().toISOString()}</span>
  </footer>
  </body>
  </html>
`;

  return html
}

const base64encodeFilter = function (filter: string): string {
  return Buffer.from(filter).toString('base64');
}

const friendlyFilterString = function (filter: string): string {
  return filter.match('request_uri:"(.*)"')?.[1] ?? filter
}

export const handler = async () => {
  const filters: { filter: string }[] = await query("select distinct filter from key_figures")
  console.log(filters)

  let bucketName = 'eskeyfiguresstackprod-eskeyfigurevisualizationsed-tbpqoiyk33bw';
  uploadToS3(bucketName, await createIndex(), `index.html`, undefined, 'text/html')

  for (let row of filters) {
    const filter = row.filter
    console.log(`Processing: ${filter}`)
    uploadToS3(bucketName, await createDetailPage(filter), `${base64encodeFilter(filter)}.html`, undefined, 'text/html')
  }

  return new Promise((resolve, reject) => resolve(true));
};
