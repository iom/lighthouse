
import * as util from "./util.js";

export function addFormSlider(container) {

    const years = ({ min: 2018, max: 2024 });

    const form = container.append("form")
        .attr("id", "form-year-slider");

    // Title and description
    const titleContainer = form.append("div")
        .attr("class", "form-head");
    titleContainer.append("span")
        .attr("class", "form-title")
        .text("Año");
    const label = titleContainer.append("span")
        .attr("class", "form-desc slider-label");

    const sliderContainer = form.append("div")
        .attr("class", "slider-container")

    const slider = sliderContainer.append("div")
        .attr("class", "slider")
    
    const slideOne = sliderContainer.append("input")
        .attr("id", "slider-1")
        .attr("type", "range")
        .attr("min", years.min)
        .attr("max", years.max)
        .attr("step", 1)
        .attr("value", years.min)
        .on("input", () => {
            let val1 = +slideOne.property("value");
            let val2 = +slideTwo.property("value");
            if (val1 >= val2) {
                slideOne.property("value", val2);
                val1 = val2;
            }
            fillColor();
        });

    const slideTwo = sliderContainer.append("input")
        .attr("id", "slider-2")
        .attr("type", "range")
        .attr("min", years.min)
        .attr("max", years.max)
        .attr("step", 1)
        .attr("value", years.max)
        .on("input", () => {
            let val1 = +slideOne.property("value");
            let val2 = +slideTwo.property("value");
            if (val2 <= val1) {
                slideTwo.property("value", val1);
                val2 = val1;
            }
            fillColor();
        });

    fillColor();

    function fillColor() {
        let steps = years.max - years.min;
        let percent1 = ((slideOne.property("value") - years.min) / steps) * 100;
        let percent2 = ((slideTwo.property("value") - years.min) / steps) * 100;
        slider.style("background", `linear-gradient(to right,
                ${ util.colors.blue5 } ${ percent1 }%,
                ${ util.colors.blue3 } ${ percent1 }%,
                ${ util.colors.blue3 } ${ percent2 }%,
                ${ util.colors.blue5 } ${ percent2 }%
            )`);
        
        label.text(slideOne.property("value") + "\u2013" + slideTwo.property("value"));
    };
}

export function addFormIcons(container) {

    const params = { pad: 75, radius: 15 };

    const iconsData = [
        { i: 1, src: "regin",  lab1: "Entradas",   lab2: "regulares"  },
        { i: 2, src: "regout", lab1: "Salidas",   lab2: "regulares"    },
        { i: 3, src: "irreg",  lab1: "Entradas", lab2: "irregulares"  }
    ];
    
    const icons = container.append("form")
        .attr("id", "radio-indicator");

    icons.append("div")
        .attr("class", "form-head")
        .append("div")
        .attr("class", "form-title")
        .text("Indicador");

    const formBody = icons.append("div")
        .attr("class", "form-body");
    
    iconsData.forEach(d => {
        
        const group = formBody.append("div")
            .attr("tabindex", 0)
            .attr("class", "icon-group")
            .attr("id", "icon-group-" + d.i)
            .attr("value", d.src);
                
        group.append("div")
            .attr("class", "icon")
            .append("img")
                .attr("src", "assets/images/" + d.src + ".svg")
                .attr("width", params.radius + 5 + "px")
                .attr("height", params.radius + 5 + "px");
        
        const label = group.append("div")
            .attr("class", "icon-label");

        label.append("div").text(d.lab1);
        label.append("div").text(d.lab2);
    });
    
    // Default value
    icons.select("#icon-group-1").classed("icon-clicked", true);
};

export function addFormRadio(container) {

    const years = [2022, 2023, 2024];
    
    const dropdown = container.append("form")
        .attr("id", "radio-year");

    dropdown.append("div")
        .attr("class", "form-head")
        .append("div")
        .attr("class", "form-title")
        .text("Año");

    const formBody = dropdown.append("div")
        .attr("class", "form-body");

    formBody.selectAll("label")
        .data(years)
        .join("label")
        .each(function(d) {
            d3.select(this)
                .append("input")
                .attr("type", "radio")
                .attr("name", "radio-year")
                .attr("value", d);
            d3.select(this)
                .append("span")
                .text(d);
        })

    // Default value
    dropdown.select("input[value='2024']").property("checked", true);
}

export function addFormDropdown(container, options) {
  
    const dropdown = container.append("form")
        .attr("id", "dropdown-geo");

    dropdown.append("div")
        .attr("class", "form-head")
        .append("div")
        .attr("class", "form-title")
        .text("País informante");

    const addOption = (form, key, value) => {
        form.append("option")
            .text(value)
            .attr("value", key);
    };

    const formBody = dropdown.append("div")
        .attr("class", "form-body")
        .append("select");

    for (let [code, label] of Object.entries(options)) {
        formBody.call(addOption, code, label);
    }

    // Default value
    formBody.select("option[value='0']").attr("selected", true);
}

export function addFormDropdownNats(container, geoSelect) {
  
    const geoSelected = util.geosES[geoSelect];

    const dropdown = container.append("form")
        .attr("id", "dropdown-nat");

    dropdown.append("div")
        .attr("class", "form-head")
        .append("div")
        .attr("class", "form-title")
        .text("Nacionalidad");

    const addOption = (form, value) => {
        form.append("option")
            .text(value)
            .attr("value", value);
    };

    const formBody = dropdown.append("div")
        .attr("class", "form-body")
        .append("select");

    const nats = util.natsES.filter(x => x !== geoSelected);

    for (let i = 0; i < nats.length; i++) {
        formBody.call(addOption, nats[i]);
    }

    // Default value
    formBody.select("option[value='Total']").attr("selected", true);
}
