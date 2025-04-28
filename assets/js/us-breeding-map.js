document.addEventListener('DOMContentLoaded', function() {
    // Map dimensions
    const width = document.getElementById('us-map-container').offsetWidth;
    const height = 500;

    // Create SVG
    const svg = d3.select('#us-map-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Use geoAlbersUsaTerritories projection that includes Puerto Rico
    const projection = d3.geoAlbersUsaTerritories()
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

    // Load the CSV data and US map data
    Promise.all([
        d3.csv("https://plantbreeding.cc/assets/data/reps.csv"),
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
        // We'll use the standard states file with the special projection instead of loading territories separately
    ]).then(function([csvData, us]) {
        // Process CSV data to format we need
        const breedingPrograms = processBreedingData(csvData);
        
        // Draw all states and territories including PR
        svg.append("g")
            .selectAll("path.state")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("d", path)
            .attr("fill", function(d) {
                const stateId = d.id;
                const stateAbbr = stateId === "72" ? "PR" : getStateAbbr(stateId);
                return breedingPrograms[stateAbbr] ? "#4CAF50" : "#e0e0e0";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);
    });

    function handleMouseOver(event, d) {
        // Get state abbreviation
        const stateId = d.id;
        const stateAbbr = stateId === "72" ? "PR" : getStateAbbr(stateId);
        const data = breedingPrograms[stateAbbr];
        
        // Change fill color on hover
        d3.select(this).attr("fill", "#2E7D32");
        
        // Show tooltip with data if available
        if (data) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            
            // Create HTML for the list of people, with leads marked by parentheses
            const peopleList = data.people.map(person => 
                person.isLead ? `${person.name} (Lead)` : person.name
            ).join("<br>");
            
            let tooltipContent = `<strong>${getStateName(stateAbbr)}</strong><br>
                                 Representatives: ${data.count}<br>
                                 ${peopleList}`;
                                 
            tooltip.html(tooltipContent)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        }
    }
    
    function handleMouseOut(event, d) {
        const stateId = d.id;
        const stateAbbr = stateId === "72" ? "PR" : getStateAbbr(stateId);
                        
        d3.select(this).attr("fill", breedingPrograms[stateAbbr] ? "#4CAF50" : "#e0e0e0");
        
        // Hide tooltip
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    // Rest of your code (processBreedingData, getStateAbbr) remains the same
    
    // Update getStateName to include Puerto Rico
    function getStateName(stateAbbr) {
        const stateNames = {
            "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
            "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
            "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
            "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
            "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
            "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
            "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
            "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "PR": "Puerto Rico", "RI": "Rhode Island", 
            "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", 
            "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", 
            "WY": "Wyoming", "DC": "District of Columbia"
        };
        return stateNames[stateAbbr] || stateAbbr;
    }
});