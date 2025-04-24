
import * as forms from "./forms.js";
import * as util from "./util.js";
import { renderMap } from "./plot-map.js";
import { renderGrid } from "./plot-grid.js";

document.querySelectorAll(".tab").forEach(button => {

    button.addEventListener("click", switchTab);

    button.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            switchTab.call(this);
        }
    });
});

function switchTab() {
    document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
    this.classList.add("active");

    const chartType = this.getAttribute("data-chart");
    updateChart(chartType);
}

// const formIcons = d3.select(".form-icons .form-body")
//     .call(forms.addFormIcons);

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
    
function updateChart(selected) {
    switch(selected) {
        case "map":
            return renderMap();
        case "grid":
            return renderGrid();
    }
}