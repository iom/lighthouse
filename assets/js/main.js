
import * as forms from "./forms.js";
import * as util from "./util.js";
import { renderMap } from "./plot-map.js";
// import { renderBoxplot } from "./plot-boxplot.js";

const formIcons = d3.select(".form-icons .form-body")
    .call(forms.addFormIcons);

// Tooltip

d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .style("display", "none")
    .style("position", "absolute")
    .style("z-index", 999)
    .style("width", "auto")
    .style("max-width", "300px")
    .style("height", "auto")
    .style("border", `1px solid ${ util.colors.gray4 }`);

    
updateChart("map");
// updateChart("boxplot");
    
function updateChart(selected) {
    switch(selected) {
        case "map":
            return renderMap();
        case "boxplot":
            return renderBoxplot();
    }
}