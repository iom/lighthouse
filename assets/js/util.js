
export const dim = { 
    width: 1200, 
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

export const geosES = {
    "ARG": "Argentina",
    "BRA": "Brasil",
    "COL": "Colombia",
    "CRI": "Costa Rica",
    "ECU": "Ecuador",
    "GTM": "Guatemala",
    "HND": "Honduras",
    "MEX": "México",
    "PAN": "Panamá",
    "PER": "Perú"
}

export const nats = [
    "Total",
    "Argentina",
    "Bolivarian Republic of Venezuela",
    "Brazil",
    "Canada",
    "Colombia",
    "Dominican Republic",
    "Cuba",
    "Ecuador",
    "El Salvador",
    "Guatemala",
    "Haiti",
    "Honduras",
    "Mexico",
    "Nicaragua",
    "Panama",
    "United States",
    "Other Americas",
    "Africa",
    "Asia",
    "Europe",
    "Oceania",
    "Unknown"
]

export const natsES = [
    "Total",
    "Argentina",
    "República Bolivariana de Venezuela",
    "Brasil",
    "Canadá",
    "Colombia",
    "República Dominicana",
    "Cuba",
    "Ecuador",
    "El Salvador",
    "Guatemala",
    "Haiti",
    "Honduras",
    "México",
    "Nicaragua",
    "Panamá",
    "Estados Unidos de América",
    "Otras Américas",
    "África",
    "Asia",
    "Europa",
    "Oceanía",
    "Desconocido"
]

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

export const prettyNumber = d => (d === 0 ? "0" : d3.format(".2~s")(d));

export const parseDate = d3.timeParse("%Y %b");

export const prettyPercent = d => (d === 0 ? "0" : d3.format(".2~%")(d));
