
import * as util from "./util.js";

export function renderFig1 () {

    Promise.all([
    
        d3.json("../assets/data/world_map.json")
    
    ]).then(function([mapRaw]) {
    
        const map = topojson.feature(mapRaw, mapRaw.objects.countries).features;

        drawMap(map);  
    })
};

function drawMap(map) {

    const height = 1000;

    const caption = d3.select(".chart .caption");
    const panel = d3.select(".panel")
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

    panelSVG.call(addArrow, 20);

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
    
    drawArrow([-66.6, 5], [-68, 4.5], -5);
    drawArrow([-70.28, 8], [-77.8, 8.5], -30);
    drawArrow([-69.9, 7], [-100, 17], -220);
    drawArrow([-69.5, 10.8], [-83, 16.5], 110);

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

    function drawArrow(start, end, curvature) {
    
        const [x0, y0] = projection(start);
        const [x1, y1] = projection(end);
        const [xm, ym] = [(x0 + x1) / 2, (y0 + y1) / 2]
        const [xc, yc] = [
            xm + curvature * (y0 - y1) / Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2), 
            ym + curvature * (x1 - x0) / Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2) 
        ]
    
        panelSVG.append("g")
            .append("path")
            .attr("class", "flow")
            .attr("marker-end", "url(#arrow)")
            .attr("d", `M ${ x0 } ${ y0 } Q ${ xc } ${ yc } ${ x1 } ${ y1 }`);
    }
}

function addArrow(container, size) {

    container.append("defs")
        .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", `0 0 ${ size } ${ size }`)
            .attr("refX", 1).attr("refY", 5)
            .attr("markerWidth", 5)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
        .append("path")
            .attr("d", "M0,1 L6,5 L0,9");

    return container.node();
};

