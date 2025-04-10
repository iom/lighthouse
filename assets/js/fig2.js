
import * as util from "./util.js";

export function renderFig2 () {

    Promise.all([
    
        d3.json("../assets/data/world_map.json")
    
    ]).then(function([mapRaw]) {
    
        const map = topojson.feature(mapRaw, mapRaw.objects.countries).features;

        drawMap(map);  
    })
};

function drawMap(map) {

    const height = 1000;

    const caption = d3.select("#fig2 .chart .caption");
    const panel = d3.select("#fig2 .panel")
    panel.selectAll("div, svg").remove();

    // Title

    panel.append("div")
        .attr("class", "fig-title")
        .text("Venezuelan irregular flows")

    // Chart ////////////////////////////////////

    const panelSVG = panel.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("preserveAspectRatio", "xMinYMax slice")
        .attr("viewBox", [0, 0, util.dim.width, height]);

    // Map

    let projection = d3.geoEquirectangular()
        .scale(1000)
        .center([-80, 25])
        .angle(0);

    let path = d3.geoPath().projection(projection);

    const countries = panelSVG.append("g")
        .attr("class", "land");

    countries.selectAll("country")
        .data(map)
        .join("path")
        .attr("class", d => "country " + d.properties.iso3c)
        .attr("d", path)
    
    panelSVG.append("g")
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", 590).attr("cy", 620).attr("r", 50);
    
    panelSVG.append("g")
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", 500).attr("cy", 520).attr("r", 40);
    
    panelSVG.append("g")
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", 370).attr("cy", 400).attr("r", 20);

    panelSVG.append("g")
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", 150).attr("cy", 300).attr("r", 60);
    
    // Grid lines

    for (let y = 100; y < height; y += 100) {
        
        const grid = panelSVG.append("g")
            .attr("class", "grid");
        
        grid.append("line")
            .attr("x1", 0)
            .attr("x2", util.dim.width)
            .attr("y1", y)
            .attr("y2", y)
        grid.append("text")
            .attr("x", 0)
            .attr("y", y)
            .attr("dx", 5)
            .attr("dy", 12)
            .text(y)
    }

    for (let x = 100; x < util.dim.width; x += 100) {
        
        const grid = panelSVG.append("g")
            .attr("class", "grid");
        
        grid.append("line")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", 0)
            .attr("y2", height)
        grid.append("text")
            .attr("x", x)
            .attr("y", height)
            .attr("dx", 5)
            .attr("dy", -5)
            .text(x)
    }
}
