// Data: Map state names to representatives
const stateIdToName = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY"
};

const stateData = {
    "AL": "John Doe",
    "AK": "Jane Smith",
    "AZ": "Richard Roe",
    "AR": "Emily Davis",
    "CA": "Michael Johnson"
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
        const stateId = d.id; // Get the state ID from the GeoJSON data
        const stateName = stateIdToName[stateId]; // Map the ID to the state abbreviation
        const representative = stateData[stateName] || "No representative"; // Get the representative
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