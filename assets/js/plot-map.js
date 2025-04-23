
import * as forms from "./forms.js";
import * as util from "./util.js";
import { zoompanel } from "./zoompanel.js";

export function renderMap () {

    Promise.all([
    
        d3.json("./assets/data/world_map.json"),
        d3.json("./assets/data/disputed_dotted_black.json"),
        d3.json("./assets/data/disputed_dotted_white.json"),
        d3.csv("./assets/data/nats.csv"),
        d3.csv("./assets/data/centroids.csv")
    
    ]).then(function([mapRaw, disputedBlackRaw, disputedWhiteRaw, nats, centroidsRaw]) {

        const map = topojson.feature(mapRaw, mapRaw.objects.countries).features;
        const mapOutline = topojson.merge(mapRaw, mapRaw.objects.countries.geometries);

        const disputedBlack = topojson.feature(
            disputedBlackRaw, 
            disputedBlackRaw.objects.disputed_dotted_black
        ).features;

        const disputedWhite = topojson.feature(
            disputedWhiteRaw, 
            disputedWhiteRaw.objects.disputed_dotted_white
        ).features;

        const centroids = centroidsRaw.map(d => ({
            id: d.id,
            iso: d.iso,
            coords: [d.longitude, d.latitude]
        }));

        drawMap(map, mapOutline, disputedBlack, disputedWhite, nats, centroids);  
    })
}

function drawMap(map, mapOutline, disputedBlack, disputedWhite, nats, centroids) {

    d3.select(".dashboard-caption").style("display", "block")
    const formIcons = d3.select(".topbar .form-icons");
    const mainview = d3.select(".mainview")
        .classed("map", true)
        .classed("boxplot", false);
    mainview.selectAll("div, svg").remove();

    const sidebar = mainview.append("div")
        .attr("class", "sidebar");
    const panel = mainview.append("div")
        .attr("class", "panel");

    // Forms ////////////////////////////////////

    sidebar.append("div").attr("class", "form-inset-bg");
    const formYear = sidebar.call(forms.addFormRadio);
    const formGeo = sidebar.call(forms.addFormDropdown);
    
    // Re-render visual when any input is changed

    d3.selectAll("#radio-year input").on("input", update);
    d3.selectAll("#dropdown-geo").on("input", update);

    function iconClicked() {
        d3.selectAll(".icon-group").classed("icon-clicked", false);
        d3.select(this).classed("icon-clicked", true);
        update();
    };

    formIcons.selectAll(".icon-group")
        .on("click", iconClicked)
        .on("keydown", function(event) {
            if (event.key == "Enter") iconClicked.call(this)
        });

    // Chart ////////////////////////////////////

    const panelSVG = panel.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("preserveAspectRatio", "xMinYMax slice")
        .attr("viewBox", [0, 0, util.dim.width, util.dim.height]);

    let projection = d3.geoNaturalEarth1()
        .scale(190)
        .center([-50, 10]);

    let path = d3.geoPath().projection(projection);

    const countries = panelSVG.append("g").attr("class", "borders");
    countries.call(util.drawBorders, path, map, mapOutline, disputedBlack, disputedWhite);
    
    countries.selectAll("path.latent")
        .on("click", function() {
            let geoClicked = d3.select(this).attr("geo");
            d3.select("#dropdown-geo select").property("value", geoClicked);
            update();
        });

    let unknownBox = panelSVG.append("g")
        .attr("class", "unknown");

    unknownBox.append("rect")
        .attr("class", "unknown-rect")
        .attr("x", 260)
        .attr("y", 310)
        .attr("width", 40)
        .attr("height", 50)

    unknownBox.append("text")
        .attr("class", "unknown-text")
        .attr("x", 281)
        .attr("y", 310)
        .attr("dy", "-.7em")
        .attr("text-anchor", "middle")
        .text("Unknown")

    let nodesContainer = panelSVG.append("g")
        .attr("class", "bubble-container");

    nodesContainer.selectAll("circle")
        .data(centroids, d => +d.id)
        .join("circle")
        .attr("class", "bubble")
        .attr("cx", d => projection(d.coords)[0])
        .attr("cy", d => projection(d.coords)[1])
        .attr("r", 0);
    
    // Initial data /////////////////////////////
    
    let varSelect = formIcons.select(".icon-clicked").attr("value");
    let yearSelect = formYear.select("#radio-year input:checked").property("value");
    let geoSelect = formGeo.select("#dropdown-geo select").property("value");
    d3.selectAll("path.border").classed("geo-select", false);
    d3.select("path[geo='" + geoSelect + "']").classed("geo-select", true);

    let varText = varSelect === "regin" 
        ? "regular arrivals" 
        : varSelect === "regout" 
            ? "regular exits" 
            : "irregular arrivals";

    let data = nats.filter(d => 
        d.var == varSelect &&
        d.year == yearSelect && 
        d.geo == geoSelect
    );
    
    let noData = data.every(d => +d.n === 0);

    let r = d3.scaleLinear()
        .domain([d3.min(data, d => +d.n), d3.max(data, d => +d.n)])
        .range([0, noData ? 0 : 15]);
    
    // Legend
    
    // panelSVG.call(addBubbleLegend, 175, util.dim.height - 80, rScaler);
    
    // Pan and zoom /////////////////////////////

    let currentTransform = d3.zoomIdentity;
    
    function zoomed(event) {
        
        const k = event.transform.k;
        
        currentTransform = event.transform;
        panelSVG.selectAll(".borders path").attr("transform", event.transform);
        panelSVG.selectAll(".bubble-container").attr("transform", event.transform);
        panelSVG.selectAll(".unknown").attr("transform", event.transform);

        panelSVG.selectAll("path.map-outline").style("stroke-width", 1 / k);
        panelSVG.selectAll("path.border").style("stroke-width", .5 / k);
        panelSVG.selectAll("path.border-disputed-black").style("stroke-width", .5 / k);
        panelSVG.selectAll("path.border-disputed-white").style("stroke-width", 1.25 / k);
        panelSVG.selectAll(".unknown-rect").style("stroke-width", .5 / k);
        panelSVG.selectAll(".unknown-text").style("font-size", .7 / Math.sqrt(k) + "em");
        panelSVG.selectAll("circle.bubble")
            .attr("r", d => r(d.n) / Math.sqrt(k))
            .style("stroke-width", .75 / k);
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 16])
        .on("zoom", zoomed);

    panelSVG.call(zoom);

    // Control panel ////////////////////////////

    const controlPanelSVG = panel.append("div")
        .attr("class", "control-panel")
        .append("svg")
        .attr("width", 25)
        .attr("height", 70)
        .call(zoompanel);
    controlPanelSVG.select("#buttonplus")
        .on("click", () => panelSVG.transition().duration(300).call(zoom.scaleBy, 1.5));
    controlPanelSVG.select("#buttonminus")
        .on("click", () => panelSVG.transition().duration(300).call(zoom.scaleBy, 1 / 1.5));
    controlPanelSVG.select("#buttonreset")
        .on("click", () => panelSVG.transition().duration(300).call(zoom.transform, d3.zoomIdentity));
    
    // Tooltip //////////////////////////////////

    // Update ///////////////////////////////////
    
    update();

    function update() {

        varSelect = formIcons.select(".icon-clicked").attr("value");
        yearSelect = formYear.select("#radio-year input:checked").property("value");
        geoSelect = formGeo.select("#dropdown-geo select").property("value");
        d3.selectAll("path.border").classed("geo-select", false);
        d3.select("path[geo='" + geoSelect + "']").classed("geo-select", true);

        varText = varSelect === "regin" 
            ? "regular arrivals" 
            : varSelect === "regout" 
                ? "regular exits" 
                : "irregular arrivals";
        
        data = nats.filter(d => 
            d.var == varSelect &&
            d.year == yearSelect && 
            d.geo == geoSelect
        );
        
        noData = data.every(d => +d.n === 0);

        r = d3.scaleLinear()
            .domain([d3.min(data, d => +d.n), d3.max(data, d => +d.n)])
            .range([0, noData ? 0 : 15]);
        
        nodesContainer.selectAll("circle")
            .data(data, d => +d.id)
            .join("circle")
            .attr("class", "bubble")
            .transition().duration(200)
            .attr("r", d => r(d.n));

        nodesContainer.selectAll("circle")
            .on("mousemove", function(event, d) {

                d3.select("#tooltip")
                    .style("display", "block")
                    .style("left", event.pageX + 18 + "px")
                    .style("top", event.pageY + 18 + "px")
                    .html(`
                        ${ d3.format(".2s")(d.n) } ${ varText } 
                        from ${ d.label } in ${ yearSelect }
                    `);

                d3.select(event.target).style("cursor", "pointer");
            })
            .on("mouseleave", function(event, d) {
                d3.select("#tooltip").style("display", "none")
                d3.select(event.target).style("cursor", "unset");
            });
    }
}

// Legends //////////////////////////////////////

// function addBubbleLegend (container, xpos, ypos, rScaler) {

//     const params = ({ nMax: 10000000, nMed: 500000, nMin: 5000 });
//     params.rMax = rScaler(params.nMax);
//     params.rMin = rScaler(params.nMin);
//     params.rMed = rScaler(params.nMed);
    
//     const legend = container.append("g")
//         .attr("id", "bubble-legend")
//         .attr("transform", `translate(${ xpos }, ${ ypos })`);
    
//     legend.append("g")
//         .attr("class", "legend-desc")
//         .append("text")
//         .attr("x", 0).attr("y", 0)
//         .text("Number of displacements");
    
//     const legendKeys = legend.append("g")
//         .attr("transform", `translate(45, ${ params.rMax + 20 })`);
  
//     const addKey = (keyContainer, r, n, segment, xpos, ypos) => {
  
//         let dir, anchor;
//         if (segment > 0) {
//             dir = 1;
//             anchor = "start";
//         } else {
//             dir = -1;
//             anchor = "end";
//         }
  
//         const key = keyContainer.append("g")
//             .attr("transform", `translate(${ xpos }, ${ ypos })`);
//         key.append("circle")
//             .attr("class", "legend-bubble-circle")
//             .attr("cx", 0).attr("cy", 0)
//             .attr("r", r);
//         key.append("line")
//             .attr("class", "legend-bubble-line")
//             .attr("x1", dir * r).attr("x2", segment)
//             .attr("y1", 0).attr("y2", 0);
//         key.append("text")
//             .attr("class", "legend-text")
//             .attr("text-anchor", anchor)
//             .attr("x", segment + dir * 3).attr("y", 5)
//             .text(d3.format(",.0f")(n));

//         return keyContainer.node();
//     }
  
//     legendKeys.call(addKey, params.rMax, params.nMax, -18, 0, 0);
//     legendKeys.call(addKey, params.rMed, params.nMed, 18, 20, -10);
//     legendKeys.call(addKey, params.rMin, params.nMin, 12, 18, 10);

//     return container.node();
// }

// function addColorLegend (container, xpos, ypos, data, colorRanger) {

//     const params = { width: 12, height: 15, keyTextNudge: 6 };
//     const indicator = data[0].var;
    
//     const points = {
//         min: d3.min(data, d => d.v_fill), 
//         med: d3.mean(data, d => d.v_fill), 
//         max: d3.max(data, d => d.v_fill)
//     };

//     const breaks = [
//         points.max,
//         points.med + (points.max - points.med) / 2,
//         points.med, 
//         points.min + (points.med - points.min) / 2,
//         points.min
//     ];

//     const labels = [
//         { var: 1, line1: "Females in area",            line2: "(per cent)"         },
//         { var: 2, line1: "Average age",                line2: "in area (per cent)" },
//         { var: 3, line1: "Under-18-year-olds",         line2: "in area (per cent)" },
//         { var: 4, line1: "Average income in area",     line2: "(const. 2017 US$)"  },
//         { var: 5, line1: "Average years of schooling", line2: "in area (years)"    },
//         { var: 6, line1: "Average life expectancy",    line2: "in area (years)"    },
//         { var: 7, line1: "Urban land in area",         line2: "(per cent of land)" },
//         { var: 8, line1: "Cropland in area",           line2: "(per cent of land)" },
//         { var: 9, line1: "Grazing land in area",       line2: "(per cent of land)" },
//     ];

//     const label = labels.find(d => d.var == indicator);

//     const legend = container.append("g")
//         .attr("id", "color-legend")
//         .attr("transform", `translate(${xpos}, ${ypos})`);

//     legend.append("text")
//         .attr("class", "legend-desc")
//         .append("tspan")
//             .attr("x", 0).attr("y", 0)
//             .text(label.line1)
//         .append("tspan")
//             .attr("x", 0).attr("y", 0).attr("dy", 11)
//             .text(label.line2);

//     const legendKeys = legend.append("g").attr("transform", "translate(3,25)");

//     for (let i = 0; i < breaks.length; i++) {
//         legendKeys.append("g")
//         .append("rect")
//             .attr("x", 0)
//             .attr("y", params.height * i)
//             .attr("width", params.width + "px")
//             .attr("height", params.height + "px")
//             .style("fill", d => colorRanger(breaks[i]));
//     }

//     const ticks = legendKeys.append("g").attr("class", "legend-text");
//     ticks.append("text")
//         .attr("x", params.width + params.keyTextNudge)
//         .attr("y", 12)
//         .text(util.formatNum(breaks[0]));
//     ticks.append("text")
//         .attr("x", params.width + params.keyTextNudge)
//         .attr("y", breaks.length * params.height / 2 + 5)
//         .text(util.formatNum(breaks[2]));
//     ticks.append("text")
//         .attr("x", params.width + params.keyTextNudge)
//         .attr("y", breaks.length * params.height - 2)
//         .text(() => indicator == 5 
//             ? d3.format(".1f")(breaks[breaks.length - 1]) 
//             : util.formatNum(breaks[breaks.length - 1])
//         );


//     return container.node();
// }

