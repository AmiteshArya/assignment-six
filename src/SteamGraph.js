import React, { Component } from "react";
import * as d3 from "d3";

class StreamGraph extends Component {
  state = {
    data: null,
    colors: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"]
  };

  handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsedData = d3.csvParse(text);
      this.setState({ data: parsedData }, this.renderStreamGraph);
    };
    reader.readAsText(file);
  };

  renderStreamGraph = () => {
    const { data, colors } = this.state;
    if (!data) return;

    d3.select("#streamgraph").selectAll("*").remove();

    const margin = { top: 20, right: 300, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    data.forEach(d => d.Date = new Date(d.Date));
    
    const keys = Object.keys(data[0]).slice(1);

    const stack = d3.stack().keys(keys).offset(d3.stackOffsetWiggle);
    
    const series = stack(data);

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.Date))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(series, layer => d3.min(layer, d => d[0])), 
               d3.max(series, layer => d3.max(layer, d => d[1]))])
      .range([height, 0]);

    const svg = d3.select("#streamgraph")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("g")
      .attr("transform", `translate(0,${height+5})`)
      .call(d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b")));

    svg.selectAll(".layer")
      .data(series)
      .enter().append("path")
      .attr("class", "layer")
      .attr("d", d3.area()
        .x(d => xScale(d.data.Date))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveCardinal))
      .style("fill", (d, i) => colors[i % colors.length])
      .on("mouseover", (event, layer) => this.handleMouseOver(event, layer, colors[keys.indexOf(layer.key)]))
      .on("mouseout", this.handleMouseOut);

    this.renderLegend(svg, width, keys);
  };

  handleMouseOver = (event, layer, color) => {
    const categoryName = layer.key;
    
    const tooltip = d3.select('#tooltip');
    
    tooltip.style('visibility', 'visible')
           .style('top', event.pageY + 5 + 'px')
           .style('left', (event.pageX - 120) + 'px')
           .style('background-color', "#f0f0f0");

    tooltip.selectAll("*").remove();

    const miniWidth = 240;
    const miniHeight = 150;
    
    const svgMini = tooltip.append("svg")
                           .attr("width", miniWidth + 50)
                           .attr("height", miniHeight + 50);

    const categoryData = this.state.data.map(d => ({
      date: new Date(d.Date),
      value: +d[categoryName]
    }));

    const xMiniScale = d3.scaleBand()
                         .domain(categoryData.map(d => d.date))
                         .range([30, miniWidth])
                         .padding(0.1);

    const yMiniScale = d3.scaleLinear()
                         .domain([0, d3.max(categoryData, d => d.value)])
                         .range([miniHeight, 20]);

   svgMini.append("g")
          .attr("transform", `translate(0,${miniHeight})`)
          .call(d3.axisBottom(xMiniScale).tickFormat(d3.timeFormat("%b")));

   svgMini.append("g")
          .attr("transform", "translate(30,0)")
          .call(d3.axisLeft(yMiniScale).ticks(5));

   svgMini.selectAll(".bar")
          .data(categoryData)
          .enter().append("rect")
          .attr("class", "bar")
          .attr("x", d => xMiniScale(d.date))
          .attr("y", miniHeight)
          .attr("width", xMiniScale.bandwidth())
          .attr("height", 0) 
          .attr("y", d => yMiniScale(d.value))
          .attr("height", d => miniHeight - yMiniScale(d.value))
          .transition() 
          .duration(500)
          .style("fill", color);
 }

 handleMouseOut() {
   d3.select('#tooltip').style('visibility', 'hidden');
 }

 renderLegend(svg, width, keys) {
   const { colors } = this.state;
   
   const legend = svg.append("g")
                     .attr("transform", `translate(${width + 10}, 20)`);

   keys.forEach((key, i) => {
     legend.append("rect")
       .attr("x", 10)
       .attr("y", 200 + i * -25)
       .attr("width", 20)
       .attr("height", 20)
       .style("fill", colors[i % colors.length]);

     legend.append("text")
       .attr("x", 35)
       .attr("y", 200 + i * -25 + 10)
       .text(key)
       .style("font-size", "12px")
       .style("alignment-baseline", "middle");
   });
 }

 render() {
   return (
     <div className="streamgraph-container">
       <div style={{ backgroundColor: "#f0f0f0", padding: 20 }}>
         <h2>Upload a CSV File</h2>
         <form onSubmit={this.handleFileSubmit}>
           <input type="file" accept=".csv" onChange={this.handleFileUpload} />
         </form>
       </div>
       <div id="streamgraph"></div>
       <div id="tooltip" style={{ position: "absolute", visibility: "hidden" }}></div>
     </div>
   );
 }
}

export default StreamGraph;
