// Data: Map state names to representatives
const stateData = {
    "AL": "John Doe",
    "AK": "Jane Smith",
    "AZ": "Richard Roe",
    "AR": "Emily Davis",
    "CA": "Michael Johnson",
    // Add all other states here...
  };
  
  // Set dimensions for the map
  const width = 960;
  const height = 600;
  
  // Create an SVG element
  const svg = d3.select("#us-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  
  // Load GeoJSON data for the USA
  d3.json("https://d3js.org/us-10m.v1.json").then(us => {
    const projection = d3.geoAlbersUsa().scale(1280).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);
  
    // Draw the states
    svg.append("g")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .attr("fill", "#ccc")
      .attr("stroke", "#333")
      .attr("d", path)
      .on("mouseover", function (event, d) {
        const stateName = d.properties.name;
        const representative = stateData[stateName] || "No representative";
        d3.select("#tooltip")
          .style("visibility", "visible")
          .html(`<strong>${stateName}</strong><br>${representative}`);
      })
      .on("mousemove", function (event) {
        d3.select("#tooltip")
          .style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("visibility", "hidden");
      });
  });
  
  // Add a tooltip
  d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("visibility", "hidden");