const width = window.innerWidth * 0.9,
height = window.innerHeight * 0.7,
margin = { top: 20, bottom: 50, left: 150, right: 40 },
radius = 4.5,
paddingInner = 0.2,
rectColorScale = d3.scaleOrdinal(d3.schemeTableau10),
circleColorScale = d3.scaleOrdinal(d3.schemeCategory10);

let svgMap;
let svgGraph;
let xScale;
let yScale;
let xAxis;
let yAxis;
let projection;
let path;
let tooltip;

let state = {
    geojson: null,
    worldCupData: null,
    selectedYear: "2018",
};

Promise.all([
    d3.json("countries.json"),
    d3.csv("worldCupData.csv", d => ({
      year: d.year,
      country: d.country,
      total: +d.total,
      players: +d.players,
      percentage: +d.percentage,
      lat: +d.latitude,
      long: +d.longitude,
    })),
]).then(([geojson, worldCupData]) => {
    state.geojson = geojson;
    state.worldCupData = worldCupData;
    init();
});

function init() {

const selectElement = d3.select("#dropdown").on("change", function() {
  state.selectedYear = this.value;
  draw();
});

selectElement
  .selectAll("option")
  .data([
    ...Array.from(new Set(state.worldCupData.map(d => d.year))),
  ])
  .join("option")
  .attr("value", d => d)
  .text(d => d);

selectElement.property("value", "2018");

projection = d3.geoNaturalEarth1().fitSize([width, height], state.geojson);
path = d3.geoPath().projection(projection);

svgMap = d3
  .select("#d3-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

svgMap
  .selectAll(".world")
  .data(state.geojson.features)
  .join("path")
  .attr("d", path)
  .attr("class", "world");

svgGraph = d3
  .select("#d3-container2")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("position", "relative");

xScale = d3
  .scaleLinear()
  .domain([0, d3.max(state.worldCupData, d => d.players)])
  .range([margin.left, width - margin.right]);

yScale = d3
  .scaleBand()
  .domain(state.worldCupData.map(d => d.country))
  .range([margin.top, height - margin.bottom])
  .paddingInner(paddingInner);

xAxis = d3.axisBottom(xScale);  
yAxis = d3.axisLeft(yScale);

svgGraph
  .append("g")
  .attr("class", "axis x-axis")
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(xAxis)
  .append("text")
  .attr("class", "axis-label")
  .attr("x", "50%")
  .attr("dy", "3em")
  .text("Number of Players");

svgGraph
  .append("g")
  .attr("class", "axis y-axis")
  .attr("transform", `translate(${margin.left},0)`)
  .call(yAxis)
  .append("text")
  .attr("class", "axis-label")
  .attr("y", "50%")
  .attr("dx", "-6em")
  .attr("writing-mode", "vertical-rl")
  .text("Country");

tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .attr("width", 100)
  .attr("height", 100)
  .style("position", "absolute")
  .style("opacity", 0);
  
draw();
}

function draw() {

let filteredData;
if (state.selectedYear !== null) {
  filteredData = state.worldCupData.filter(d => d.year === state.selectedYear);
}

svgMap
  .selectAll(".circle")
  .data(filteredData, d => d.year)
  .join(
    enter =>
      enter
        .append("circle")
        .attr("class", "circle")
        .attr("r", radius)
        .attr("cx", function(d) {
          return projection([d.long, d.lat])[0];
        })
        .attr("cy", function(d) {
          return projection([d.long, d.lat])[1];
        })
        .attr("fill", d => {return circleColorScale(d.country)})
        .on("mouseover", d => {
          tooltip
          .html("Country: " + "<strong>" + d.country + "</strong>"
          + "<br/>" + "Total Number of Players: " 
          + "<strong>" + d.players + "</strong>" 
          + "<br/>" + "Percent of All Players: " 
          + "<strong>" + d.percentage + "%" + "</strong>")
          .transition()
          .duration(200)
          .style("opacity", 1);
        })
        .on("mouseout", d => {
          tooltip
          .transition()
          .duration(100)
          .style("opacity", 0)
        })
        .on("mousemove", d => {
          d3.select(".tooltip")
          .style("left", (d3.event.pageX+10) + "px")
          .style("top", (d3.event.pageY+10) + "px")
        }),
    update => update,
    exit =>
        exit.call(exit =>
          exit 
            .transition()
            .duration(500)
            .attr("cx", width)
            .remove()
        )
  )
  .call(
    selection =>
      selection
        .transition()
        .duration(500)
        .attr("cy", function(d) {
          return projection([d.long, d.lat])[1];
        }),
  );

/*xScale.domain([0, d3.max(filteredData, d => d.players)])

d3.select("g.x-axis")
  .transition()
  .duration(1000)
  .call(xAxis.scale(xScale));*/


yScale.domain(filteredData.map(d => d.country))
  
d3.select("g.y-axis")
  .transition()
  .duration(1000)
  .call(yAxis.scale(yScale));

const rect = svgGraph
  .selectAll(".rect")
  .data(filteredData, d => d.year)
  .join(
    enter => enter
      .append("rect")
      .attr("class", "rect")
      .attr("x", margin.left)
      .attr("y", d => yScale(d.country))
      .attr("width", d => xScale(d.players) - margin.left)
      .attr("height", d => yScale.bandwidth())
      .attr("fill", d => {return rectColorScale(d.country)})
      .on("mouseover", d => {
        tooltip
        .html("Country: " + "<strong>" + d.country + "</strong>"
        + "<br/>" + "Total Number of Players: " 
        + "<strong>" + d.players + "</strong>" 
        + "<br/>" + "Percent of All Players: " 
        + "<strong>" + d.percentage + "%" + "</strong>")
        .transition()
        .duration(200)
        .style("opacity", 1)
      })
      .on("mouseout", d => {
        tooltip
        .transition()
        .duration(100)
        .style("opacity", 0)
      })
      .on("mousemove", d => {
        d3.select(".tooltip")
        .style("left", (d3.event.pageX+10) + "px")
        .style("top", (d3.event.pageY+10) + "px")
      }),
      update => update,
      exit =>
        exit.call(exit =>
          exit
            .transition()
            .delay(d => d.players)
            .duration(500)
            .attr("x", width)
            .remove()
        )
    )
    .call(
      selection =>
        selection
          .transition()
          .duration(500)
          .attr("x", margin.left)
          .attr("y", d => yScale(d.country))
          .attr("width", d => xScale(d.players) - margin.left)
          .attr("height", d => yScale.bandwidth()));

}