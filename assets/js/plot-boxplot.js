
import * as forms from "./forms.js";
import * as util from "./util.js";
 
export function renderBoxplot () {

    Promise.all([

        d3.csv("./data/means.csv"),
    
    ]).then(function([meansRaw]) {

        let means = meansRaw.map(d => ({
            region: +d.region,
            type: +d.type,
            e: +d.e,
            n: +d.n,
            var: +d.var,
            p50: +d.p50,
            p250: +d.p250,
            p500: +d.p500,
            p750: +d.p750,
            p950: +d.p950
        }));
    
        drawBoxplot(means);
    })
}

function drawBoxplot(means) {

    d3.select(".dashboard-caption").style("display", "none");
    const formIcons = d3.select(".topbar .form-icons");
    const mainview = d3.select(".mainview")
        .classed("boxplot", true)
        .classed("map", false);
    mainview.selectAll("div, svg").remove();

    const sidebar = mainview.append("div")
        .attr("class", "sidebar");
    sidebar.append("div").attr("class", "form-inset-bg");
    const panel = mainview.append("div")
        .attr("class", "panel");

    const dim = { width: 750, height: 500 };
    const margin = { top: 20, bottom: 80, right: 20, left: 190 };
    const gutter = { yout: 12.5, yin: 30, xin: 7.5, xout: 12.5 };
    const params = { binHeight: 10 };

    // Forms ////////////////////////////////////

    const formRegion = sidebar.call(forms.addFormDropdown);
    
    // Re-render visual when any input is changed

    formRegion.select("#bar-dropdown-region select").on("input", update);

    function iconClicked() {
        d3.selectAll(".icon-group").classed("icon-clicked", false);
        d3.select(this).classed("icon-clicked", true);
        update();
    }

    formIcons.selectAll(".icon-group")
        .on("click", iconClicked)
        .on("keydown", function(event) {
            if (event.key == "Enter") {
                iconClicked.call(this);
            }
        });

    // Chart ////////////////////////////////////

    const legend = sidebar.append("div")
        .attr("class", "legend-container")
        .call(addBoxplotLegend, 30, 120);

    const svg = panel.append("svg")
        .attr("width", "100%")
        .attr("preserveAspectRatio", "xMidYMin slice")
        .attr("viewBox", [0, 0, dim.width, dim.height]);
    
    svg.append("rect")
        .attr("x", margin.left).attr("y", margin.top)
        .attr("width", dim.width - margin.left - margin.right)
        .attr("height", dim.height - margin.top - margin.bottom)
        .style("fill", "white");

    const axes = svg.append("g");
    const boxplots = svg.append("g");

    // Dashed line //////////////////////////////

    // const marker = svg.append("g").attr("display", "none");
    // marker.append("path")
    //     .attr("class", "marker-line")
    //     .attr("d", d3.line()([[0, margin.top], [0, dim.height - margin.bottom]]));

    // const markerNum = d3.select("body")
    //     .append("div")
    //     .attr("id", "marker-num")
    //     .style("display", "none")
        
    function update() {

        let region = formRegion.select("#bar-dropdown-region select").property("value");
        let indicatorChecked = formIcons.select(".icon-clicked").attr("value");
        let data = means.filter(d => d.region == region && d.var == indicatorChecked);
        const Y = d3.map(data, d => +d.type);

        function formatNumAxis(num) {

            let numFormat;

            if (num >= 100) {
                numFormat = "$" + d3.format(",.0f")(num);
            } else if (num < 100 && num > 1) {
                numFormat = d3.format(",.0f")(num);
            } else {
                numFormat = d3.format(".0f")(100 * num) + "%";
            }

            if (region == 6 && indicatorChecked == 5) {
                numFormat = d3.format(",.1f")(num);
            }
            
            return numFormat;
        }

        axes.selectAll("g").remove();
        boxplots.selectAll("g").remove();

        // x-axis
        let xScaler = d3.scaleLinear()
            .domain([d3.min(data, d => +d.p50), d3.max(data, d => +d.p950)])
            .range([gutter.yin, dim.width - margin.left - margin.right - gutter.yin]);
        let xAxis = d3.axisBottom(xScaler)
            .ticks(5)
            .tickSize(0)
            .tickFormat(formatNumAxis)
            .tickPadding([gutter.xout]);
        let xGrid = (g) => g
            .attr("class", "grid-lines")
            .selectAll("line")
            .data(xScaler.ticks(5))
            .join("line")
                .attr("x1", d => xScaler(d))
                .attr("x2", d => xScaler(d))
                .attr("y1", margin.top + gutter.xin)
                .attr("y2", dim.height - margin.bottom - gutter.xin);
        axes.append("g")
            .attr("transform", `translate(${ margin.left }, ${ dim.height - margin.bottom })`)
            .attr("class", "x-axis")
            .call(xAxis)
            .call(g => g.select(".domain").remove());
        axes.append("g")
            .attr("transform", `translate(${ margin.left }, 0)`)
            .call(xGrid);
        axes.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(
                ${ margin.left + (dim.width - margin.left - margin.right) / 2 }, 
                ${ dim.height - margin.bottom + 50 }
            )`)
            .append("text")
            .style("text-anchor", "middle")
            .text(util.indicatorsAxis[indicatorChecked]);
        
        // let xScalerInv = d3.scaleLinear()
        //     .domain([
        //         margin.left + gutter.yin, 
        //         dim.width - margin.right - gutter.yin
        //     ])
        //     .range([d3.min(data, d => +d.p50), d3.max(data, d => +d.p950)]);

        // y-axis
        let yScaler = d3.scaleBand()
            .domain(Object.keys(util.typesBar).reverse().map(Number))
            .range([dim.height - margin.bottom - gutter.xin, margin.top + gutter.xin])
            .padding(.15);
        let yAxis = d3.axisLeft(yScaler)
            .tickSize(0)
            .tickFormat(d => util.typesBar[d])
            .tickPadding([gutter.yout]);
        axes.append("g")
            .attr("transform", `translate(${ margin.left }, 0)`)
            .attr("class", "y-axis")
            .call(yAxis)
            .call(g => g.select(".domain").remove());

        // panel
        //     .on("mousemove", markerMouseMoved)
        //     .on("mouseleave", markerMouseLeft);

        // function markerMouseMoved(event) {
        //     const [xm, ym] = d3.pointer(event);
        //     marker
        //         .attr("display", null)
        //         .attr("transform", `translate(${ xm }, 0)`);
        //     markerNum.style("display", "block")
        //         .style("left", event.pageX + 5 + "px")
        //         .style("top", event.pageY - 15 + "px")
        //         .html(function() {
        //             if (xScalerInv(xm) < 0) {
        //                 return "";
        //             } else if (indicatorChecked == 4) {
        //                 return "$" + d3.format(",.0f")(xScalerInv(xm));
        //             } else {
        //                 return util.formatNum(xScalerInv(xm));
        //             }
        //         });
        // };

        // function markerMouseLeft() {
        //     marker.attr("display", "none");
        //     markerNum.style("display", "none");
        // }

        // 90% range
        boxplots.append("g")
            .attr("transform", `translate(${ margin.left }, ${ margin.top })`)
            .attr("class", "bin-range-90")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("id", (d, i) => "bin-range-90-" + Y[i])
            .attr("d", (d, i) => `
                M${ xScaler(d.p50) },${ yScaler(Y[i]) }
                H${ xScaler(d.p950) }
            `);

        // 50% range
        boxplots.append("g")
            .attr("transform", `translate(${ margin.left }, ${ margin.top })`)
            .attr("class", "bin-range-50")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("id", (d, i) => "bin-range-50-" + Y[i])
            .attr("d", (d, i) => `
                M${ xScaler(d.p250) },${ yScaler(Y[i]) + params.binHeight }
                H${ xScaler(d.p750) }
                V${ yScaler(Y[i]) - params.binHeight }
                H${ xScaler(d.p250) }
                Z
            `);

        // Median
        boxplots.append("g")
            .attr("transform", `translate(${ margin.left }, ${ margin.top })`)
            .attr("class", "bin-range-med")
            .selectAll("path")
            .data(data)
            .join("path")
            .attr("id", (d, i) => "bin-range-med-" + Y[i])
            .attr("d", (d, i) => `
                M${ xScaler(+d.p500) },${ yScaler(Y[i]) + params.binHeight }
                V${ yScaler(Y[i]) - params.binHeight }
            `);

        boxplots.selectAll("path")
            .on("mousemove", mouseMoved)
            .on("mouseleave", mouseLeft);

        function mouseMoved(event, d) {
            const [xm, ym] = d3.pointer(event);
            // marker
            //     .attr("display", null)
            //     .attr("transform", `translate(${ xm + margin.left }, 0)`);

            const type = (d) => {
                switch (+d.type) {
                    case 0: 
                        return "<span class='tooltip-emph'>all</span> displacement areas";
                    case 2: 
                        return "<span class='tooltip-emph'>disaster</span> displacement areas";
                    case 10: 
                        return "the <span class='tooltip-emph'>total population</span> in areas with and without displacement";
                    default:
                        return `<span class='tooltip-emph'>${ util.typesBar[+d.type] }</span> displacement areas`;
                }
            };

            const sample = (d) => {
                switch (+d.type) {
                    case 10: 
                        return "";
                    default: 
                        return `<p class="tooltip-note">Based on ${ d3.format(",.0f")(d.e) } 
                        displacement events over 2018–2024 totaling ${ d3.format(",.0f")(d.n) } 
                        displacements.</p>`;
                }
            };
            
            const line = (d) => {
                switch (+d.var) {
                    case 1: 
                        return `<p><strong>${ util.formatNum(d.p500) }</strong> 
                        of people in ${ type(d) } are female.`;
                    case 2: 
                        return `<p>The average age in ${ type(d) } is 
                        <strong>${ util.formatNum(d.p500) }</strong>  years.`;
                    case 3: 
                        return `<p><strong>${ util.formatNum(d.p500) }</strong> of people 
                        in ${ type(d) } are children.`;
                    case 4: 
                        return `<p>The average annual income in ${ type(d) } is 
                        <strong>${ util.formatNum(d.p500) }</strong>.`;
                    case 5: 
                        return `<p>The average years of schooling in ${ type(d) } is 
                        <strong>${ util.formatNum(d.p500) }</strong>.`;
                    case 6: 
                        return `<p>The average life expectancy in ${ type(d) } is 
                        <strong>${ util.formatNum(d.p500) }</strong> years.`;
                    case 7: 
                        return `<p>Urban land makes up an average 
                        <strong>${ util.formatNum(d.p500) }</strong> of land in ${ type(d) }.`;
                    case 8: 
                        return `<p>Cropland makes up an average 
                        <strong>${ util.formatNum(d.p500) }</strong> of land in ${ type(d) }.`;
                    default: 
                        return `<p>Grazing land makes up an average 
                        <strong>${ util.formatNum(d.p500) }</strong> of land in ${ type(d) }.`;
                }
            };

            d3.select("#tooltip")
                .style("display", "block")
                .style("left", event.pageX + 18 + "px")
                .style("top", event.pageY + 18 + "px")
                .html(`${ line(d) } The middle 50% of values range from ${ util.formatNum(d.p250) } 
                    to ${ util.formatNum(d.p750) }.</p>${ sample(d) }`
                );

            d3.select(event.target).style("cursor", "pointer");
        };

        function mouseLeft(event) {
            d3.select("#tooltip").style("display", "none");
            d3.select(event.target).style("cursor", "default");
        }

        // // Build caption
        // let indicatorText = "<span class='caption-emph'>" + util.indicatorsTitle[indicatorChecked] + "</span>";
        // let regionText = "<span class='caption-emph'>" + util.regions[region] + "</span>";
        // if (region == 0) regionText = "the <span class='caption-emph'>world</span>"

        // let captionText = "<p>Distribution of " + indicatorText + 
        //     " weighed by magnitude of internally displaced persons across " + regionText + 
        //     ", by cause of displacement, 2018\u20132024.</p>"

        // caption.html(captionText);
    };

    update();
}

// Legends //////////////////////////////////////

function addBoxplotLegend(container, xpos, ypos) {

    const params = ({ length90: 150, length50: 75, width: 10 });

    // Title and description ////////////////////

    const text = container.append("div")
        .attr("class", "form-head");

    text.append("span")
        .attr("class", "form-title")
        .text("Interpretation");

    text.append("span")
        .attr("class", "form-desc")
        .text("A boxplot shows the distribution of data.");

    // Diagram //////////////////////////////////

    const diagram = container.append("div")
        .attr("class", "form-body")
        .append("svg")
        .attr("viewBox", [0, 0, 154, 137])
        .append("g").attr("transform", "translate(2,55)");

    // Draw 90% bin
    diagram.append("g")
        .attr("class", "bin-range-90")
        .append("path")
        .attr("d", `M0,0 H${ params.length90 }`);

    // Draw 50% bin
    diagram.append("g")
        .attr("class", "bin-range-50")
        .append("path")
        .attr("d", `
            M${ (params.length90 - params.length50) / 2 },${ params.width }
            H${ (params.length90 - params.length50) / 2 + params.length50 }
            V${ -params.width }
            H${ (params.length90 - params.length50) / 2 }
            Z
        `);

    // Draw median
    diagram.append("g")
        .attr("class", "bin-range-med")
        .append("path")
        .attr("d", `
            M${ params.length90 / 2 },${ params.width } 
            V${ -params.width }
        `);

    // Dotted lines /////////////////////////////

    const annotationLine = diagram.append("g")
        .attr("class", "legend-bubble-line");

    // Draw 90% bin dotted lines
    annotationLine.append("path")
        .attr("d", `M0,7 V${ params.width + 40 } H${ params.length90 } V7`);

    // Draw 50% bin dotted lines
    annotationLine.append("path")
        .attr("d", `
            M${ params.length90 / 2 },${ params.width + 60 } 
            H${ params.width + 70 }
        `);
    annotationLine.append("path")
        .attr("d", `
            M${ (params.length90 - params.length50) / 2 },${ -(params.width + 5) }
            V${ -(params.width + 15) }
            H${ (params.length90 - params.length50) / 2 + params.length50 } 
            V${ -(params.width + 5) }
        `);
    
    // Draw median dotted lines
    annotationLine.append("path")
        .attr("d", `M${ params.length90 / 2 },${ params.width + 3 } V20`);

    // Annotations //////////////////////////////

    const annotationText = diagram.append("g").attr("class", "legend-text");
    
    // 50% bin annotation
    const middle50 = annotationText.append("g")
        .attr("transform", `translate(${ params.length90 / 2 },${ -(params.width + 35) })`)
        .attr("text-anchor", "middle");

    middle50.append("text").attr("y", 0).text("Middle 50%");
    middle50.append("text").attr("y", 12).text("of the data");

    // Median annotation
    annotationText.append("text")
        .attr("x", `${ params.length90 / 2 }`)
        .attr("y", `${ params.width + 23 }`)
        .attr("text-anchor", "middle")
        .text("Median (average)");
    
    // 90% bin annotation
    const middle90 = annotationText.append("g")
        .attr("transform", `translate(${ params.length90 / 2 },${ params.width + 40 + 15 })`)
        .attr("text-anchor", "middle");
    middle90.append("text").attr("y", 0).text("Middle 90%");
    middle90.append("text").attr("y", 12).text("of the data");

    return container.node();  
}

