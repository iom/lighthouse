
import * as forms from "./forms.js";
import * as util from "./util.js";
import { zoompanel } from "./zoompanel.js";

export function renderMap () {

    Promise.all([
    
        d3.json("./assets/data/world_map.json"),
        d3.csv("./assets/data/nats.csv")
    
    ]).then(function([mapRaw, nats]) {

        const map = topojson.feature(mapRaw, mapRaw.objects.countries).features;
        
        drawMap(map, nats);  
    })
}

function drawMap(map, nats) {

    d3.select(".dashboard-caption").style("display", "block");
    const mainview = d3.select(".mainview")
        .classed("map", true)
        .classed("grid", false);
    mainview.selectAll("div, svg").remove();

    const sidebar = mainview.append("div")
        .attr("class", "sidebar");
    const panel = mainview.append("div")
        .attr("class", "panel");

    // Forms ////////////////////////////////////

    sidebar.append("div").attr("class", "form-inset-bg");
    const formGeo = sidebar.call(forms.addFormDropdown, util.geos);
    const formYear = sidebar.call(forms.addFormRadio);
    const formIcons = sidebar.call(forms.addFormIcons);
    
    // Re-render visual when any input is changed

    d3.selectAll("#dropdown-geo").on("input", update);
    d3.selectAll("#radio-year input").on("input", update);

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

    let xpos = window.innerWidth < 480 ? 10 : -50;

    let projection = d3.geoNaturalEarth1()
        .scale(190)
        .center([xpos, 25]);

    let path = d3.geoPath().projection(projection);

    const countries = panelSVG.append("g").attr("class", "borders")
    
    // Initial data /////////////////////////////
    
    let varSelect = formIcons.select(".icon-clicked").attr("value");
    let yearSelect = formYear.select("#radio-year input:checked").property("value");
    let geoSelect = formGeo.select("#dropdown-geo select").property("value");

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


    // Pan and zoom /////////////////////////////

    let currentTransform = d3.zoomIdentity;
    
    function zoomed(event) {
        const k = event.transform.k;
        currentTransform = event.transform;
        panelSVG.selectAll(".borders").attr("transform", event.transform);
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

    function mouseMoved(event, d) {

        if (d.n === null && d.properties.iso3c !== geoSelect) {

        } else {

            let dir = varSelect === "regout" ? "from" : "to";
            
            const text = (d) => {
                if (d.properties.iso3c === geoSelect) {
                    return `${ d.properties.english } (reporting country)`;
                } else {
                    return `
                        <span class='value'>${ d3.format(",.0f")(+d.n) }</span>
                        <br>${ varText } to ${ util.geos[geoSelect] }<br>by ${ d.label } nationals
                    `;
                }
            }
    
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", event.pageX + 18 + "px")
                .style("top", event.pageY + 18 + "px")
                .html(text(d));
            d3.select(event.target).style("cursor", "pointer");
        }
    }

    function mouseLeft(event, d) {
        d3.select("#tooltip").style("display", "none");
        d3.select(event.target).style("cursor", "default");
    }

    // Update ///////////////////////////////////
    
    function update() {

        varSelect = formIcons.select(".icon-clicked").attr("value");
        yearSelect = formYear.select("#radio-year input:checked").property("value");
        geoSelect = formGeo.select("#dropdown-geo select").property("value");
        d3.selectAll("path.border").classed("geo-select", false);
        d3.select("path[geo='" + geoSelect + "']").classed("geo-select", true);

        varText = varSelect === "regin" 
            ? "regular entries" 
            : varSelect === "regout" 
                ? "regular exits" 
                : "irregular entries";

        data = nats.filter(d => 
            d.var == varSelect &&
            d.year == yearSelect && 
            d.geo == geoSelect &&
            d.n > 0
        );
        
        let dataJoin = map.map(a => {
            const match = data.find(b => b.nat === a.properties.iso3c);
            return {
                ...a,
                label: match ? match.label : null,
                n: match ? match.n : null
            };
        });

        let colorScaler = d3.scaleLinear()
            .domain([
                d3.min(data, d => +d.n), 
                d3.mean(data, d => +d.n), 
                d3.max(data, d => +d.n)
            ])
            .range([util.colors.unBlue4, util.colors.unBlue3, util.colors.unBlue1])
            .clamp(true)
            .unknown(util.colors.gray4);
        
        countries.selectAll("g").remove();
        countries.append("g")
            .selectAll("country")
            .data(dataJoin)
            .join("path")
            .attr("class", d => (d.properties.iso3c === geoSelect) 
                ? "border hero"
                : "border"
            )
            .attr("d", path)
            .attr("fill", d => colorScaler(d.n))
            .on("mousemove", mouseMoved)
            .on("mouseleave", mouseLeft);
        
        const title = d3.select(".dashboard-title");
        let dir = varSelect === "regout" ? "from" : "to";
        title.text(`
            Nationalities of ${ varText } ${ dir } ${ util.geos[geoSelect] }, ${ yearSelect }
        `);

        panelSVG.select("#color-legend").remove();
        panelSVG.call(addColorLegend, 30, util.dim.height - 100, data, colorScaler);
    }

    update();
}

// Legends //////////////////////////////////////

function addColorLegend (container, xpos, ypos, data, colorRanger) {

    const params = { width: 12, height: 12, keyTextNudge: 6 };
    const indicator = data[0].var;
    
    const points = {
        min: d3.min(data, d => +d.n), 
        med: d3.mean(data, d => +d.n), 
        max: d3.max(data, d => +d.n)
    };

    const breaks = [
        points.max,
        points.med + (points.max - points.med) / 2,
        points.med, 
        points.min + (points.med - points.min) / 2,
        points.min
    ];

    const legend = container.append("g")
        .attr("id", "color-legend")
        .attr("transform", `translate(${xpos}, ${ypos})`);

    const legendKeys = legend.append("g").attr("transform", "translate(3,25)");

    for (let i = 0; i < breaks.length; i++) {
        legendKeys.append("g")
            .append("rect")
            .attr("x", 0)
            .attr("y", params.height * i)
            .attr("width", params.width + "px")
            .attr("height", params.height + "px")
            .style("fill", d => colorRanger(breaks[i]));
    }

    const ticks = legendKeys.append("g").attr("class", "legend-text");
    ticks.append("text")
        .attr("x", params.width + params.keyTextNudge)
        .attr("y", 12)
        .text(d3.format(",.0f")(breaks[0]));
    ticks.append("text")
        .attr("x", params.width + params.keyTextNudge)
        .attr("y", breaks.length * params.height / 2 + 5)
        .text(d3.format(",.0f")(breaks[2]));
    ticks.append("text")
        .attr("x", params.width + params.keyTextNudge)
        .attr("y", breaks.length * params.height - 2)
        .text(d3.format(",.0f")(breaks[4]));

    return container.node();
}

