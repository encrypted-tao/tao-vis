async function fetchData() {


    const data = await d3.json("graph_data.json");
    console.log(data);
    const objects = data.nodes;
  
    const associations = data.links.map((link) => ({
      id1: link.source,
      id2: link.target,
      atype: link.atype,
    }))
  
    const nodes = objects.map((obj) => ({
      id: obj.id,
      otype: obj.otype,
      data: obj.data,
      label: obj.otype === "USER" ? obj.name : obj.content,
    }));
  
    const links = associations.map((assoc) => ({
      source: assoc.id1,
      target: assoc.id2,
      atype: assoc.atype,
    }));
  
    return {
      nodes,
      links,
    };
  }
  
  async function drawNetwork() {
    let data = await fetchData();
  
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    const svg = d3.select("#network").attr("width", width).attr("height", height);
    const g = svg.append("g");
  
    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3.forceLink(data.links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));
  
    const link = g
      .selectAll(".link")
      .data(data.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke-width", 1);
  
    let node = g
      .selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 10)
      .style("fill", (d) => (d.otype === "USER" ? "blue" : "red"))
      .call(drag(simulation));
  
    // const label = g
    //   .selectAll(".label")
    //   .data(data.nodes)
    //   .enter()
    //   .append("text")
    //   .attr("class", "label")
    //   .text((d) => d.otype)
    //   .style("font-size", "15px");

    let nodeLabel = g
      .selectAll(".nodeLabel")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("class", "nodeLabel")
      .text((d) => `${d.otype}: ${d.data}`)
      .style("font-size", "10px")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "middle")
      .style("fill", "black");

    let edgeLabel = g
      .selectAll(".edgeLabel")
      .data(data.links)
      .enter()
      .append("text")
      .attr("class", "edgeLabel")
      .text((d) => d.atype)
      .style("font-size", "10px")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "middle")
      .style("fill", "black");
    
  
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
  
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  
      nodeLabel.attr("x", (d) => d.x).attr("y", (d) => d.y - 20);
      edgeLabel.attr("x", (d) => (d.source.x + d.target.x) / 2).attr("y", (d) => (d.source.y + d.target.y) / 2);
    });
  
    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
  
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
  
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        function zoomed(event) {
          g.attr("transform", event.transform);
        }
      
        const zoomBehavior = d3.zoom().on("zoom", zoomed);
        svg.call(zoomBehavior);

        let filteredNodes = [];
      let filteredLinks = [];
      
      d3.select("#search").on("input", function () {
        const query = this.value.trim().toLowerCase();
        console.log(query);
      
        const filteredNodes = data.nodes.filter((node) => {
          return node.data.toLowerCase().includes(query);
        });
      
        console.log(filteredNodes);
      
        node
          .data(data.nodes)
          .style("fill", (d) =>
            filteredNodes.find((node) => node.id === d.id) ? "green" : d.otype === "USER" ? "blue" : "red"
          );
      
        const filteredLinks = data.links.filter((link) => {
          return link.atype.toLowerCase().includes(query);
        });
      
        console.log(filteredLinks);
      
        link = link.data(filteredLinks, (d) => `${d.source.id}-${d.target.id}`);
        link.exit().remove();
        link.enter().append("line").attr("class", "link").merge(link);
      
        simulation.nodes(filteredNodes).on("tick", ticked);
        simulation.force("link").links(filteredLinks);
        simulation.alpha(1).restart();
      });
      
        return d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
        }
      }
      
      drawNetwork();
      