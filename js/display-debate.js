var card_width = 300;
var card_height = 186;
var half_card_width = card_width / 2;
var half_card_height = card_height / 2;

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

var link20 = {
    "from": node2,
    "to": node0,
    "type": "support"
}

var link21 = {
    "from": node2,
    "to": node1,
    "type": "oppose"
}

function x_pos(node, i) {
    if (node == current_card) {
        node.i = i;
        return (window.innerWidth / 2) - half_card_width;
    } else {
        node.i = i;
        return i * (card_width + 10) + 10;
    }
}

function y_pos(node, i) {
    if (node == current_card) {
        node.i = i;
        return (graph_height / 2) - half_card_height;
    } else {
        node.i = i;
        return 10;
    }
}

function pos2str(pos) {
    return pos[0] + "," + pos[1] + " ";
}

function compute_link_bezier_curve(link) {
    var from = link.from;
    var to = link.to;
    var start_pos = [x_pos(from, from.i) + half_card_width, y_pos(from, from.i)];
    var end_pos = [x_pos(to, to.i) + half_card_width,
                    /* marker-widht is 3, stroke-width is 5 */
                   y_pos(to, to.i) + card_height + (5 * 3)];
    var height = end_pos[1] - start_pos[1];
    var control1 = [start_pos[0], start_pos[1] + (height / 2)];
    var control2 = [end_pos[0], end_pos[1] - (height / 2)];
    return "M" + pos2str(start_pos) + "C" + pos2str(control1)
            + pos2str(control2) + pos2str(end_pos);
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
        .text("Sorry, your browser is not supported.");
    var html_links = svg.selectAll("path").data([link21, link20]);
    var new_links = html_links.enter().append("path")
        .attr("class", function(d) {
            return d.type;
        }).attr("d", compute_link_bezier_curve)
        .attr("marker-end", function(d) {
            return "url(#arrow-" + d.type + ")"
        });
}

window.onload = function () {
    graph_height = $("#graph").height();
    draw_graph();
}