var card_width = 300;
var card_height = 186;
var half_card_width = card_width / 2;
var half_card_height = card_height / 2;

var next_outgoing_i = 0; /* the index of the next node that's outgoing */
var next_incoming_i = 0;

/* Which card is currently displayed in the middle of the screen? */
var current_card = null;

/* Height of rendered graph */
var graph_height = null;
var min_graph_height = 808;

var nodes = [];
var cards = [];
var relations = []; // relations are between nodes
var links = []; // links are between cards

var node0 = {
    "summary": "Why a max length of 140 characters? Well, it sure as hell works for Twitter. Seems like just enough to pack some good info into an argument.",
}

var node1 = {
    "summary": "Taxation is theft.",
}

var node2 = {
    "summary": "You pay taxes in exchange for voluntarily living in a country and using its public services.",
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

var nodes = [node2, node0, node1];
var relations = [link21, link20];
current_card = node2;

function is_outgoing(node) {
    return current_card.outgoing.indexOf(node) != -1;
}

function is_incoming(node) {
    return current_card.incoming.indexOf(node) != -1;
}

function node_visible(node) {
    return (node == current_card) || is_outgoing(node) || is_incoming(node);
}

function link_visible(link) {
    // both ends of a link must be visible for a link to be visible
    return node_visible(link.from) && node_visible(link.to);
}

function set_incoming_and_outgoing() {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].outgoing = [];
        nodes[i].incoming = [];
    }

    for (var i = 0; i < relations.length; i++) {
        var relation = relations[i];
        relation.from.outgoing.push(relation.to);
        relation.to.incoming.push(relation.from);
    }
}

function x_pos(node) {
    if (node == current_card) {
        node.i = 0; // doesn't matter for current_card
        return (window.innerWidth / 2) - half_card_width;
    } else if (is_outgoing(node)) {
        if (node.i == null) {
            node.i = next_outgoing_i;
            next_outgoing_i++;
        }
        return node.i * (card_width + 10) + 10;
    } else if (is_incoming(node)) {
        if (node.i == null) {
            node.i = next_incoming_i;
            next_incoming_i++;
        }
        return node.i * (card_width + 10) + 10;
    } else {
        if (node.previously_current) {
            return window.innerWidth + 10;
        } else if (node.previously_outgoing) {
            return (window.innerWidth / 2) - half_card_width;
        }
    }
}

function y_pos(node) {
    if (node == current_card) {
        return (graph_height / 2) - half_card_height;
    } else if (is_outgoing(node)) {
        return 10;
    } else if (is_incoming(node)) {
        return graph_height - 10 - card_height;
    } else {
        if (node.previously_current) {
            return (graph_height / 2) - half_card_height;
        } else if (node.previously_outgoing) {
            return -10 - card_height;
        } else {
            console.log(node);
        }
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

function reset_globals() {
    for (var i=0; i < nodes.length; i++) {
        node = nodes[i];
        node.i = null;
    }
    next_outgoing_i = 0;
    next_incoming_i = 0;
}

function make_cards() {
    var svg = d3.select("svg#graph");
    cards = svg.selectAll("g").data(nodes);
    new_cards = cards.enter().append("g").classed("argument", true);
    new_cards.append("rect").attr("width", card_width).attr("height", card_height);
    var switch_objects = new_cards.append("switch");
    switch_objects.append("foreignObject").classed("foreign-object", true)
            .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
            .attr("width", card_width).attr("height", card_height)
            .append("xhtml:div").classed("summary", true).append("p")
            .classed("summary", true).text(function (d) {
                return d.summary;
            }).attr("xmlns", "http://www.w3.org/1999/xhtml");
    switch_objects.append("text").attr("x", 100).attr("y", 100)
        .text("Sorry, your browser is not currently supported.");
    new_cards.on("click", function (d) {
        current_card = d;
        draw_graph();
    })
}

function make_links() {
    var svg = d3.select("svg#graph");
    links = svg.selectAll("path").data(relations);
    links.enter().append("path")
        .attr("class", function(d) {
            return d.type;
        }).attr("marker-end", function(d) {
            return "url(#arrow-" + d.type + ")";
        });
}

function draw_graph() {
    reset_globals();
    make_cards();
    make_links();
    
    var svg = d3.select("svg#graph");
    d3.selectAll("g rect").transition().duration(500).attr("x", x_pos).attr("y", y_pos);
    // http://stackoverflow.com/a/11743721/257583
    d3.selectAll(".foreign-object").transition().duration(500).attr("x", x_pos).attr("y", y_pos);
    cards.each(function (d) {
        if (current_card == d) {
            d.previously_current = true;
            d.previously_outgoing = false;
        } else if (is_outgoing(d)) {
            d.previously_current = false;
            d.previously_outgoing = true;
        }
    });
    links.transition().duration(500).style("opacity", function (d) {
        // if one end of the link is currently displayed, then the other is too
        if (link_visible(d)) {
            return 1;
        } else {
            return 0;
        }
    }).attr("d", compute_link_bezier_curve);
}

window.onload = function () {
    if ($("#graph").height() < min_graph_height) {
        alert("Whoops, looks like some things won't be displaying correctly. Please tell us about this.");
    }
    graph_height = $("#graph").height();
    set_incoming_and_outgoing();
    draw_graph();
}