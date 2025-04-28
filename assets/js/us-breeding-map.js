document.addEventListener('DOMContentLoaded', function() {
    // Map dimensions
    const width = document.getElementById('us-map-container').offsetWidth;
    const height = 500;

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

    // Load the CSV data and US map data in parallel
    Promise.all([
        d3.csv("https://plantbreeding.cc/assets/data/reps.csv"),
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    ]).then(function([csvData, us]) {
        // Process CSV data to format we need
        const breedingPrograms = processBreedingData(csvData);
        
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
            })
            .on("mouseout", function(event, d) {
                // Fix: Ensure 'd' is properly accessed
                const stateId = d.id;
                const stateAbbr = getStateAbbr(stateId);
                                
                d3.select(this).attr("fill", breedingPrograms[stateAbbr] ? "#4CAF50" : "#e0e0e0");
                
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    });

    // Process CSV data into the format we need for the map
    function processBreedingData(csvData) {
        let programs = {};
        
        csvData.forEach(function(row) {
            const state = row.state;
            const isLead = row.isLead === "TRUE" || row.isLead === "true" || row.isLead === true;
            
            // Initialize the state if it doesn't exist yet
            if (!programs[state]) {
                programs[state] = {
                    count: 0,
                    people: []
                };
            }
            
            // Add person to the state data
            programs[state].people.push({
                name: row.name || row.person || row.representative || row.rep,
                isLead: isLead
            });
            
            // Increment count
            programs[state].count++;
        });
        
        return programs;
    }
    
    // Helper function to convert state ID to abbreviation
    function getStateAbbr(stateId) {
        // Convert stateId to string to ensure proper lookup
        stateId = stateId.toString();
        
        const states = {
            "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
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