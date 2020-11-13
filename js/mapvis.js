/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */

class MapVis {

    // constructor method to initialize MapVis object
    constructor(parentElement, geoData, companies) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.companies = companies;
        // this.displayData = [];

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis()
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("transform", "translate(" + vis.margin.left + ", " + vis.margin.top + ")");

        // add title
        vis.svg.append("g")
            .attr("class", "title map-title")
            .append("text")
            .text("Map")
            .attr("transform", "translate(" + vis.width / 2 + ", 20)")
            .attr("text-anchor", "middle");

        // tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "mapTooltip");

        // color gradient for legend
        // vis.defs = vis.svg.append("defs");
        //
        // vis.linearGradient = vis.defs.append("linearGradient")
        //     .attr("id", "linear-gradient");
        //
        // vis.linearGradient
        //     .attr("x1", "0%")
        //     .attr("y1", "0%")
        //     .attr("x2", "100%")
        //     .attr("y2", "0%");
        //
        // vis.linearGradient.append("stop")
        //     .attr("offset", "0%")
        //     .attr("stop-color", "white");
        //
        // vis.linearGradient.append("stop")
        //     .attr("offset", "90%")
        //     .attr("stop-color", "darkcyan");

        // legend
        // vis.legendWidth = 0.3 * vis.width;
        // vis.legendHeight = 30;
        //
        // vis.legend = vis.svg.append("g")
        //     .attr("class", "legend")
        //     .attr("transform", "translate(" + vis.width * 0.65 + ", " + vis.height * 0.95 + ")");
        //
        // vis.legend.append("rect")
        //     .attr("width", vis.legendWidth)
        //     .attr("height", vis.legendHeight)
        //     .attr("y", -vis.legendHeight)
        //     .style("fill", "url(#linear-gradient)");
        //
        // vis.legendScale = d3.scaleLinear()
        //     .range([0, vis.legendWidth]);
        //
        // vis.legendAxis = d3.axisBottom();
        //
        // vis.colorScale = d3.scaleLinear()
        //     .range(["white", "darkcyan"]);

        // map
        vis.viewpoint = {'width': 975, 'height': 610};
        vis.zoom = vis.width / vis.viewpoint.width;

        vis.mapGroup = vis.svg.append("g")
            .attr("class", "states")
            .attr("transform", "translate(0, " + vis.height/20 + ")");

        vis.mapProjection = d3.geoMercator()
            .translate([1000, 450])
            .scale([445]);

        vis.path = d3.geoPath()
            .projection(vis.mapProjection);

        // vis.mapPath = d3.geoPath()
        //     .projection(vis.mapProjection);

        vis.country = topojson.feature(vis.geoData, vis.geoData.objects.states).features;

        // vis.svg.selectAll("circle")
        //     .data(vis.companies)
        //     .enter()
        //     .append("circle")
        //     .attr("r", "8")
        //     .attr("fill", "red")
        //     .attr("cx", function(d) {
        //         console.log(d);
        //     })
        //     .attr("cy", )


        // // draw states
        // vis.states = vis.mapGroup.selectAll(".state")
        //     .data(vis.country)
        //     .enter()
        //     .append("path")
        //     .attr("class", d => "state path " + d.properties.name.replace(" ", ""))
        //     .attr("d", vis.path)
        //     .attr("transform", "scale(" + vis.zoom + ", " + vis.zoom +")")
        //     .attr('stroke-width', '1px')
        //     .attr("stroke", "black")
        //     .attr("fill", "white");

        // wrangleData
        // vis.wrangleData();

        // vis.updateVis();
    }

    wrangleData(){
        let vis = this;

        // check out the data

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];

        // console.log(selectedTimeRange);

        // if there is a region selected
        if (selectedTimeRange.length !== 0){
            //console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

            // iterate over all rows the csv (dataFill)
            vis.covidData.forEach( row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.submission_date).getTime() && vis.parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime() ){
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // prepare covid data by grouping all rows by state
        let covidDataByState = Array.from(d3.group(filteredData, d =>d.state), ([key, value]) => ({key, value}));

        // have a look
        // console.log(covidDataByState)

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = {};

        vis.domainMax = 0;

        // merge
        covidDataByState.forEach( state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data set
            vis.usaData.forEach( row => {
                if(row.state === stateName){
                    population += +row["2019"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach( entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });


            // populate the final data structure
            vis.stateInfo[stateName] =
                {
                    name: stateName,
                    population: population,
                    absCases: newCasesSum,
                    absDeaths: newDeathsSum,
                    relCases: (newCasesSum/population*100),
                    relDeaths: (newDeathsSum/population*100)
                }
        })

        Object.keys(vis.stateInfo).forEach(function(key) {
            vis.domainMax = Math.max(vis.domainMax, vis.stateInfo[key][selectedCategory]);
        })

        // console.log('final data structure for mapVis', vis.stateInfo);

        vis.updateVis();

    }

    updateVis(){
        let vis = this;

        vis.legendScale.domain([0, vis.domainMax]);
        vis.colorScale.domain([0, vis.domainMax]);

        vis.legendAxis.scale(vis.legendScale)
            .tickValues([0, vis.domainMax]);

        vis.legend.call(vis.legendAxis);

        // color states and add tooltip
        vis.states.transition()
            .duration(1000)
            .style("fill", function(d) {
                return vis.colorScale(vis.stateInfo[d.properties.name][selectedCategory]);
            });

        vis.states.on("mouseover", function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .style("fill", "red")
                    .style("opacity", 0.8);

                d3.selectAll("." + d.properties.name.replace(" ", ""))
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .style("fill", "red")
                    .style("opacity", 0.8);

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                             <h3>${d.properties.name}<h3>
                             <h4> Population: ${vis.stateInfo[d.properties.name].population}</h4>
                             <h4> Cases (absolute): ${vis.stateInfo[d.properties.name].absCases}</h4>
                             <h4> Deaths (absolute): ${vis.stateInfo[d.properties.name].absDeaths}</h4>
                             <h4> Cases (relative): ${vis.stateInfo[d.properties.name].relCases.toFixed(2) + "%"}</h4>
                             <h4> Deaths (relative): ${vis.stateInfo[d.properties.name].relDeaths.toFixed(2) + "%"}</h4>
                         </div>`);
            })
            .on('mouseout', function(event, d){
                d3.selectAll("." + d.properties.name.replace(" ", ""))
                    .attr('stroke-width', '0px')
                    .style("fill", vis.colorScale(vis.stateInfo[d.properties.name][selectedCategory]))
                    .style("opacity", 1);

                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black')
                    .style("fill", d => vis.colorScale(vis.stateInfo[d.properties.name][selectedCategory]))
                    .style("opacity", 1);

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.states.exit().remove();
    }
}