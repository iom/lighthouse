
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

    // const dim = { width: 750, height: 500 };
    // const margin = { top: 20, bottom: 80, right: 20, left: 190 };
    // const gutter = { yout: 12.5, yin: 30, xin: 7.5, xout: 12.5 };

    // Forms ////////////////////////////////////

    const formGeo = sidebar.call(forms.addFormDropdown);
    // d3.selectAll("#dropdown-geo").on("input", update);

    let geoSelect = formGeo.select("#dropdown-geo select").property("value");

    const grid = panel.append("div")
        .attr("class", "grid");
    
    let dataGeo = series.filter(d => d.geo == geoSelect);

    const regularEntries = grid.append("div").attr("class", "grid-cell");
    const regularExits = grid.append("div").attr("class", "grid-cell");
    const netFlow = grid.append("div").attr("class", "grid-cell");
    const irregular = grid.append("div").attr("class", "grid-cell");

    regularEntries.call(drawRegularEntries, dataGeo);
    regularExits.call(drawRegularEntries, dataGeo);
    netFlow.call(drawRegularEntries, dataGeo);
    irregular.call(drawRegularEntries, dataGeo);
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


function drawRegularEntries(container, dataGeo) {

    let data = dataGeo.filter(d => d.var == "regin");
    data.sort((a, b) => d3.ascending(util.parseDate(a.t), util.parseDate(b.t)));

    const X = d3.map(data, d => util.parseDate(d.t));
    const Y = d3.map(data, d => +d.n);
    const Z = d3.map(data, d => d.var);
    const I = d3.range(X.length);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => +d.n), d3.max(data, d => +d.n)])
        .range([dim.height - margin.bottom - gutter.x, margin.top + gutter.x]);

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("viewBox", [0, 0, dim.width, dim.height]);
    
    svg.append("rect")
        .attr("x", margin.left).attr("y", margin.top)
        .attr("width", dim.width - margin.left - margin.right)
        .attr("height", dim.height - margin.top - margin.bottom)
        .style("fill", "white");
    
    svg.append("text")
        .attr("class", "grid-cell-title")
        .attr("x", dim.width / 2)
        .attr("y", margin.top / 2)
        .text("Regular entries");

    svg.call(addAxes, x, y);

    const line = d3.line()
        .curve(d3.curveBasis)
        .x(i => x(X[i]))
        .y(i => y(Y[i]));

    svg.append("g")
        .selectAll("path")
        .data(d3.group(I, i => Z[i]))
        .join("path")
        .attr("class", "chart-line")
        .attr("d", ([, I]) => line(I));

    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("class", "chart-dot")
        .attr("cx", d => x(util.parseDate(d.t)))
        .attr("cy", d => y(d.n))
        .attr("r", 2);
}
