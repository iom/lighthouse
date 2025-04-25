
import * as forms from "./forms.js";
import * as util from "./util.js";
 
export function renderGrid () {

    Promise.all([d3.csv("./assets/data/series.csv")]).then(function([series]) {
        drawGrid(series);
    });
}

function drawGrid(series) {

    const mainview = d3.select(".mainview")
        .classed("grid", true)
        .classed("map", false);
    mainview.selectAll("div, svg").remove();

    const sidebar = mainview.append("div")
        .attr("class", "sidebar");
    sidebar.append("div").attr("class", "form-inset-bg");
    const panel = mainview.append("div")
        .attr("class", "panel");

    // Forms ////////////////////////////////////

    const formGeo = sidebar.call(forms.addFormDropdown);
    d3.selectAll("#dropdown-geo").on("input", update);

    const grid = panel.append("div")
        .attr("class", "grid");
    
    const regularEntries = grid.append("div").attr("class", "grid-cell");
    const regularExits = grid.append("div").attr("class", "grid-cell");
    const netFlow = grid.append("div").attr("class", "grid-cell");
    const irregular = grid.append("div").attr("class", "grid-cell");
        
    function update() {

        let geoSelect = formGeo.select("#dropdown-geo select").property("value");
        let dataGeo = series.filter(d => d.geo == geoSelect);
        
        regularEntries.call(drawLine, dataGeo, "regin", "Regular entries");
        regularExits.call(drawLine, dataGeo, "regout", "Regular exits");
        netFlow.call(drawBar, series, dataGeo);
        irregular.call(drawLine, dataGeo, "irreg", "Irregular entries");

        const title = d3.select(".dashboard-title");
        title.text(`Mobility flows in ${ util.geos[geoSelect] }`);
    }

    update();
}

const dim = { width: 467, height: 220 };
const margin = { top: 30, right: 20, bottom: 20, left: 40 };
const gutter = { x: 12.5, y: 12.5, yin: 20 };

const x = d3.scaleLinear()
    .domain([
        util.parseDate("2021 Jan"), 
        util.parseDate("2025 Jan")
    ])
    .range([
        margin.left + gutter.yin, 
        dim.width - margin.right - gutter.yin
    ]);

function addAxes(panel, xScale, yScale) {

    // x axis

    const xAxis = d3.axisBottom(xScale)
        .tickValues([
            util.parseDate("2021 Jan"), 
            util.parseDate("2022 Jan"), 
            util.parseDate("2023 Jan"), 
            util.parseDate("2024 Jan"),
            util.parseDate("2025 Jan")
        ])
        .tickFormat(d3.timeFormat("%Y"))
        .tickSize(0)
        .tickPadding([gutter.x]);
    
    panel.append("g")
        .attr("transform", `translate(0, ${ dim.height - margin.bottom })`)
        .attr("class", "axis x")
        .call(xAxis)
        .call(g => g.select(".domain").remove());
    
    // y axis

    const yAxis = d3.axisLeft(yScale)
        .ticks(4)
        .tickFormat(util.prettyNumber)
        .tickSize(0)
        .tickPadding([gutter.y]);
    
    const yGrid = (g) => g
        .attr("class", "grid-lines")
        .selectAll("line")
        .data(yScale.ticks(4).filter(d => d !== 0))
        .join("line")
        .attr("x1", gutter.yin)
        .attr("x2", dim.width - margin.left - margin.right - gutter.yin)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d));
    
    panel.append("g")
        .attr("transform", `translate(${ margin.left }, 0)`)
        .attr("class", "axis y")
        .call(yAxis)
        .call(g => g.select(".domain").remove());
    
    panel.append("g")
        .attr("transform", `translate(${ margin.left }, 0)`)
        .call(yGrid);
}

function drawLine(container, dataGeo, varSelect, title) {

    let data = dataGeo.filter(d => d.var == varSelect);
    
    container.select("svg").remove();
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("viewBox", [0, 0, dim.width, dim.height]);
    
    const rectBG = svg.append("rect")
        .attr("x", margin.left).attr("y", margin.top)
        .attr("width", dim.width - margin.left - margin.right)
        .attr("height", dim.height - margin.top - margin.bottom)
        .style("fill", "white");
    
    svg.append("text")
        .attr("class", "grid-cell-title")
        .attr("x", dim.width / 2)
        .attr("y", margin.top / 2)
        .text(title);

    if (data.length > 0) {

        data.sort((a, b) => d3.ascending(util.parseDate(a.t), util.parseDate(b.t)));

        const y = d3.scaleLinear()
            .domain(d3.extent(data, d => +d.n))
            .range([dim.height - margin.bottom - gutter.x, margin.top + gutter.x]);

        svg.call(addAxes, x, y);

        const line = d3.line()
            .curve(d3.curveBasis)
            .x(d => x(util.parseDate(d.t)))
            .y(d => y(+d.n));

        svg.append("g")
            .append("path")
            .attr("class", "chart-line")
            .attr("d", line(data.filter(d => !isNaN(d.n))));

        svg.append("g")
            .selectAll("circle")
            .data(data.filter(d => !isNaN(d.n)))
            .join("circle")
            .attr("class", "chart-dot")
            .attr("cx", d => x(util.parseDate(d.t)))
            .attr("cy", d => y(d.n))
            .attr("r", 2);
        
        const marker = svg.append("g").attr("display", "none");
        marker.append("path")
            .attr("class", "marker")
            .attr("d", d3.line()([[0, margin.top], [0, dim.height - margin.bottom]]));
        rectBG.on("mouseenter", mouseentered)
            .on("mousemove", mousemoved)
            .on("mouseleave", mouseleft);

        function mouseentered() {
            marker.attr("display", null);
            d3.select("#tooltip").style("display", "block");
        }
            
        function mousemoved(event) {

            const [xm, ym] = d3.pointer(event);
            const X = d3.map(data, d => util.parseDate(d.t));
            const Y = d3.map(data, d => +d.n);
            const xValue = d3.least(X, u => Math.abs(x(u) - xm));
            const i = X.map((d, i) => d.getTime() === xValue.getTime() ? i : "").filter(String);

            const numText = !isNaN(Y[i[0]]) 
                ? d3.format(",.0f")(Y[i[0]])
                : "No data"
            
            marker.attr("transform", `translate(${ x(xValue) }, 0)`);
            d3.select("#tooltip")
                .style("left", event.pageX + 18 + "px")
                .style("top", event.pageY + 18 + "px")
                .html(`
                    ${ d3.timeFormat("%b %Y")(xValue) }:
                    <strong>${ numText }</strong>
                `);
        }
        
        function mouseleft() {
            marker.attr("display", "none");
            d3.select("#tooltip").style("display", "none");
        }

    } else {
        rectBG.style("opacity", .5);
    }
}

function drawBar(container, dataAll, dataGeo) {

    dataAll.sort((a, b) => d3.ascending(util.parseDate(a.t), util.parseDate(b.t)));
    const X = d3.map(dataAll, d => util.parseDate(d.t));
    
    const xBand = d3.scaleBand()
        .domain(X)
        .range([margin.left + gutter.yin, dim.width - margin.right - gutter.yin])
        .padding(.25);
    
    let data = dataGeo.filter(d => d.var == "regnet");
    
    container.select("svg").remove();
    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("viewBox", [0, 0, dim.width, dim.height]);

    const rectBG = svg.append("rect")
        .attr("x", margin.left).attr("y", margin.top)
        .attr("width", dim.width - margin.left - margin.right)
        .attr("height", dim.height - margin.top - margin.bottom)
        .style("fill", "white");

    svg.append("text")
        .attr("class", "grid-cell-title")
        .attr("x", dim.width / 2)
        .attr("y", margin.top / 2)
        .text("Regular entries — net");

    if (data.length > 0) {

        const min = Math.min(0, d3.min(data, d => +d.n));
        const max = Math.max(0, d3.max(data, d => +d.n));

        const y = d3.scaleLinear()
            .domain([min, max])
            .range([dim.height - margin.bottom - gutter.x, margin.top + gutter.x]);
        
        svg.call(addAxes, x, y);

        svg.append("g")
            .append("path")
            .attr("class", "grid-lines zero")
            .attr("d", `
                M${ margin.left + gutter.x },${ y(0) } 
                H${ dim.width - margin.right - gutter.x }
            `);

        svg.append("g")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("class", d => d.n >= 0 
                ? "chart-bar positive" 
                : "chart-bar negative"
            )
            .attr("x", d => xBand(util.parseDate(d.t)))
            .attr("y", d => d.n >= 0 ? y(d.n) : y(0))
            .attr("width", xBand.bandwidth())
            .attr("height", d => Math.abs(y(d.n) - y(0)))
            .on("mousemove", function(event, d) {

                d3.select("#tooltip")
                    .style("display", "block")
                    .style("left", event.pageX + 18 + "px")
                    .style("top", event.pageY + 18 + "px")
                    .html(`
                        ${ d3.format(",.0f")(d.n) }
                    `);

                d3.select(event.target).style("cursor", "pointer");
            })
            .on("mouseleave", function(event, d) {
                d3.select("#tooltip").style("display", "none")
                d3.select(event.target).style("cursor", "unset");
            });

    } else {
        rectBG.style("opacity", .5);
    }
}
