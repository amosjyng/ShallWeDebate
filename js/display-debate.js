var card_width = "300";
var card_height = "186";

var node0 = {
    "summary": "Why a max length of 140 characters? Well, it sure as hell works for Twitter. Seems like just enough to pack some good info into an argument."
}

function draw_node(node, x, y) {
    $("svg#graph").append(build_node_rect(node));
}

function draw_graph() {
    var svg = d3.select("svg#graph");
    var html_nodes = svg.selectAll("g").data([node0]);
    var new_nodes = html_nodes.enter().append("g").classed("argument", true);
    new_nodes.append("rect").attr("width", card_width)
        .attr("height", card_height).attr("x", "10").attr("y", "10");
    var switch_objects = new_nodes.append("switch");
    switch_objects.append("foreignObject")
            .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
            .attr("width", card_width).attr("height", card_height)
            .attr("x", "10").attr("y", "10").append("xhtml:div")
            .attr("class", "summary").append("p")
            .classed("summary", true).text(function (d) {
                return d.summary;
            }).attr("xmlns", "http://www.w3.org/1999/xhtml");
    switch_objects.append("text").attr("x", "10").attr("y", "10").text("Sorry, your  browser is not supported.")
}