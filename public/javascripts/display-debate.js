/** Width of the card representation of a node */
var card_width = 300;
/** Height of the card representation of a node */
var card_height = 186;
/** Often-used unit that is exactly half of the card_width */
var half_card_width = card_width / 2;
/** Often-used unit that is exactly half of the card_height */
var half_card_height = card_height / 2;
/** Spacing between adjacent cards in the graph */
var card_spacing = 10;
/** Height of toolbar on cards */
var toolbar_height = 30;


/** Index of the next outgoing node (relative to the current node) to be
    displayed (in the top row) */
var next_outgoing_i = 0;
/** Index of the next incoming node (relative to the current node) to be
    displayed (in the bottom row) */
var next_incoming_i = 0;


/** The currently-selected node whose card is displayed in the middle of the screen
    @todo Change name to current_node? */
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

/** What the different types mean */
TYPE_MEANINGS = ["support", "oppose"];


/**
 * Finds a node in "nodes"
 * @param {Node} node The node which you wish to search for
 * @returns {number} If found, the position of the node in the "nodes" array.
 * If not found, -1.
 */
function indexOfNode(node) {
    for (i = 0; i < nodes.length; i++) {
        if (nodes[i].id === node.id) {
            return i;
        }
    }
    return -1; // not found
}

/**
 * Finds the relation with relation_id in "relations"
 * @param {number} relation_id The ID of the relation which you wish to search for
 * @returns {number} If found, the position of the relation in the "relations" array.
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
 * @param {Relation} relation The relation to be modified
 */
function set_incoming_and_outgoing(relation) {
    // add the "to" node of this relation to the set of outgoing nodes
    // relative to the "from" node of this relation
    relation.from.outgoing.push(relation.toArgument);
    // add the "to" node of this relation to the set of outgoing nodes
    // relative to the "from" node of this relation
    relation.toArgument.incoming.push(relation.from);
}

/**
 * Sets up incoming and outgoing arrays for the node, and adds it to the
 * global list of nodes
 * @param {Node} new_node The new node to be set up
 */
function add_node(new_node) {
    // initialize arrays of incoming and outgoing objects for
    // "set_incoming_and_outgoing" to take care of later
    new_node.incoming = [];
    new_node.outgoing = [];
    // add new node to array of nodes
    nodes.push(new_node);
}

/**
 * Given a relationship, for each node, either replaces it by the
 * existing one in the global list of nodes, or adds it to the global
 * set of nodes. Also modifies the incoming and outgoing arrays of the
 * nodes at both ends of the relation.
 *
 * This is for convenience, to prevent searching the entire set of nodes
 * every time.
 * @param {Relation} relation The new relation that is to be modified
 */
function set_relation_nodes(relation) {
    node_index = indexOfNode(relation.from);
    if (node_index === -1) { // if "from" doesn't yet exist,
        add_node(relation.from); // set it up
    } else { // otherwise, replace it with current node
        relation.from = nodes[node_index];
    }

    var node_index = indexOfNode(relation.toArgument);
    if (node_index === -1) { // if "to" doesn't yet exist,
        add_node(relation.toArgument); // set it up
    } else { // otherwise, replace it with current node
        relation.toArgument = nodes[node_index];
    }

    // Modify incoming and outgoing arrays of "from" and "to" nodes
    set_incoming_and_outgoing(relation);
}

/**
 * Gives the URL to the node with the specified ID
 * @param {number} node_id The ID of the node whose URL you want
 * @returns The URL to a page displaying that Argument
 */
function argument_address(node_id) {
    return "/arguments/" + node_id + "/";
}

/**
 * From the current address bar URL, figure out which Argument we're
 * supposed to be looking at
 * @returns The Argument ID of the argument that's currently in the address
 * bar
 */
function argument_id_of_address() {
    return parseInt(window.location.pathname.split("/")[2]);
}

/**
 * Asynchronously retrieve a node from the server and push it into the "nodes"
 * array. Do not call this function once a node has already been retrieved.
 * @param {number} node_id The ID of the node to retrieve
 * @param {Function} [callback] The callback function which, when specified, will
 * be called with the newly retrieved node as the sole argument
 * @todo Display error message onscreen when there's a failure
 */
function ajax_get_node(node_id, callback) {
    $.ajax({
        url: argument_address(node_id),
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json"
        }
    }).done(function (data) {
        add_node(data);
        
        // if callback is defined, call it with the new node
        if (typeof callback !== 'undefined') {
            callback(data);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        alert("Failed to get argument " + node_id + ": " + errorThrown);
    });
}

/**
 * Adds "new_relation" to the global list of relations, if it doesn't already
 * exist. If it's a new relation, either adds its nodes to the global list of
 * arguments/relations, or else replaces its nodes with those from the global
 * list.
 * @param {Relation} new_relation The newly-retrieved relation
 * @param {Node} existing_node The existing node which was used to retrieve
 * the new relation.
 */
function process_new_relation(new_relation) {
    // first check if this relation has already been retrieved
    //
    // unlike for nodes, we can't simply not retrieve relations that are
    // already retrieved. Since two different nodes would be attached to
    // the same relation, when we ask the server for all relations
    // associated with a node, it may return some of the same relations
    // that have already been retrieved for another node
    if (indexOfRelation(new_relation.id) === -1) {
        // set type to be string instead of int
        new_relation.type = TYPE_MEANINGS[new_relation.type];
        // remove redundancies associated with nodes at either end of the
        // relation
        set_relation_nodes(new_relation);
        // add this to the array of currently retrieved relations
        relations.push(new_relation);
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
        url: argument_address(node.id) + "relations/",
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json"
        }
    }).done(function (data) {
        for (var i = 0; i < data.length; i++) {
            process_new_relation(data[i]);
        }

        draw_graph();
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

/**
 * Is a node part of the outgoing nodes of the currently selected node?
 * @param {Node} node The node in question
 * @returns Whether or not this node should be displayed in the top row
 */
function is_outgoing(node) {
    return current_card.outgoing.indexOf(node) != -1;
}

/**
 * Is a node part of the incoming nodes of the currently selected node?
 * @param {Node} node The node in question
 * @returns Whether or not this node should be displayed in the bottom row
 */
function is_incoming(node) {
    return current_card.incoming.indexOf(node) != -1;
}

/**
 * Should a node be shown in the graph at all?
 * @param {Node} node The node in question
 * @returns Whether or not this node is the currently selected node, or one of
 * its outgoing nodes, or one of its incoming nodes
 */
function node_visible(node) {
    return (node == current_card) || is_outgoing(node) || is_incoming(node);
}

/**
 * Should a relation be shown in the graph at all?
 * @param {Relation} relation The relation in question
 * @returns Whether or not both ends of the relation are visible
 */
function relation_visible(relation) {
    return node_visible(relation.from) && node_visible(relation.toArgument);
}

/**
 * Determine the logical (not screen) position of a card in its row. Be sure to
 * call "reset_globals" before calling this function on all nodes.
 * @param {Node} node The node which the card in question represents
 */
function determine_i(node) {
    if (node == current_card) { // if it's the card in the middle of the screen
        node.i = 0; // it doesn't really matter what i is
    } else if (is_outgoing(node)) { // if it's in the top row
        node.i = next_outgoing_i;
        next_outgoing_i++;
    } else if (is_incoming(node)) { // if it's in the bottom row
        node.i = next_incoming_i;
        next_incoming_i++;
    }
}

/**
 * How many pixels wide would a row of "num_cards" cards be, assuming
 * "card_spacing" pixels before, in-between, and after all the cards?
 * @param {number} num_cards The number of cards in the hypothetical row of cards
 */
function row_width(num_cards) {
    // num_cards number of cards, and (num_cards + 1) number of spaces before,
    // in-between, and after cards
    return (num_cards * card_width) + ((num_cards + 1) * card_spacing);
}

/**
 * Find the x-coordinate of the screen position of a node
 * @param {Node} node The node whose screen position you wish to find
 * @returns The x-coordinate of that node
 */
function x_pos(node) {
    if (node == current_card) { // if current card, just center it
        return (window.innerWidth / 2) - half_card_width;
    } else if (is_outgoing(node)) { // if top row
        // since the i attributes of a node in a row start from 0, node.i
        // effectively denotes how many nodes were before this one
        // so simply add "top_row_offset" to how wide a row of all the nodes
        // before this one would be
        return top_row_offset + row_width(node.i);
    } else if (is_incoming(node)) { // if bottom row, same logic as for top row
        return bottom_row_offset + row_width(node.i);
    } else { // otherwise it's a hidden node, so move it offscreen
        // if it was previously a current node and no longer displayed
        // (impossible under the current scheme since each newly selected node
        // must have been related to the current node before being selected,
        // and therefore the current node would still be visible; however, this
        // may be useful in the future when we have equivlaent nodes, only one
        // of which is selected), then move it off to the right side of the screen
        if (node.previously_current) {
            return window.innerWidth + card_spacing;
        } else if (node.previously_outgoing || node.previously_incoming) {
            // otherwise it was previously a node on either the top or the
            // bottom of the screen. Either way, the x-coordinate will be the
            // middle of the screen, so that the node will be moved to either
            // the top-middle or bottom-middle of the screen
            return (window.innerWidth / 2) - half_card_width;
        }
    }
}

/**
 * Find the y-coordinate of the screen position of a node
 * @param {Node} node The node whose screen position you wish to find
 * @returns The y-coordinate of that node
 */
function y_pos(node) {
    if (node == current_card) { // if current card, just center it
        return (graph_height / 2) - half_card_height;
    } else if (is_outgoing(node)) { // if it's in the top row
        // position it slightly offset from the top of the graph
        return card_spacing;
    } else if (is_incoming(node)) { // if it's in the bottom row
        // position it slightly offset from the bottom of the graph
        return graph_height - card_spacing - card_height;
    } else { // otherwise it's a hidden node, so move it offscreen
        if (node.previously_current) { // if previously current
            // just center it. Again, not currently used, but may be useful in
            // the future
            return (graph_height / 2) - half_card_height;
        } else if (node.previously_outgoing) { // if previously in the top row
            return -card_spacing - card_height; // move it to the top center
        } else if (node.previously_incoming) { // else if previously in the bottom row
            return graph_height + card_spacing; // move it to the bottom center
        } else { // Inconceivable!
            console.warn("Anomalous node " + node.id + " encountered");
        }
    }
}

/**
 * Find the y-coordinate of a node's toolbar.
 * @param {Node} node The node in question
 * @returns The y-coordinate of the toolbar of that node
 */
 function y_pos_toolbar(node) {
    return y_pos(node) + (card_height - toolbar_height);
 }

/**
 * How far left (in pixels) can you move the top row?
 * @returns {number} The most negative value that top_row_offset can take on
 * @todo Account for scrollbars
 */
function min_top_row_offset() {
    // if window already contains entire row, then 0 because you don't need to
    // move any more to the left
    // otherwise, move only as much as needed to display the right side of the row
    return Math.min(0, window.innerWidth - row_width(next_outgoing_i));
}

/**
 * How far left (in pixels) can you move the bottom row?
 * @returns {number} The most negative value that bottom_row_offset can take on
 * @todo Account for scrollbars
 */
function min_bottom_row_offset() { // same logic as above
    return Math.min(0, window.innerWidth - row_width(next_incoming_i));
}

/**
 * How far right (in pixels) can you move the top row?
 * @returns {number} The most positive value that top_row_offset can take on
 */
function max_top_row_offset() {
    // if window contains entire row, then move as far as possible to the right
    //  without breaching it. otherwise, don't move right at all from the start position
    return Math.max(0, window.innerWidth - row_width(next_outgoing_i));
}

/**
 * How far right (in pixels) can you move the bottom row?
 * @returns {number} The most positive value that bottom_row_offset can take on
 */
function max_bottom_row_offset() { // same logic as above
    return Math.max(0, window.innerWidth - row_width(next_incoming_i));
}

/**
 * Ensure that top and bottom row offset limits are respected
 */
function enforce_row_offsets() {
    // check top row offset limits. If violated, fix immediately
    if (top_row_offset < min_top_row_offset()) {
        top_row_offset = min_top_row_offset();
        draw_graph(false, 0);
    } else if (top_row_offset > max_top_row_offset()) {
        top_row_offset = max_top_row_offset();
        draw_graph(false, 0);
    }
    // check bottom row offset limits. If violated, fix immediately
    if (bottom_row_offset < min_bottom_row_offset()) {
        bottom_row_offset = min_bottom_row_offset();
        draw_graph(false, 0);
    } else if (bottom_row_offset > max_bottom_row_offset()) {
        bottom_row_offset = max_bottom_row_offset();
        draw_graph(false, 0);
    }
}

/** Allow top and bottom rows to be dragged around whilst respecting offset limits */
var drag = d3.behavior.drag()
            .on("drag", function () {
                if (d3.event.y <= (card_height + 20)) { // check if dragging top row
                    // if so, add drag distance to top row offset
                    top_row_offset += d3.event.dx;
                    // and redraw immediately
                    draw_graph(false, 0);

                    // note: this code won't be called on a refresh. move to draw_graph?
                    enforce_row_offsets();
                } else if (d3.event.y >= (graph_height - card_height - 20)) { // check if dragging bottom row
                    // if so, add drag distance to bottom row offset
                    bottom_row_offset += d3.event.dx;
                    // and redraw immediately
                    draw_graph(false, 0);

                    // note: this code won't be called on a refresh. move to draw_graph?
                    enforce_row_offsets();
                }
            })

/**
 * Convert a screen position represented by a 2-element array to a string, for
 * use in an SVG attribute
 * @param {Array} pos The 2-element array consisting of x and y coordinates
 * @returns {string} A string for use in specifying coordinates in an SVG attribute
 */
function pos2str(pos) {
    return pos[0] + "," + pos[1] + " ";
}

/**
 * Return a string specifying the path of the Bezier curve that a link should
 * be displayed as
 * @param {Link} link The link which is to be displayed
 * @returns {string} A string for the "d" attribute of an SVG "path" object
 */
function compute_link_bezier_curve(link) {
    // for convenience, define these two variables for each end of the link
    var from = link.from;
    var to = link.toArgument;
    // calculate the start and end positions of the Bezier curve. It should
    // start at the top-middle of the "from" card and end at the bottom-middle
    // of the "to" card (under the current scheme, "to" cards are always above
    // "from" cards)
    var start_pos = [x_pos(from, from.i) + half_card_width, y_pos(from, from.i)];
    var end_pos = [x_pos(to, to.i) + half_card_width,
                    /* account for arrow: marker-width is 3, stroke-width is 5 */
                   y_pos(to, to.i) + card_height + (5 * 3)];
    // find the difference in height between the two cards
    var height = end_pos[1] - start_pos[1];
    // have the controls be half-height away from the start/end points
    var control1 = [start_pos[0], start_pos[1] + (height / 2)];
    var control2 = [end_pos[0], end_pos[1] - (height / 2)];
    // build the final string
    return "M" + pos2str(start_pos) + "C" + pos2str(control1)
            + pos2str(control2) + pos2str(end_pos);
}

/**
 * Reset "next_outgoing_i" and "next_incoming_i" global variables
 */
function reset_globals() {
    next_outgoing_i = 0;
    next_incoming_i = 0;
    // don't touch the offsets because "draw_graph" will handle that
}

/**
 * Calculate the desired offset in order to center a row of cards
 * @returns {number} The offset needed to either center a row of cards in the
 * middle of the screen, or to simply put the row of cards next to the left of
 * the screen if the screen cannot display the entire row at once
 */
function center_cards_offset(num_cards) {
    return Math.max(0, (window.innerWidth - row_width(num_cards)) / 2);
}

/**
 * Updates "top_row_offset" and "bottom_row_offset" to the necessary values in
 * order to (when possible) center the top and bottom rows
 */
function center_cards() {
    top_row_offset = center_cards_offset(next_outgoing_i);
    bottom_row_offset = center_cards_offset(next_incoming_i);
}

/**
 * Move the window to a newly selected card
 * @param {Node} The node that is to be the newly selected card
 */
function change_current_card(d) {
    // no need to reset the top and bottom row offsets to zero
    // because that's already done in "draw_graph"

    // set the current_card to the node of the card that was just clicked
    current_card = d;
    if (!d.gotten) // if its relevant information hasn't been obtained already
    {
        // get all the related links and nodes associated with the newly selected node
        ajax_get_card(d);
        d.gotten = true; // mark it as already having obtained relevant info
    }
    // redraw graph
    draw_graph();
}

/**
 * If no card with the specified ID exists, fetches it from the server. Gets either new
 * card or existing card with that ID and centers it in the graph.
 * @param {Number} ID The ID of the card to be centered on
 */
function change_current_card_id(id) {
    var node_index = indexOfNode({id: id});
    if (node_index === -1) {
        ajax_get_node(id, function (data) {
            change_current_card(data);
        });
    } else {
        change_current_card(nodes[node_index]);
    }
}

/**
 * Create card representations of all unrepresented nodes.
 */
function make_cards() {
    // bind node data to cards
    cards = d3.select("svg#graph").selectAll("svg").data(nodes);
    // add new card representations of nodes
    new_cards = cards.enter().append("svg").classed("argument", true).attr("cursor", "pointer");
    // create background rectangle for the cards
    new_cards.append("rect").attr("width", card_width).attr("height", card_height)
                .classed("card", true).style("opacity", 0).call(drag);
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

        if (current_card != d) { // if different card
            // change URL to reflect newly selected card
            window.history.pushState(null, "what is this", argument_address(d.id));
        }
        
        change_current_card(d); // always center graph on new card
    })
    // add toolbar
    new_cards.append("rect").attr("width", card_width).attr("height", toolbar_height)
        .classed("toolbar", true).attr("opacity", 0);
    // define action when card is hovered over
    new_cards.on("mouseenter", function (d) {
        d3.select(this).select("rect.toolbar").transition().attr("opacity", 1);
    });
    new_cards.on("mouseleave", function (d) {
        d3.select(this).select("rect.toolbar").transition().attr("opacity", 0);
    });
}

/**
 * When back button is clicked on the page, centers graph on previously selected card
 */
window.onpopstate = function(event) {
    change_current_card_id(argument_id_of_address());
}

// Functions to show/hide spinner
$(document).ajaxStart(function(){
    $("#spinner").show();
});

$(document).ajaxStop(function(){
    $("#spinner").hide();
});

/**
 * Create link representations of all unrepresented relations
 */
function make_links() {
    // bind relation data to links
    links = d3.select("svg#graph").selectAll("path").data(relations);
    // create the paths for every link, and start them off with full
    // transparency so that they can smoothly enter the graph
    links.enter().append("path")
        .attr("class", function(d) {
            return d.type;
        }).attr("marker-end", function(d) {
            return "url(#arrow-" + d.type + ")";
        }).style("opacity", 0);
}

/**
 * Redraw the entire graph
 * @param {boolean} [center=true] Whether or not the top and bottom rows should
 * be re-centered. Put false when you want to keep the current offsets.
 * @param {number} [transition=500] The time it takes for all the nodes and
 * links to transition to their final positions and opacities. Put 0 for an
 * instantaneous change.
 */
function draw_graph(center, transition_time) {
    // ensure default values for optional arguments
    center = typeof center === 'undefined' ? true : transition_time;
    transition_time = typeof transition_time === 'undefined' ? 500 : transition_time;

    // bring in the new cards and links
    make_cards();
    make_links();

    // recalculate logical positions for each card
    reset_globals();
    d3.selectAll("svg rect.card").each(determine_i);

    // if specified, re-center top and bottom rows of cards
    if (center) {
        center_cards();
    }

    // transition cards to their new positions within transition_time
    d3.selectAll("svg rect").transition().duration(transition_time)
        .attr("x", x_pos).attr("y", y_pos).style("opacity", 1);
    d3.selectAll("svg rect.toolbar").transition().duration(transition_time)
        .attr("x", x_pos).attr("y", y_pos_toolbar);
    // Can't select for foreignObject directly due to
    // http://stackoverflow.com/a/11743721/257583
    // also, doesn't matter if the text is opaque or not since it's the
    // same color as the background
    d3.selectAll(".foreign-object").transition().duration(transition_time)
        .attr("x", x_pos).attr("y", y_pos);

    // for the record, set whether the card is current/outgoing/incoming so
    // that the next time this is called, the x_pos and y_pos functions know
    // how to handle cards that are no longer shown
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

    // finally, transition the links to their final paths as well while
    // toggling the opacity for those links that are now invisible/visible
    links.transition().duration(transition_time).style("opacity", function (d) {
        // if one end of the link is currently displayed, then the other is too
        if (relation_visible(d)) {
            return 1;
        } else {
            return 0;
        }
    }).attr("d", compute_link_bezier_curve);
}

window.onload = function () {
    graph_height = $("#graph").height();

    // if graph height is not as small as the suggested minimum graph height,
    // then chances are there's something very wrong, so try not to alarm the user
    if (graph_height < min_graph_height) {
        console.warn("Graph height is only " + graph_height);
        alert("Whoops, looks like some things won't be displaying correctly. Please tell us about this.");
    }

    // if there's extra space, make sure graph fills entire browser window
    if (graph_height < window.innerHeight) {
        $("#graph").attr("height", window.innerHeight);
        graph_height = window.innerHeight;
    }

    // get our first card
    // it'll already be retrieved by window.onpopstate function, which is called even on initial page load
    // apparently there's a Chrome and Safari bug that prevents this from happening
    window.onpopstate()
}