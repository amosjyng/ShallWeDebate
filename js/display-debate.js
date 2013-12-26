var card_width = 300;
var card_height = 186;

/* Which card is currently displayed in the middle of the screen? */
var current_card = null;

/* Height of rendered graph */
var graph_height = null;

var node0 = {
    "summary": "Why a max length of 140 characters? Well, it sure as hell works for Twitter. Seems like just enough to pack some good info into an argument."
}

var node1 = {
    "summary": "Taxation is theft."
}

var node2 = {
    "summary": "You pay taxes in exchange for voluntarily living in a country and using its public services."
}

function x_pos(node, i) {
    if (node == current_card) {
        return (window.innerWidth / 2) - (card_width / 2);
    } else {
        return i * (card_width + 10) + 10;
    }
}

function y_pos(node, i) {
    if (node == current_card) {
        return (graph_height / 2) - (card_height / 2);
    } else {
        return 10;
    }
}

function draw_graph() {
    current_card = node2;

    var svg = d3.select("svg#graph");
    var html_nodes = svg.selectAll("g").data([node0, node1, node2]);
    var new_nodes = html_nodes.enter().append("g").classed("argument", true);
    new_nodes.append("rect").attr("width", card_width)
        .attr("height", card_height).attr("x", x_pos).attr("y", y_pos);
    var switch_objects = new_nodes.append("switch");
    switch_objects.append("foreignObject")
            .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
            .attr("width", card_width).attr("height", card_height)
            .attr("x", x_pos).attr("y", y_pos).append("xhtml:div")
            .attr("class", "summary").append("p")
            .classed("summary", true).text(function (d) {
                return d.summary;
            }).attr("xmlns", "http://www.w3.org/1999/xhtml");
    switch_objects.append("text").attr("x", x_pos).attr("y", y_pos)
        .text("Sorry, your browser is not supported.")
}

window.onload = function () {
    graph_height = $("#graph").height();
    draw_graph();
}