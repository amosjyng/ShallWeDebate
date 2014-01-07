/** Width of the card representation of a node */
var card_width = 300;
/** Height of the card representation of a node */
var card_height = 186;
/** Often-used unit that is exactly half of the card_width */
var half_card_width = card_width / 2;
/** Often-used unit that is exactly half of the card_height */
var half_card_height = card_height / 2;


/** Index of the next outgoing node (relative to the current node) to be
    displayed (in the top row) */
var next_outgoing_i = 0;
/** Index of the next incoming node (relative to the current node) to be
    displayed (in the bottom row) */
var next_incoming_i = 0;


/** The currently-selected card that is displayed in the middle of the screen */
var current_card = null;

/** Height of final rendered graph. @todo Make this height scalable */
var graph_height = null;
/** What the minimum height of the final graph should be for optimal display
    of the arguments */
var min_graph_height = 808;


/** Determines how much the top row is offset from the left side of the window.
    Used for scrolling the top row */
var top_row_offset = 0;
/** Determines how much the bottom row is offset from the left side of the window.
    Used for scrolling the bottom row */
var bottom_row_offset = 0;

/** All the arguments currently fetched */
var nodes = [];
/** The SVG representations of all the nodes */
var cards = [];
/** All the relations arguments have with each other, as well as with other relations */
var relations = [];
/** The SVG representations of all the relations */
var links = [];


/**
 * Finds the node with node_id in "nodes"
 * @param {Number} node_id The ID of the node which you wish to search for
 * @returns {Number} If found, the position of the node in the "nodes" array.
 * If not found, -1.
 */
function indexOfNode(node_id) {
    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].id === node_id) {
            return i;
        }
    }
    return -1; // not found
}

/**
 * Finds the relation with relation_id in "relations"
 * @param {Number} relation_id The ID of the relation which you wish to search for
 * @returns {Number} If found, the position of the relation in the "relations" array.
 * If not found, -1.
 */
function indexOfRelation(relation_id) {
    for (i = 0; i < relations.length; i++) {
        if (relations[i].id === relation_id) {
            return i;
        }
    }
    return -1; // not found
}

/**
 * Adds incoming and outgoing nodes directly to the "to" and "from" nodes at
 * the opposite ends of a relation. This is for convenience.
 * @param {Relation} relation A relation which should already have its IDs
 * at both ends replaced by actual node objects using "set_relation_id". If
 * this is not the case, however, no harm is done as this funtion checks for
 * that before taking action.
 */
function set_incoming_and_outgoing(relation) {
    // See if node IDs are already replaced by "set_relation_id"
    if (get_other_id(relation) === null) {
        // add the "to" node of this relation to the set of outgoing nodes
        // relative to the "from" node of this relation
        relation.from.outgoing.push(relation.to);
        // add the "to" node of this relation to the set of outgoing nodes
        // relative to the "from" node of this relation
        relation.to.incoming.push(relation.from);
    }
}

/**
 * Given a node, replaces the node_id in the relation with the actual node.
 * If appropriate, modifies the incoming and outgoing arrays of the nodes
 * at both ends of the relation.
 *
 * This is for convenience, to prevent searching the entire set of nodes
 * every time.
 * @param {Relation} relation A relation which has at least one end which is
 * just a node's ID and not the actual node.
 * @param {Node} node One of the nodes at either side of the relation. One of
 * the ends of the relation should be the ID of this node.
 */
function set_relation_id(relation, node) {
    // Check if it's the "from" end of a relation that needs to be replaced
    if (relation.from === node.id) {
        relation.from = node; // if so, replace it
    } else if (relation.to === node.id) { // else check if it's the "to" end
        relation.to = node; // if so, replace it
    } else { // otherwise this function should not be called. Log it
        console.log("Uh oh, node " + node.id + " not found for relation " + relation.id);
    }

    // Modify incoming and outgoing arrays of "from" and "to" nodes, if appropriate.
    set_incoming_and_outgoing(relation);
}

/**
 * Given a relation which already has one of the IDs at either end replaced
 * with an actual node, finds the ID that is yet to be replaced.
 * @param {Relation} relation Should be a relation which has already had
 * "set_relation_id" called on it at least once already.
 * @returns {Number} The ID which has not yet been replaced, or null if both
 * IDs have been replaced by actual objects.
 */
function get_other_id(relation) {
    // see if the "from" end is still an ID
    if (typeof relation.from === 'number') {
        return relation.from; // if so, return it
    } else if (typeof relation.to === 'number') { // else check "to" end
        return relation.to; // and if still an ID, return it
    } else { // otherwise both IDs are replaced
        return null;
    }
}

/**
 * Asynchronously retrieve a node from the server and push it into the "nodes"
 * array. Do not call this function once a node has already been retrieved.
 * @param {Number} node_id The ID of the node to retrieve
 * @param {Function} callback The callback function which, when specified, will
 * be called with the newly retrieved node as the sole argument
 * @todo Display error message onscreen when there's a failure
 */
function ajax_get_node(node_id, callback) {
    $.ajax({
        // use mock JSON files for now, until backend is ready
        url: "mock_ajax/" + node_id + ".json",
        type: "GET",
        dataType: "json",
    }).done(function (data) {
        // initialized arrays of incoming and outgoing objects for
        // "set_incoming_and_outgoing" to take care of later
        data.incoming = [];
        data.outgoing = [];
        // add new piece of data to array of nodes
        nodes.push(data);
        // if callback is defined, call it with the new node
        if (typeof callback !== 'undefined') {
            callback(data);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        // todo: display error message to user
        console.log("Failed to get node " + node_id + ": " + errorThrown);
    });
}

/**
 * Get callback function for retrieving nodes associated with a "new_relation"
 * @param {Relation} new_relation The newly-retrieved relation which still has
 * IDs at both ends instead of objects
 * @param {Node} existing_node The existing node whose ID must already be at
 * one end of the "new_relation"
 * @returns {Function} A function that when called, will replaced both ends of
 * "new_relation" with the appropriate object, making another asynchronous GET
 * request for a node if necessary
 */
function ajax_get_relation_nodes_function(new_relation, existing_node) {
    // This function is necessary if you want to bind variables in the function
    // to different values for different iterations of a for loop.
    // See http://stackoverflow.com/a/750506/257583
    return function () {
        // first check if this relation has already been retrieved
        //
        // unlike for nodes, we can't simply not retrieve relations that are
        // already retrieved. Since two different nodes would be attached to
        // the same relation, when we ask the server for all relations
        // associated with a node, it may return some of the same relations
        // that have already been retrieved
        if (indexOfRelation(new_relation.id) === -1) {
            // replace the ID of one end of the relationship with the actual node
            set_relation_id(new_relation, existing_node);
            // find what the ID of the other unreplaced end is
            var missing_id = get_other_id(new_relation);
            // find where the node with that ID is
            var missing_index = indexOfNode(missing_id);
            // if the node with that ID is not found, just retrieve it
            if (missing_index === -1) {
                ajax_get_node(missing_id, function (new_node) {
                    // and once retrieved, replace the other ID with it
                    set_relation_id(new_relation, new_node);
                    // add this relation to the array of currently retrieved
                    // relations
                    relations.push(new_relation);
                    // and redraw the graph
                    draw_graph();
                    // note: could this add a relation twice?
                })
            } else { // node already exists, just use it
                // replace other ID with actual object
                set_relation_id(new_relation, nodes[missing_index]);
                // add this to the array of currently retrieved relations
                relations.push(new_relation);
            }
        }
    }
}

/**
 * Get all relations associated with a particular node, and all other nodes
 * associated with those relations as well
 * @param {Node} node The node to retrieve all the relations for
 * @todo Display error message onscreen when there's a failure
 */
function ajax_get_relations_of(node) {
    $.ajax({
        // use mock JSON files until backend is ready
        url: "mock_ajax/arg_" + node.id + "_relations.json",
        type: "GET",
        dataType: "json",
    }).done(function (data) {
        // collect all callback functions first
        ajax_relation_nodes_functions = []
        for (var i = 0; i < data.length; i++) {
            ajax_relation_nodes_functions.push(ajax_get_relation_nodes_function(data[i], node));
        }
        // then call each of those callback functions
        for (var i = 0; i < ajax_relation_nodes_functions.length; i++) {
            ajax_relation_nodes_functions[i]();
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        // todo: display error message to user
        console.log("Failed to get relations of node " + node.id + ": " + errorThrown);
    });
}

/**
 * After a card is selected (i.e. clicked on), call this function to retrieve
 * all relevant information for the node that the card represents
 * @param {Node} node The node of the card that was clicked on
 * @todo Do nothing except for redrawing the graph if information for this node
 * has already been retrieved
 */
function ajax_get_card(node) {
    ajax_get_relations_of(node); // get all relevant relations and related nodes
    draw_graph(); // re-center the graph immediately
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

function determine_i(node) {
    if (node == current_card) {
        node.i = 0; // doesn't matter what i is for current_card
    } else if (is_outgoing(node)) {
        if (node.i == null) {
            node.i = next_outgoing_i;
            next_outgoing_i++;
        }
    } else if (is_incoming(node)) {
        if (node.i == null) {
            node.i = next_incoming_i;
            next_incoming_i++;
        }
    }
}

function x_pos(node) {
    if (node == current_card) {
        return (window.innerWidth / 2) - half_card_width;
    } else if (is_outgoing(node)) {
        return top_row_offset + (node.i * (card_width + 10) + 10);
    } else if (is_incoming(node)) {
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
                    draw_graph(false, 0);

                    // note: this code won't be called on a refresh. move to draw_graph?
                    if (top_row_offset < min_top_row_offset()) {
                        top_row_offset = min_top_row_offset();
                        draw_graph(false, 0);
                    } else if (top_row_offset > max_top_row_offset()) {
                        top_row_offset = max_top_row_offset();
                        draw_graph(false, 0);
                    }
                } else if (d3.event.y >= (graph_height - card_height - 20)) {
                    bottom_row_offset += d3.event.dx;
                    draw_graph(false, 0);

                    if ((bottom_row_offset < 0) && (bottom_row_offset < min_bottom_row_offset())) {
                        bottom_row_offset = min_bottom_row_offset();
                        draw_graph(false, 0);
                    } else if (bottom_row_offset > max_bottom_row_offset()) {
                        bottom_row_offset = max_bottom_row_offset();
                        draw_graph(false, 0);
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

function center_cards_offset(num_cards) {
    if (row_width(num_cards) >= window.innerWidth) {
        return 0;
    } else {
        return (window.innerWidth - row_width(num_cards)) / 2;
    }
}

function center_cards() {
    top_row_offset = center_cards_offset(next_outgoing_i);
    bottom_row_offset = center_cards_offset(next_incoming_i);
}

/**
 * Create card representations of all unrepresented nodes.
 */
function make_cards() {
    // bind node data to cards
    cards = d3.select("svg#graph").selectAll("g").data(nodes);
    // add new card representations of nodes
    new_cards = cards.enter().append("g").classed("argument", true);
    // create background rectangle for the cards
    new_cards.append("rect").attr("width", card_width).attr("height", card_height)
                .style("opacity", 0).call(drag);
    // create foreignObject containing node text
    var switch_objects = new_cards.append("switch").call(drag);
    switch_objects.append("foreignObject").classed("foreign-object", true)
            .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
            .attr("width", card_width).attr("height", card_height)
            .append("xhtml:div").classed("summary", true).append("p")
            .classed("summary", true).text(function (d) {
                return d.summary;
            }).attr("xmlns", "http://www.w3.org/1999/xhtml");
    // add fallback text in case user's browser doesn't support SVG foreignObject
    switch_objects.append("text").attr("x", 100).attr("y", 100)
        .text("Sorry, your browser is not currently supported.");
    // define action when card is selected
    new_cards.on("click", function (d) {
        // stop here if the click was merely a drag
        if (d3.event.defaultPrevented) return;

        // no need to reset the top and bottom row offsets to zero
        // because that's already done in "draw_graph"

        // set the current_card to the node of the card that was just clicked
        current_card = d;
        // get all the related links and nodes associated with the newly selected node
        ajax_get_card(d);
        // redraw graph
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

function draw_graph(center, transition_time) {
    center = typeof center === 'undefined' ? true : transition_time;
    transition_time = typeof transition_time === 'undefined' ? 500 : transition_time;

    reset_globals();
    make_cards();
    make_links();

    var svg = d3.select("svg#graph");
    d3.selectAll("g rect").each(determine_i);
    if (center) {
        center_cards();
    }
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

        ajax_get_relations_of(nodes[0]);
    })
    
    draw_graph();
}