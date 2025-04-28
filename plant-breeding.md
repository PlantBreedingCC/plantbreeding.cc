---
layout: article
title: Plant Breeding
key: page-plant-breeding
---

## Map of plant breeding programs

<div id="us-map-container" style="width: 100%; height: 500px;"></div>

<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://d3js.org/topojson.v3.min.js"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Map dimensions
    const width = document.getElementById('us-map-container').offsetWidth;
    const height = 500;
    
    // Plant breeding program data by state
    const breedingPrograms = {
        "AL": { count: 2, institutions: ["Auburn University", "Alabama A&M University"] },
        "CA": { count: 5, institutions: ["UC Davis", "UC Riverside", "Cal Poly SLO", "Fresno State", "Stanford"] },
        "FL": { count: 3, institutions: ["University of Florida", "Florida A&M", "Florida State"] },
        "IA": { count: 2, institutions: ["Iowa State University", "University of Iowa"] },
        "NY": { count: 4, institutions: ["Cornell University", "SUNY", "Columbia", "NYU"] },
        // Add data for other states as needed
    };
    
    // Create SVG
    const svg = d3.select('#us-map-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
        
    // Define map projection
    const projection = d3.geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
        
    // Define path generator
    const path = d3.geoPath()
        .projection(projection);
        
    // Create tooltip div
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "3px")
        .style("padding", "10px")
        .style("pointer-events", "none");
        
    // Load US map data
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(function(us) {
        // Draw states
        svg.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", function(d) {
                // Get state ID
                const stateId = d.id;
                // Convert numeric ID to state abbreviation
                const stateAbbr = getStateAbbr(stateId);
                // Color based on whether state has data
                return breedingPrograms[stateAbbr] ? "#4CAF50" : "#e0e0e0";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                // Get state abbreviation
                const stateId = d.id;
                const stateAbbr = getStateAbbr(stateId);
                
                // Debug: Log state ID and abbreviation to console
                console.log("Hovering state ID:", stateId, "Abbreviation:", stateAbbr);
                
                const data = breedingPrograms[stateAbbr];
                
                // Change fill color on hover
                d3.select(this).attr("fill", "#2E7D32");
                
                // Show tooltip with data if available
                if (data) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    
                    let tooltipContent = `<strong>${getStateName(stateAbbr)}</strong><br>
                                         Programs: ${data.count}<br>
                                         Institutions:<br>
                                         ${data.institutions.join("<br>")}`;
                                         
                    tooltip.html(tooltipContent)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function(event, d) {
                // Fix: Ensure 'd' is properly accessed
                const stateId = d.id;
                const stateAbbr = getStateAbbr(stateId);
                
                // Debug: Log state ID on mouseout
                console.log("Leaving state ID:", stateId, "Abbreviation:", stateAbbr);
                
                d3.select(this).attr("fill", breedingPrograms[stateAbbr] ? "#4CAF50" : "#e0e0e0");
                
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });
    
    // Helper function to convert state ID to abbreviation
    function getStateAbbr(stateId) {
        // Convert stateId to string to ensure proper lookup
        stateId = stateId.toString();
        
        const states = {
            "1": "AL", "2": "AK", "4": "AZ", "5": "AR", "6": "CA", "8": "CO", "9": "CT",
            "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
            "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
            "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
            "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
            "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
            "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
            "55": "WI", "56": "WY"
        };
        
        // Debug: Check if state ID exists in our mapping
        if (!states[stateId]) {
            console.warn("Missing state ID mapping:", stateId);
        }
        
        return states[stateId];
    }
    
    // Helper function to get full state name
    function getStateName(stateAbbr) {
        const stateNames = {
            "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
            "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
            "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
            "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
            "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
            "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
            "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
            "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
            "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
            "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
            "DC": "District of Columbia"
        };
        return stateNames[stateAbbr] || stateAbbr;
    }
});
</script>

<style>
.tooltip {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}
</style>

