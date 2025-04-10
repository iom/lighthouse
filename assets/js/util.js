
export const dim = { 
    width: 950, 
    height: 500,
};

export const colors = { 
    blue1:   "#0033A0", 
    blue2:   "#4068B8", 
    blue3:   "#8099D0", 
    blue4:   "#B3C2E3", 
    blue5:   "#D9E0F1", 
    green1:  "#5CB8B2", 
    green2:  "#85CAC5",
    green3:  "#AEDCD9",
    green4:  "#CEEAE8",
    green5:  "#E7F4F3",
    yellow:  "#FFB81C", 
    red1:    "#D22630", 
    red2:    "#DD5C64", 
    red3:    "#E99398", 
    red4:    "#F2BEC1", 
    red5:    "#F8DEE0",
    unBlue1: "#418FDE",
    unBlue2: "#84ADEC",
    unBlue3: "#ADC9F2",
    unBlue4: "#CEDEF7",
    unBlue5: "#E6EFFB", 
    unBlue6: "#F3F7FD", 
    gray1:   "#404040", 
    gray2:   "#666666", 
    gray3:   "#999999", 
    gray4:   "#CCCCCC", 
    gray5:   "#F2F2F2",
};

export const geos = {
    "ARG": "Argentina",
    "BOL": "Bolivia",
    "BRA": "Brazil",
    "COL": "Colombia",
    "CRI": "Costa Rica",
    "ECU": "Ecuador",
    "GTM": "Guatemala",
    "HND": "Honduras",
    "MEX": "Mexico",
    "PAN": "Panama",
    "PER": "Peru"
}

// export const types = {
//     1: "Conflict",
//     2: "Drought",
//     3: "Earthquake",
//     4: "Flood",
//     5: "Mass movement",
//     6: "Storm",
//     7: "Wildfire",
//     8: "Other"
// };

// export const indicators = {
//     1: "Female",
//     2: "Median age",
//     3: "Children",
//     4: "Income",
//     5: "Years of schooling",
//     6: "Life expectancy",
//     7: "Urban area",
//     8: "Cropland area",
//     9: "Grazing area",
// };

// export const indicatorsTooltip = {
//     1: " of people in this area are female",
//     2: " years is the median age of people in this area",
//     3: " of people in this area have ages below 18",
//     4: " is the per capita income in this area",
//     5: " years is the average schooling of people in this area",
//     6: " years is the life expectancy of people in this area",
//     7: " is the urban share of this area",
//     8: " is the share of croplands in this area",
//     9: " is the share of grazing lands in this area"
// };

// export const regions = {
//     0: "World",
//     1: "Central and Southern Asia",
//     2: "Eastern and Southeastern Asia",
//     3: "Europe",
//     4: "Latin America and the Caribbean",
//     5: "Northern Africa and Western Asia",
//     6: "Northern America",
//     7: "Oceania",
//     8: "Sub-Saharan Africa"
// }

// export const typesBar = {
//     "0": "All causes",
//     "1": "Conflict",
//     "2": "Drought",
//     "3": "Earthquake",
//     "4": "Extreme temperature",
//     "5": "Flood",
//     "6": "Mass movement",
//     "7": "Storm",
//     "8": "Weather disaster",
//     "9": "Wildfire",
//     "10": "Total population in region"
// };

// export const indicatorsBar = {
//     1: "Female",
//     2: "Median age",
//     3: "Children",
//     4: "Income",
//     5: "Years of schooling",
//     6: "Life expectancy",
//     7: "Urban area",
//     8: "Cropland area",
//     9: "Grazing area"
// };

// export const indicatorsBarTooltip = {
//     1: "the median female share",
//     2: "the median age",
//     3: "the median share of under age 18",
//     4: "median per capita income",
//     5: "the median average years of schooling",
//     6: "median life expectancy",
//     7: "the median urban share",
//     8: "the median cropland area share",
//     9: "the median grazing area share"
// };

// export const indicatorsTitle = {
//     1: "median female share",
//     2: "median age",
//     3: "median share of under age 18",
//     4: "median per capita income",
//     5: "median average years of schooling",
//     6: "median life expectancy",
//     7: "median urban share",
//     8: "median cropland area share",
//     9: "median grazing area share"
// };

// export const indicatorsAxis = {
//     1: "Median female share",
//     2: "Median age",
//     3: "Median share of under age 18",
//     4: "Median per capita income",
//     5: "Median average years of schooling",
//     6: "Median life expectancy",
//     7: "Median urban share",
//     8: "Median cropland area share",
//     9: "Median grazing area share"
// };

// export function formatNum(num) d3.format(",.0f")(num);

export function formatNumAxis(num) {
    let numFormat;
    if (num >= 100) {
        numFormat = "$" + d3.format(",.0f")(num);
    } else if (num < 100 && num >= 1) {
        numFormat = d3.format(",.0f")(num);
    } else {
        numFormat = d3.format(".0f")(100 * num) + "%";
    };
    return numFormat;
};

export function drawBorders(container, path, map, mapOutline, disputedblack, disputedwhite) {

    container.append("g")
        .append("path")
        .attr("class", "map-outline")
        .datum(mapOutline)
        .attr("d", path)

    const borders = container.append("g")
        .selectAll("country")
        .data(map)
        .join("path")
        .attr("geo", d => d.properties.iso3c)
        .attr("class", d => (d.properties.iso3c in geos) 
            ? "border latent"
            : "border"
        )
        .attr("d", path);
        
    borders.selectAll("disputed-black")
        .data(disputedblack)
        .join("path")
        .attr("class", "border-disputed-black")
        .attr("d", path)
        .style("stroke", colors.gray4);
    
    borders.selectAll("disputed-white")
        .data(disputedwhite)
        .join("path")
        .attr("class", "border-disputed-white")
        .attr("d", path)
        .style("stroke", "white");
    
    return container.node();
}


