document.addEventListener('DOMContentLoaded', function() {
    // Map dimensions
    const width = document.getElementById('us-map-container').offsetWidth;
    const height = 500;
    
    // Global variables for filtering
    let allBreedingPrograms = {};
    let filteredBreedingPrograms = {};
    let activeCrop = null;
    let selectedState = null;
    let colorScale = null;

    // Create crop filter buttons container
    const buttonContainer = d3.select('#us-map-container')
        .append('div')
        .attr('id', 'crop-filter-buttons')
        .style('margin-top', '20px')
        .style('text-align', 'center');

    // Create SVG
    const svg = d3.select('#us-map-container')
        .insert('svg', '#crop-filter-buttons')
        .attr('width', width)
        .attr('height', height);
        
    // Define map projection
    const projection = geoAlbersUsaTerritories.geoAlbersUsaTerritories()
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
        d3.csv("assets/data/breeding-programs.csv"),
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
    ]).then(function([csvData, us]) {
        // Process CSV data to format we need
        allBreedingPrograms = processBreedingData(csvData);
        filteredBreedingPrograms = { ...allBreedingPrograms };
        
        // Create crop filter buttons
        createCropFilterButtons(csvData);
        
        // Draw the map
        updateColorScale();
        drawMap(us);
    });

    // Process CSV data into the format we need for the map
    function processBreedingData(csvData) {
        let programs = {};
        
        csvData.forEach(function(row) {
            const state = row.state;
            
            // Initialize the state if it doesn't exist yet
            if (!programs[state]) {
                programs[state] = {
                    count: 0,
                    people: []
                };
            }
            
            // Add person to the state data
            programs[state].people.push({
                name: row.Name,
                crop: row.crop_general,
                cropSpecific: row.crop_specific,
                organization: row.Org
            });
            
            // Increment count
            programs[state].count++;
        });
        
        return programs;
    }
    
    // Get crop icon mapping
    function getCropIcon(crop) {
        const cropIcons = {
            'Alfalfa': '🌱',
            'Apple': '🍎',
            'Barley': '🌾',
            'Beans': '🫘',
            'Blueberry': '🫐',
            'Canola': '🌻',
            'Cherry': '🍒',
            'Citrus': '🍊',
            'Corn': '🌽',
            'Cotton': '☁️',
            'Cover crops': '🌿',
            'Cranberry': '🫐',
            'Cucurbits': '🥒',
            'Forage': '🌱',
            'Grapes': '🍇',
            'Grasses': '🌾',
            'Hemp': '🌿',
            'Hops': '🍺',
            'Kiwiberry': '🥝',
            'Leafy vegetables': '🥬',
            'Melons': '🍈',
            'Mint': '🌿',
            'Oats': '🌾',
            'Onion': '🧅',
            'Ornamentals': '🌺',
            'Peach': '🍑',
            'Peanut': '🥜',
            'Peas': '🟢',
            'Pecan': '🌰',
            'Peppers': '🌶️',
            'Pine': '🌲',
            'Plum': '🟣',
            'Potato': '🥔',
            'Pulses': '🫘',
            'Raspberry': '🫐',
            'Rice': '🍚',
            'Sorghum': '🌾',
            'Soybean': '🌱',
            'Specialty': '🌟',
            'Strawberry': '🍓',
            'Sunflower': '🌻',
            'Sweetcorn': '🌽',
            'Tomato': '🍅',
            'Triticale': '🌾',
            'Turf': '🌱',
            'Wheat': '🌾'
        };
        return cropIcons[crop] || '🌿'; // Default plant icon
    }

    // Create crop filter buttons
    function createCropFilterButtons(csvData) {
        // Count occurrences of each crop
        const cropCounts = {};
        csvData.forEach(d => {
            const crop = d.crop_general;
            cropCounts[crop] = (cropCounts[crop] || 0) + 1;
        });
        
        // Separate crops with multiple entries from single entries
        const majorCrops = [];
        const specialtyCrops = [];
        
        Object.keys(cropCounts).forEach(crop => {
            if (cropCounts[crop] > 1) {
                majorCrops.push(crop);
            } else {
                specialtyCrops.push(crop);
            }
        });
        
        // Sort major crops and add Specialty if there are single-entry crops
        const crops = majorCrops.sort();
        
        // Only add a grouped "Specialty" button if:
        // 1. There are single-entry crops, AND
        // 2. "Specialty" is not already in the major crops list
        if (specialtyCrops.length > 0 && !majorCrops.includes('Specialty')) {
            crops.push('Specialty');
        }
        
        // Add "All Crops" button
        buttonContainer.append('button')
            .html('🌾 All Crops')
            .attr('class', 'crop-filter-btn active')
            .style('margin', '5px')
            .style('padding', '8px 16px')
            .style('background-color', '#3A506B')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '4px')
            .style('cursor', 'pointer')
            .on('click', function() {
                setActiveCrop(null);
                updateButtons(this);
                
                // Reset state selection when filtering
                selectedState = null;
                clearButtonHighlights();
                
                updateMap();
            });
        
        // Add buttons for each crop
        crops.forEach(crop => {
            const icon = getCropIcon(crop);
            buttonContainer.append('button')
                .html(`${icon} ${crop}`)
                .attr('class', 'crop-filter-btn')
                .style('margin', '5px')
                .style('padding', '8px 16px')
                .style('background-color', '#e0e0e0')
                .style('color', '#333')
                .style('border', 'none')
                .style('border-radius', '4px')
                .style('cursor', 'pointer')
                .on('click', function() {
                    setActiveCrop(crop);
                    updateButtons(this);
                    
                    // Reset state selection when filtering
                    selectedState = null;
                    clearButtonHighlights();
                    
                    updateMap();
                });
        });
    }
    
    // Set active crop filter
    function setActiveCrop(crop) {
        activeCrop = crop;
        
        if (crop === null) {
            // Show all crops
            filteredBreedingPrograms = { ...allBreedingPrograms };
        } else if (crop === 'Specialty') {
            // Filter by specialty crops (crops with only one entry)
            filteredBreedingPrograms = {};
            
            // First, determine which crops are specialty crops
            const cropCounts = {};
            Object.values(allBreedingPrograms).forEach(stateData => {
                stateData.people.forEach(person => {
                    const cropName = person.crop;
                    cropCounts[cropName] = (cropCounts[cropName] || 0) + 1;
                });
            });
            
            const specialtyCropNames = Object.keys(cropCounts).filter(cropName => cropCounts[cropName] === 1);
            
            Object.keys(allBreedingPrograms).forEach(state => {
                const filteredPeople = allBreedingPrograms[state].people.filter(person => 
                    specialtyCropNames.includes(person.crop)
                );
                
                if (filteredPeople.length > 0) {
                    filteredBreedingPrograms[state] = {
                        count: filteredPeople.length,
                        people: filteredPeople
                    };
                }
            });
        } else {
            // Filter by selected crop
            filteredBreedingPrograms = {};
            
            Object.keys(allBreedingPrograms).forEach(state => {
                const filteredPeople = allBreedingPrograms[state].people.filter(person => person.crop === crop);
                
                if (filteredPeople.length > 0) {
                    filteredBreedingPrograms[state] = {
                        count: filteredPeople.length,
                        people: filteredPeople
                    };
                }
            });
        }
    }
    
    // Highlight buttons based on available crops in a state
    function highlightButtonsForState(stateAbbr) {
        // Clear any existing highlights
        clearButtonHighlights();
        
        if (!allBreedingPrograms[stateAbbr]) return;
        
        // Get unique crops in this state
        const stateCrops = [...new Set(allBreedingPrograms[stateAbbr].people.map(person => person.crop))];
        
        // Count total occurrences of each crop across all states
        const globalCropCounts = {};
        Object.values(allBreedingPrograms).forEach(stateData => {
            stateData.people.forEach(person => {
                const cropName = person.crop;
                globalCropCounts[cropName] = (globalCropCounts[cropName] || 0) + 1;
            });
        });
        
        // Determine which crops should highlight the Specialty button
        const specialtyCropsInState = stateCrops.filter(crop => globalCropCounts[crop] === 1);
        
        // Highlight buttons for crops available in this state
        d3.selectAll('.crop-filter-btn').each(function() {
            const buttonText = d3.select(this).text();
            const cropName = buttonText.replace(/^.+?\s/, ''); // Remove emoji and space
            
            // Check if this button should be highlighted
            let shouldHighlight = false;
            
            if (cropName === 'Specialty' && specialtyCropsInState.length > 0) {
                shouldHighlight = true;
            } else if (stateCrops.includes(cropName) && globalCropCounts[cropName] > 1) {
                shouldHighlight = true;
            }
            
            if (shouldHighlight) {
                d3.select(this)
                    .style('box-shadow', '0 0 10px #FFD700')
                    .style('border', '2px solid #FFD700');
            }
        });
    }
    
    // Clear button highlights
    function clearButtonHighlights() {
        d3.selectAll('.crop-filter-btn')
            .style('box-shadow', 'none')
            .style('border', 'none');
    }
    
    // Update button styles
    function updateButtons(activeButton) {
        d3.selectAll('.crop-filter-btn')
            .style('background-color', '#e0e0e0')
            .style('color', '#333')
            .classed('active', false);
        
        d3.select(activeButton)
            .style('background-color', '#3A506B')
            .style('color', 'white')
            .classed('active', true);
    }
    
    // Compute a sequential color scale based on current filtered program counts
    function updateColorScale() {
        const counts = Object.values(filteredBreedingPrograms).map(d => d.count);
        const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
        colorScale = d3.scaleSequentialLog()
            .domain([1, Math.max(maxCount, 2)])
            .interpolator(t => d3.interpolateBlues(0.4 + 0.6 * t));
    }

    // Return the fill color for a state
    function getStateColor(stateAbbr) {
        const data = filteredBreedingPrograms[stateAbbr];
        if (!data) return "#e0e0e0";
        if (activeCrop !== null) return "#3A506B";
        return colorScale ? colorScale(data.count) : "#3A506B";
    }

    // Draw or redraw the color-scale legend
    function drawLegend() {
        svg.select("#map-legend").remove();

        const counts = Object.values(filteredBreedingPrograms).map(d => d.count);
        if (counts.length === 0 || !colorScale || activeCrop !== null) return;

        const maxCount = Math.max(...counts);
        const legendWidth = 160;
        const legendHeight = 12;
        const legendX = 10;
        const legendY = height - 42;

        // Ensure a <defs> element exists
        let defs = svg.select("defs");
        if (defs.empty()) defs = svg.append("defs");

        // (Re)create the linear gradient
        defs.select("#legend-gradient").remove();
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        const numStops = 12;
        for (let i = 0; i <= numStops; i++) {
            const t = i / numStops;
            linearGradient.append("stop")
                .attr("offset", `${t * 100}%`)
                .attr("stop-color", colorScale(1 + t * (maxCount - 1)));
        }
    }

    // Draw the map
    function drawMap(us) {
        // Clear existing paths
        svg.selectAll("path").remove();
        
        // Draw states
        svg.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", function(d) {
                const stateAbbr = getStateAbbr(d.id);
                return getStateColor(stateAbbr);
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .style("cursor", "pointer")
            .on("click", function(event, d) {
                // Get state abbreviation
                const stateId = d.id;
                const stateAbbr = getStateAbbr(stateId);
                
                // If a crop filter is active, reset it when clicking a state
                if (activeCrop !== null) {
                    // Reset crop filter to "All Crops"
                    setActiveCrop(null);
                    
                    // Update button styles to show "All Crops" as active
                    d3.selectAll('.crop-filter-btn')
                        .style('background-color', '#e0e0e0')
                        .style('color', '#333')
                        .classed('active', false);
                    
                    d3.selectAll('.crop-filter-btn')
                        .filter(function() {
                            return d3.select(this).text().includes('All Crops');
                        })
                        .style('background-color', '#3A506B')
                        .style('color', 'white')
                        .classed('active', true);
                    
                    // Update map with reset filter
                    updateMap();
                }
                
                // Toggle state selection
                if (selectedState === stateAbbr) {
                    // Deselect state
                    selectedState = null;
                    clearButtonHighlights();
                    // Reset stroke
                    d3.select(this).attr("stroke-width", 0.5);
                } else {
                    // Select new state
                    selectedState = stateAbbr;
                    
                    // Reset all stroke widths first
                    svg.selectAll("path").attr("stroke-width", 0.5);
                    
                    // Highlight selected state with thicker border
                    d3.select(this).attr("stroke-width", 3);
                    
                    // Highlight relevant crop buttons
                    highlightButtonsForState(stateAbbr);
                }
                
                // Stop event propagation
                event.stopPropagation();
            })
            .on("mouseover", function(event, d) {
                // Get state abbreviation
                const stateId = d.id;
                const stateAbbr = getStateAbbr(stateId);               
                const data = filteredBreedingPrograms[stateAbbr];
                
                // Change fill color on hover
                d3.select(this).attr("fill", "#1C2541");
                
                // Show tooltip with data if available
                if (data) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    
                    // Create HTML for the list of people grouped by institution
                    const institutionGroups = {};
                    
                    // Group people by institution
                    data.people.forEach(person => {
                        if (!institutionGroups[person.organization]) {
                            institutionGroups[person.organization] = {};
                        }
                        
                        // Group by person name within each institution
                        if (!institutionGroups[person.organization][person.name]) {
                            institutionGroups[person.organization][person.name] = [];
                        }
                        
                        // Use crop_specific if available, otherwise fall back to crop_general
                        const cropDisplay = person.cropSpecific && person.cropSpecific.trim() !== '' 
                            ? person.cropSpecific 
                            : person.crop;
                        
                        // Add crop to this person's list (avoid duplicates)
                        if (!institutionGroups[person.organization][person.name].includes(cropDisplay)) {
                            institutionGroups[person.organization][person.name].push(cropDisplay);
                        }
                    });
                    
                    // Build HTML for each institution group
                    const institutionHTML = Object.keys(institutionGroups).map(institution => {
                        const peopleInInstitution = Object.keys(institutionGroups[institution]).map(personName => {
                            const crops = institutionGroups[institution][personName];
                            const cropsList = crops.join(", ");
                            return `&nbsp;&nbsp;• ${personName} - ${cropsList}`;
                        }).join("<br>");
                        
                        return `<strong>${institution}</strong><br>${peopleInInstitution}`;
                    }).join("<br><br>");
                    
                    let tooltipContent = `<strong>${getStateName(stateAbbr)} (${data.count}) </strong><br><br>
                                         ${institutionHTML}`;
                                         
                    tooltip.html(tooltipContent)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function(event, d) {
                const stateAbbr = getStateAbbr(d.id);
                d3.select(this).attr("fill", getStateColor(stateAbbr));
                
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Draw the legend
        drawLegend();

        // Add click handler to clear selection when clicking on empty space
        svg.on("click", function(event) {
            // Only clear if clicking on the SVG background (not a state)
            if (event.target === this) {
                selectedState = null;
                clearButtonHighlights();
                svg.selectAll("path").attr("stroke-width", 0.5);
            }
        });
    }
    
    // Update the map with current filter
    function updateMap() {
        updateColorScale();
        svg.selectAll("path")
            .transition()
            .duration(300)
            .attr("fill", function(d) {
                const stateAbbr = getStateAbbr(d.id);
                return getStateColor(stateAbbr);
            })
            .attr("stroke-width", function(d) {
                const stateAbbr = getStateAbbr(d.id);
                return selectedState === stateAbbr ? 3 : 0.5;
            });
        drawLegend();
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
            "55": "WI", "56": "WY", "72": "PR"
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
            "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "PR": "Puerto Rico", "RI": "Rhode Island", "SC": "South Carolina",
            "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
            "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
            "DC": "District of Columbia"
        };
        return stateNames[stateAbbr] || stateAbbr;
    }
});