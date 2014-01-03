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

// scrolling
var top_row_offset = 0;
var bottom_row_offset = 0;

var nodes = [];
var cards = [];
var relations = []; // relations are between nodes
var links = []; // links are between cards

var nodes = [];
var relations = [];

function indexOfNode(node_id) {
    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].id === node_id) {
            return i;
        }
    }
    return -1; // not found
}

function indexOfRelation(relation_id) {
    for (i = 0; i < relations.length; i++) {
        if (relations[i].id === relation_id) {
            return i;
        }
    }
    return -1; // not found
}

function set_incoming_and_outgoing(relation) {
    if (get_other_id(relation) === null) {
        relation.from.outgoing.push(relation.to);
        relation.to.incoming.push(relation.from);
    }
} 

function set_relation_id(relation, node) {
    if (relation.from === node.id) {
        relation.from = node;
    } else if (relation.to === node.id) {
        relation.to = node;
    } else {
        console.log("Uh oh, node " + node.id + " not found for relation " + relation.id);
    }

    set_incoming_and_outgoing(relation);
}

function get_other_id(relation) {
    // call this after calling "set_relation_id"
    if (typeof relation.from === 'number') {
        return relation.from;
    } else if (typeof relation.to === 'number') {
        return relation.to;
    } else {
        return null;
    }
}

function ajax_get_node(node_id, callback) {
    // if node already exists, DON'T evenn call this function!
    // mock ajax function for now
    $.ajax({
        url: "mock_ajax/" + node_id + ".json",
        type: "GET",
        dataType: "json",
    }).done(function (data) {
        data.incoming = [];
        data.outgoing = [];
        nodes.push(data);
        if (typeof callback !== 'undefined') {
            callback(data);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log("Failed to get node " + node_id + ": " + errorThrown);
    });
}

function ajax_get_relation_nodes_function(new_relation, existing_node) {
    // http://stackoverflow.com/a/750506/257583
    return function () {
        if (indexOfRelation(new_relation.id) === -1) { // it's a new relation
            set_relation_id(new_relation, existing_node);
            var missing_id = get_other_id(new_relation);
            var missing_index = indexOfNode(missing_id);
            if (missing_index === -1) { // node is currently missing
                ajax_get_node(missing_id, function (new_node) {
                    set_relation_id(new_relation, new_node);
                    relations.push(new_relation);
                    draw_graph();
                })
            } else { // node already exists, just use it
                set_relation_id(new_relation, nodes[missing_index]);
                relations.push(new_relation);
            }
        }
    }
}

function ajax_get_relations_of(node, callback) {
    // get relations and make sure that nodes for relations get fetched as well
    // mock ajax function for now
    $.ajax({
        url: "mock_ajax/arg_" + node.id + "_relations.json",
        type: "GET",
        dataType: "json",
    }).done(function (data) {
        ajax_relation_nodes_functions = []
        for (var i = 0; i < data.length; i++) {
            ajax_relation_nodes_functions.push(ajax_get_relation_nodes_function(data[i], node));
        }
        for (var i = 0; i < ajax_relation_nodes_functions.length; i++) {
            ajax_relation_nodes_functions[i]();
        }
        if (typeof callback !== 'undefined') {
            callback(data);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log("Failed to get relations of node " + node.id + ": " + errorThrown);
    });
}

function ajax_get_card(node) {
    ajax_get_relations_of(node, function (relations) {
        draw_graph();
    });
}

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

function x_pos(node) {
    if (node == current_card) {
        node.i = 0; // doesn't matter for current_card
        return (window.innerWidth / 2) - half_card_width;
    } else if (is_outgoing(node)) {
        if (node.i == null) {
            node.i = next_outgoing_i;
            next_outgoing_i++;
        }
        return top_row_offset + (node.i * (card_width + 10) + 10);
    } else if (is_incoming(node)) {
        if (node.i == null) {
            node.i = next_incoming_i;
            next_incoming_i++;
        }
        return bottom_row_offset + (node.i * (card_width + 10) + 10);
    } else {
        if (node.previously_current) {
            return window.innerWidth + 10;
        } else if (node.previously_outgoing || node.previously_incoming) {
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
        } else if (node.previously_incoming) {
            return graph_height + 10;
        } else {
            console.log(node);
        }
    }
}

function row_width(num_cards) {
    return 10 + (num_cards * (card_width + 10));
}

function min_top_row_offset() {
    // how far can you move the top row to the left?
    // if window contains entire row, then 0 because you don't need to
    // move any more to the left
    // otherwise, move only as much as needed
    return Math.min(0, window.innerWidth - row_width(next_outgoing_i));
}

function min_bottom_row_offset() {
    // how far can you move the bottom row to the left?
    return Math.min(0, window.innerWidth - row_width(next_incoming_i));
}

function max_top_row_offset() {
    // how far can you move the top row to the right?
    // if window contains entire row, then move as far to the right without breaching it
    // otherwise, don't move right at all from the start position
    return Math.max(0, window.innerWidth - (10 + next_outgoing_i * (card_width + 10)));
}

function max_bottom_row_offset() {
    return Math.max(0, window.innerWidth - (10 + next_incoming_i * (card_width + 10)));
}

var drag = d3.behavior.drag()
            .on("drag", function () {
                if (d3.event.y <= (card_height + 20)) {
                    top_row_offset += d3.event.dx;
                    draw_graph(0);

                    // note: this code won't be called on a refresh. move to draw_graph?
                    if (top_row_offset < min_top_row_offset()) {
                        top_row_offset = min_top_row_offset();
                        draw_graph(0);
                    } else if (top_row_offset > max_top_row_offset()) {
                        top_row_offset = max_top_row_offset();
                        draw_graph(0);
                    }
                } else if (d3.event.y >= (graph_height - card_height - 20)) {
                    bottom_row_offset += d3.event.dx;
                    draw_graph(0);

                    if ((bottom_row_offset < 0) && (bottom_row_offset < min_bottom_row_offset())) {
                        bottom_row_offset = min_bottom_row_offset();
                        draw_graph(0);
                    } else if (bottom_row_offset > max_bottom_row_offset()) {
                        bottom_row_offset = max_bottom_row_offset();
                        draw_graph(0);
                    }
                }
            })

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
    new_cards.append("rect").attr("width", card_width).attr("height", card_height)
                .style("opacity", 0).call(drag);
    var switch_objects = new_cards.append("switch").call(drag);
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
        if (d3.event.defaultPrevented) return;

        top_row_offset = 0;
        bottom_row_offset = 0;

        current_card = d;
        ajax_get_card(d);
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
        }).style("opacity", 0);
}

function draw_graph(transition_time) {
    transition_time = typeof transition_time === 'undefined' ? 500 : transition_time;

    reset_globals();
    make_cards();
    make_links();
    
    var svg = d3.select("svg#graph");
    d3.selectAll("g rect").transition().duration(transition_time)
        .attr("x", x_pos).attr("y", y_pos).style("opacity", 1);
    // http://stackoverflow.com/a/11743721/257583
    // also, doesn't matter if the text is opaque or not since it's the
    // same color as the background
    d3.selectAll(".foreign-object").transition().duration(transition_time)
        .attr("x", x_pos).attr("y", y_pos);
    cards.each(function (d) {
        if (current_card == d) {
            d.previously_current = true;
            d.previously_outgoing = false;
            d.previously_incoming = false;
        } else if (is_outgoing(d)) {
            d.previously_current = false;
            d.previously_outgoing = true;
            d.previously_incoming = false;
        } else if (is_incoming(d)) {
            d.previously_current = false;
            d.previously_outgoing = false;
            d.previously_incoming = true;
        } // else shouldn't happen
    });
    links.transition().duration(transition_time).style("opacity", function (d) {
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
    ajax_get_node(1, function (data) {
        current_card = data;
        draw_graph();

        ajax_get_relations_of(nodes[0], function (data) {
            draw_graph();
        })
    })
    
    draw_graph();
}