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
    // The correct way to access the function from the library
    const projection = geoAlbersUsaTerritories()
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

    // Define the breedingPrograms variable in a higher scope
    let breedingPrograms = {};

    // Load the CSV data and US map data
    Promise.all([
        d3.csv("https://plantbreeding.cc/assets/data/reps.csv"),
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    ]).then(function([csvData, us]) {
        // Process CSV data to format we need
        breedingPrograms = processBreedingData(csvData);
        
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

    // Include the missing processBreedingData and getStateAbbr functions
    function processBreedingData(csvData) {
        const programs = {};
        
        csvData.forEach(row => {
            const state = row.state;
            if (!programs[state]) {
                programs[state] = {
                    count: 0,
                    people: []
                };
            }
            
            programs[state].count++;
            programs[state].people.push({
                name: row.name,
                isLead: row.lead === "1" || row.lead === "yes" || row.lead === "true"
            });
        });
        
        return programs;
    }
    
    function getStateAbbr(fipsCode) {
        const fipsToState = {
            "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", 
            "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", 
            "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", 
            "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", 
            "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", 
            "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH", 
            "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", 
            "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", 
            "54": "WV", "55": "WI", "56": "WY", "72": "PR"
        };
        return fipsToState[fipsCode];
    }
    
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