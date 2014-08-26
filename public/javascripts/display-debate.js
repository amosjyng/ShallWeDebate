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
/** Height of the header at the top of the page */
var header_height = 51;
/** Height of toolbar on cards */
var toolbar_height = 30;
/** How much to vertically offset the link toolbar from the center of the screen */
var link_toolbar_offset = -30;
/** How wide the link toolbar should be (it is jarring to have it take up the same
    amount of space as a normal toolbar) */
var link_toolbar_width = card_width * 0.8;
/** How long should a 2nd-degree relation (a relation pointing to a relation) be
    when viewed horizontally? */
var second_degree_link_width = 0.9 * card_width;
/** How far from the left of a card's x-coordinate should a 2nd-degree link be? */
var second_degree_offset = (card_width - second_degree_link_width) / 8;

/** Index of the next current node (may be nonzero when it's a relation
    being displayed) */
var current_i = 0;
/** Index of the next outgoing node (relative to the current node) to be
    displayed (in the top row) */
var next_outgoing_i = 0;
/** Index of the next incoming node (relative to the current node) to be
    displayed (in the bottom row) */
var next_incoming_i = 0;
/**
 * The cards that are currently displayed only because they are part of relations
 * that are replied to by the current card. This hashmap holds the `i` positions
 * of such indirect cards that haven't been processed yet.
 */
var current_indirects = {};
/** Same as current_indirects, but for links */
var current_link_indirects = {};


/**
 * The currently-selected node whose card is displayed in the middle of the screen.
 * May be null if there is no currently selected card, but instead a selected
 * relation.
 * @todo Rename to current_node?
 */
var current_card = null;
/**
 * The currently selected relation which is displayed in the middle of the screen
 * along with both of its relations at either end. May be null if there is no
 * currently selected relation, but instead a selected node.
 */
var current_relation = null;
  

/** Width of final rendered graph. */
var graph_width = null;
/** Height of final rendered graph. @todo Make this height scalable */
var graph_height = null;
/** What the minimum height of the final graph should be for optimal display
    of the arguments (three rows of cards, plus enough space for links in between) */
var min_graph_height = (3 * card_height) + (4 * card_spacing) + 210;
/** What the minimum width of the final graph should be (enough at least to display a
    relation: three cards in a row, plus enough space between them) */
var min_graph_width = (3 * card_width) + (4 * card_spacing);

/** Determines how much the middle row is offset from the left side of the window.
    This is used for always centering the middle row */
var middle_row_offset = 0;
/** Determines how much the top row is offset from the left side of the window.
    Used for scrolling the top row */
var top_row_offset = 0;
/** Determines how much the bottom row is offset from the left side of the window.
    Used for scrolling the bottom row */
var bottom_row_offset = 0;

/** How thick the strokes used to draw paths are */
var stroke_width = 5;
/** How thick the arrow markers will be as a multiple of stroke_width */
var marker_width = 3;
/** How thick the arrow markers will be in pixels */
var marker_width_px = stroke_width * marker_width;

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
/** Hashmap for finding int representations of types */
TYPE_INTS = {"support": 0, "oppose": 1}

/** Whether or not the user is editing a new reply */
var reply_under_construction = false;


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
 * Finds the first relation which has the specified node as the from node
 * @param {number} from_id The ID of the node which is the from node of the relation to be
 * found
 * @returns {Relation} If there does exist such a Relation which has the from node with the
 * ID from_id, then returns the first such Relation. Otherwise, returns null.
 */
function relationWithFromId (from_id) {
    for (i = 0; i < relations.length; i++) {
        if (relations[i].from.id === from_id) {
            return relations[i];
        }
    }
    return null; // not found
}

/**
 * Adds incoming and outgoing nodes directly to the "to" and "from" nodes at
 * the opposite ends of a relation. This is for convenience.
 * @param {Relation} relation The relation to be modified
 */
function set_incoming_and_outgoing(relation) {
    // add the "to" node of this relation to the set of outgoing nodes
    // relative to the "from" node of this relation
    if (relation.toArgument === null) {
        relation.from.outgoing_relations.push(relation.toRelation);
        relation.from.indirect_from.push(relation.toRelation.from);
        if (relation.toRelation.toArgument !== null) {
            relation.from.indirect_to.push(relation.toRelation.toArgument);
        } else {
            relation.from.indirect_relations.push(relation.toRelation.toRelation);
        }
    } else {
        relation.from.outgoing.push(relation.toArgument);
    }
    
    if (relation.toArgument !== null) {
        // add the "to" node of this relation to the set of outgoing nodes
        // relative to the "from" node of this relation
        relation.toArgument.incoming.push(relation.from);
    } else if (relation.toRelation !== null) {
        relation.toRelation.incoming.push(relation.from);
    } else {
        console.error("Relation " + relation.id + " has null toArgument AND toRelation!");
    }
}

/**
 * Sets up incoming and outgoing arrays for the node, and adds it to the
 * global list of nodes
 * @param {Node} new_node The new node to be set up
 */
function add_node (new_node) {
    // initialize arrays of incoming and outgoing objects for
    // "set_incoming_and_outgoing" to take care of later
    new_node.incoming = [];
    new_node.outgoing = [];
    // keep track of relations this points to
    new_node.outgoing_relations = [];
    // if this node points to any relations, then put the nodes of those relations
    // here
    new_node.indirect_from = [];
    new_node.indirect_to = [];
    new_node.indirect_relations = [];
    // add new node to array of nodes
    nodes.push(new_node);
}

/**
 * Given a relationship, for each node, either replaces it by the
 * existing one in the global list of nodes, or adds it to the global
 * set of nodes. Also modifies the incoming and outgoing arrays of the
 * nodes at both ends of the relation.
 *
 * Does the same for any Relations found at the end of toRelation as well
 *
 * This is for convenience, to prevent searching the entire set of nodes
 * every time.
 * @param {Relation} relation The new relation that is to be modified
 */
function set_relation_nodes(relation) {
    var node_index = indexOfNode(relation.from);
    if (node_index === -1) { // if "from" doesn't yet exist,
        add_node(relation.from); // set it up
    } else { // otherwise, replace it with current node
        relation.from = nodes[node_index];
    }

    if (relation.toArgument !== null) {
        var node_index = indexOfNode(relation.toArgument);
        if (node_index === -1) { // if "to" doesn't yet exist,
            add_node(relation.toArgument); // set it up
        } else { // otherwise, replace it with current node
            relation.toArgument = nodes[node_index];
        }
    }
    
    if (relation.toRelation !== null) {
        var relation_index = indexOfRelation(relation.toRelation.id);
        if (relation_index === -1) { // if "to" doesn't yet exist,
            process_new_relation(relation.toRelation); // set it up
        } else { // otherwise, replace it with current node
            relation.toRelation = relations[relation_index];
        }
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
 * Gives the URL to the relation with the specified ID
 * @param {number} relation_id The ID of the relation whose URL you want
 * @returns The URL to a page displaying that Relation
 */
function relation_address(relation_id) {
    return "/relations/" + relation_id + "/";
}

/**
 * Finds out if the URL in the address bar is pointing to an argument
 * @returns Whether or not we should be looking at a node instead of a relation right now
 */
function argument_in_address () {
    return window.location.pathname.split("/")[1] === "arguments";
}

/**
 * From the current address bar URL, figure out which Argument/relation we're
 * supposed to be looking at
 * @returns The Argument/Relation ID of the argument that's currently in the address
 * bar
 */
function id_of_address () {
    return parseInt(window.location.pathname.split("/")[2]);
}

/**
 * Asynchronously retrieve a node from the server and push it into the "nodes"
 * array. Do not call this function once a node has already been retrieved.
 * @param {number} node_id The ID of the node to retrieve
 * @param {Function} [callback] The callback function which, when specified, will
 * be called with the newly retrieved node as the sole argument
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
        alert_user("Failed to get argument " + node_id, errorThrown);
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
        // set incoming to be empty at first
        new_relation.incoming = [];
        // remove redundancies associated with nodes at either end of the
        // relation
        set_relation_nodes(new_relation);
        // add this to the array of currently retrieved relations
        relations.push(new_relation);
    }
}

/**
 * Retrieve a relation from the server. This should only be called when initially
 * loading the page on a relation
 * @param {number} relation_id The ID of the relation to be retrieved
 * @param {function} callback What to do after retrieving the relation
 */
function ajax_get_relation(relation_id, callback) {
    $.ajax({
        url: relation_address(relation_id),
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json"
        }
    }).done(function (data) {
        process_new_relation(data);

        // if callback is defined, call it with the new node
        if (typeof callback !== 'undefined') {
            callback(data);
        }
    }).fail(function (jqXHR, textStatus, errorThrown) {
        alert_user("Failed to get relation " + relation_id, errorThrown);
    });
}

/**
 * Get all relations associated with a particular node, and all other nodes
 * associated with those relations as well
 * @param {Node} node The node to retrieve all the relations for
 */
function ajax_get_relations_of_node (node) {
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
        alert_user("Failed to get relations of node " + node.id, errorThrown);
    });
}

/**
 * Get all relations pointing to a particular relation, and all nodes
 * associated with those relations as well
 * @param {Relation} relation The relation to retrieve all related relations for
 */
function ajax_get_relations_of_relation (relation) {
    $.ajax({
        url: relation_address(relation.id) + "relations/",
        type: "GET",
        dataType: "json",
        headers: {
            Accept: "application/json"
        }
    }).done(function (data) {
        for (var i = 0; i < data.length; i++) {
            process_new_relation(data[i]);
        }

        draw_graph(); // redraw graph after getting new relations
    }).fail(function (jqXHR, textStatus, errorThrown) {
        alert_user("Failed to get relations of node " + node.id, errorThrown);
    });
}


/**
 * After a card is selected (i.e. clicked on), call this function to retrieve
 * all relevant information for the node that the card represents
 * @param {Node} node The node of the card that was clicked on
 */
function ajax_get_card (node) {
    ajax_get_relations_of_node(node); // get all relevant relations and related nodes
    draw_graph(); // re-center the graph immediately
}

/**
 * Is a node currently the selected node, or one of the nodes at either end of
 * the currently selected relation, or the currently selected relation itself?
 */
function is_current (node_or_relation) {
    if (current_relation == null) {
        return node_or_relation === current_card;
    } else {
        return node_or_relation === current_relation
            || node_or_relation === current_relation.from
            || node_or_relation === current_relation.toArgument;
    }
}

/**
 * Is a node part of the outgoing nodes because it's the from part of a debated
 * relation?
 *
 * @param {Node} node The node in question
 * @returns Whether or not this node is displayed because it is the "from" part of
 * a relation that the current node points to
 */
 function is_indirect_from (node) {
    if (current_relation === null) {
        return current_card.indirect_from.indexOf(node) != -1;
    } else {
        return false;
    }
 }

 /**
 * Is a node part of the outgoing nodes because it's the to part of a debated
 * relation?
 *
 * @param {Node} node The node in question
 * @returns Whether or not this node is displayed because it is the "to" part of
 * a relation that the current node points to
 */
 function is_indirect_to (node) {
    if (current_relation === null) {
        return current_card.indirect_to.indexOf(node) != -1;
    } else {
        return false;
    }
 }

/**
 * Is a node part of the outgoing nodes only because it's part of a relation
 * that's out-going?
 *
 * @param {Node} node The node in question
 * @returns Whether or not this node should be directly connected to the current
 * node
 */
function is_indirect (node) {
    return is_indirect_from(node) || is_indirect_to(node);
}

/**
 * Is a node part of the outgoing nodes of the currently selected node?
 *
 * A relation will never have outgoing nodes, only incoming nodes, so this
 * will always be false if there is a currently selected relation instead
 * of node
 * @param {Node} node The node in question
 * @returns Whether or not this node should be displayed in the top row
 */
function is_outgoing (node) {
    if (current_relation === null) {
        return current_card.outgoing.indexOf(node) != -1
            || is_indirect(node);
    } else {
        return false;
    }
}

/**
 * Is a node part of the incoming nodes of the currently selected
 * node/relation?
 * @param {Node} node The node in question
 * @returns Whether or not this node should be displayed in the bottom row
 */
function is_incoming (node) {
    if (current_relation === null) {
        return current_card.incoming.indexOf(node) != -1;
    } else {
        return current_relation.incoming.indexOf(node) != -1;
    }
}

/**
 * Should a node be shown in the graph at all?
 * @param {Node} node The node in question
 * @returns Whether or not this node is the currently selected node, or one of
 * its outgoing nodes, or one of its incoming nodes
 */
function node_visible (node) {
    return is_current(node) || is_outgoing(node) || is_incoming(node);
}

/**
 * Is a relation visible only because the current node is a reply to it?
 * @param {Relation} relation The relation in question
 * @returns Whether or not the current card (if it exists) has this as one of its
 * indirectly-related-to relations. Like so:
 *  Y -----> O
 *      ^
 *      |
 *      |
 *      X
 * Where the current card X points to a relation between Y and another relation, O.
 * In this case this function would return true for the relation O. Note that neither
 * the "from" nor "to" ends of the relation O are visible. So many nested levels of
 * relationships cannot be shown at one time.
 * 
 * On the other hand,
 *  Y -----> Z
 *      ^
 *      |
 *      |
 *      X
 * Should X merely point to a relation between Y and Z, then this function will return
 * false.
 *
 * Note that this function will also return true for simply
 * Y -----> O
 * in the middle row as well as the top row
 */
function relation_indirectly_visible (relation) {
    return (current_card !== null
        && current_card.indirect_relations.indexOf(relation) != -1)
        || (current_relation !== null
        && current_relation.toRelation === relation);
}

/**
 * Should a relation be shown in the graph at all?
 * @param {Relation} relation The relation in question
 * @returns Whether or not both ends of the relation are visible
 */
function relation_visible (relation) {
    if (node_visible(relation.from)) {
        return relation.toArgument === null ?
                relation_visible(relation.toRelation) :
                node_visible(relation.toArgument);
    } else {
        return relation_indirectly_visible(relation);
    }
}

/**
 * Given a node which is indirectly related to the current argument, find the
 * relation which is actually directly related to the current argument
 * @param {Node} node The indirectly related node in question
 * @returns {Relation} The relation responsible for node's visibility; if there
 * is no such relation, returns nothing
 */
function get_relation_of_indirect (node) {
    // look in the top row
    for (i = 0; i < current_card.outgoing_relations.length; i++) {
        // and see if there are any relations there
        var rel = current_card.outgoing_relations[i];
        if (node.id === rel.from.id ||
            (rel.toArgument !== null && node.id === rel.toArgument.id)) {
            return rel;
        }
    }
}

/**
 * Determine the logical (not screen) position of a card in its row. Be sure to
 * call "reset_globals" before calling this function on all nodes.
 * @param {Node} node The node which the card in question represents
 */
function determine_i (node) {
    if (current_indirects.hasOwnProperty(node.id)) {
        node.i = current_indirects[node.id];
    } else if (node === current_card) { // if it's the current node
        node.i = 0;
        current_i = 2;
    } else if (current_relation != null && node === current_relation.from) {
        node.i = 0;
        current_i = 4;
    } else if (current_relation != null && node === current_relation.toArgument) {
        node.i = 2;
        // no need to set current_i again
    } else if (is_outgoing(node)) { // if it's in the top row
        if (is_indirect(node)) {
            var rel = get_relation_of_indirect(node);
            if (rel.from === node) {
                // proceed as normal...
                node.i = next_outgoing_i;
                next_outgoing_i++;
                // but then save some space for the other end of the relation
                next_outgoing_i++;
                if (rel.toArgument === null) {
                    current_link_indirects[rel.toRelation.id] = next_outgoing_i;
                } else {
                    current_indirects[rel.toArgument.id] = next_outgoing_i;
                }
                next_outgoing_i++;
            } else if (rel.toArgument === node) {
                // save some space for the other end of the relation
                current_indirects[rel.from.id] = next_outgoing_i;
                next_outgoing_i++;
                next_outgoing_i++;
                // then proceed as normal
                node.i = next_outgoing_i;
                next_outgoing_i++;
            } else {
                console.error("Rel-rel indirectness not accounted for!");
            }
        } else { // directly associated, proceed as usual
            node.i = next_outgoing_i;
            next_outgoing_i++;
        }
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
    if (is_current(node)) { // if middle row
        return middle_row_offset + row_width(node.i);
    } else if (is_outgoing(node)) { // if top row
        // since the i attributes of a node in a row start from 0, node.i
        // effectively denotes how many nodes were before this one
        // so simply add "top_row_offset" to how wide a row of all the nodes
        // before this one would be
        return top_row_offset + row_width(node.i);
    } else if (is_incoming(node)) { // if breottom row, same logic as for top row
        return bottom_row_offset + row_width(node.i);
    } else { // otherwise it's a hidden node, so move it offscreen
        // either offscreen to the top middle or bottom middle, but still offscreen
        // either way
        return (window.innerWidth / 2) - half_card_width;
    }
}

/**
 * Find the y-coordinate of the screen position of a node
 * @param {Node} node The node whose screen position you wish to find
 * @returns The y-coordinate of that node
 */
function y_pos(node) {
    if (is_current(node)) { // if current card, just center it
        return (graph_height / 2) - half_card_height;
    } else if (is_outgoing(node)) { // if it's in the top row
        // position it slightly offset from the top of the graph
        return card_spacing;
    } else if (is_incoming(node)) { // if it's in the bottom row
        // position it slightly offset from the bottom of the graph
        return graph_height - card_spacing - card_height;
    } else { // otherwise it's a hidden node, so move it offscreen
        if (node.previously_outgoing) { // if previously in the top row
            return -card_spacing - card_height; // move it to the top center
        } else if (node.previously_incoming || node.previously_current) {
            // else if previously in the bottom row, or if previously current
            // but was pointing to a relation, whose nodes got clicked on
            return graph_height + card_spacing; // move it to the bottom center
        } else { // Inconceivable!
            console.warn("Anomalous node " + node.id + " encountered");
            // it's in the outgoing row because it's part of a relation pointed to
            // by a relation pointed to by a third relation
            node.previously_outgoing = true;
            return y_pos(node); // so do it again
        }
    }
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
 * Given two endpoints, find coordinates for a vertical bezier curve connecting them
 * @param {array} start_pos A two-element arrary specifying the starting x- and y-
 * position of the curve
 * @param {array} end_pos A two-element arrary specifying the ending x- and y-
 * position of the curve
 * @returns {Array} A four-element array of two-element arrays. Each two-element
 * array represents an x- and y-coordinate. The four-element array contains the
 * start, two control points, and end points of the curve.
 */
function compute_vertical_bezier_curve (start_pos, end_pos) {
    // find the difference in height between the two endpoints
    var height = end_pos[1] - start_pos[1];
    // have the controls be half-height away from the start/end points
    var control1 = [start_pos[0], start_pos[1] + (height / 2)];
    var control2 = [end_pos[0], end_pos[1] - (height / 2)];
    // return the controls
    return [start_pos, control1, control2, end_pos];
}

/**
 * Given two endpoints, the second of which is directly to the right of the first one,
 * find coordinates for a horizontal bezier curve connecting them
 * @param {array} start_pos A two-element arrary specifying the starting x- and y-
 * position of the curve
 * @param {array} end_pos A two-element arrary specifying the ending x- and y-
 * position of the curve
 * @returns {Array} A four-element array of two-element arrays. Each two-element
 * array represents an x- and y-coordinate. The four-element array contains the
 * start, two control points, and end points of the curve.
 */
function compute_horizontal_bezier_curve (start_pos, end_pos) {
    var length = end_pos[0] - start_pos[0];
    // I guess it doesn't matter where the control points are for a horizontal line
    var control1  = [start_pos[0] + length / 3, start_pos[1]];
    var control2  = [end_pos[0]   - length / 3, end_pos[1]];
    return [start_pos, control1, control2, end_pos];
}

/**
 * Get the location (in x- and y-coordinates) of the Bezier curve at a particular
 * point in time
 * @param {Array} p0 The first point of the Bezier curve
 * @param {Array} p1 The second point of the Bezier curve
 * @param {Array} p2 The third point of the Bezier curve
 * @param {Array} p3 The fourth point of the Bezier curve
 * @param {Number} t The portion of the Bezier curve under consideration
 * @returns {Array} The coordinates of the Bezier curve at the specified time
 */
function get_bezier_position (p0, p1, p2, p3, t) {
    // http://en.wikipedia.org/wiki/B%C3%A9zier_curve#Quadratic_B.C3.A9zier_curves
    return [(Math.pow(1 - t, 3) * p0[0]) + (3 * Math.pow(1 - t, 2) * t * p1[0])
            + (3 * (1 - t) * Math.pow(t, 2) * p2[0]) + (Math.pow(t, 3) * p3[0]),
            (Math.pow(1 - t, 3) * p0[1]) + (3 * Math.pow(1 - t, 2) * t * p1[1])
            + (3 * (1 - t) * Math.pow(t, 2) * p2[1]) + (Math.pow(t, 3) * p3[1])]
}

/**
 * Returns the start, end, and control points of a Bezier curve for a link
 * @param {Link} link The link for which the Bezier curve should be calculated
 * @returns {Array} A four-element array of two-element arrays. Each two-element
 * array represents an x- and y-coordinate. The four-element array contains the
 * start, two control points, and end points of the curve.
 */
function compute_link_bezier_curve (link) {
    // for convenience, define these two variables for each end of the link
    var from = link.from;
    // the variable `to` can be either a node or an argument, so don't use it
    // until we're sure what it is
    var to = link.toArgument === null ? link.toRelation : link.toArgument;
    if (current_link_indirects.hasOwnProperty(link.id)
        || (current_relation !== null && current_relation.toRelation === link)) {
        // if we're displaying a 2nd-degree relation (a relation that points to
        // another relation) horizontally without the nodes on either end (because
        // we're displaying this 2nd-degree relation as one end of a 3rd-degree
        // relation)
        var x_index, row_offset, y_coord;
        if (current_link_indirects.hasOwnProperty(link.id)) { // top row
            row_offset = top_row_offset;
            x_index = current_link_indirects[link.id];
            y_coord = card_spacing;
        } else { // middle row
            row_offset = middle_row_offset;
            x_index = 2
            y_coord = (graph_height / 2) - half_card_height;
        }
        var start_pos = [row_width(x_index) + row_offset + second_degree_offset,
                         y_coord + (half_card_height / 2)];
        var end_pos = [start_pos[0] + second_degree_link_width - marker_width_px,
                       start_pos[1]];
        return compute_horizontal_bezier_curve(start_pos, end_pos);
    } else if (is_current(link) || (relation_visible(link) && is_indirect(link.from))) {
        // if we're displaying a relationship horizontally
        // it should start at the right-middle of the from card and end at the
        // left-middle of the to card/relation
        var start_pos = [x_pos(from) + card_width,
                         y_pos(from) + half_card_height];
        var end_pos   = [start_pos[0] + card_width + (2 * card_spacing) - marker_width_px,
                         start_pos[1]];
        return compute_horizontal_bezier_curve(start_pos, end_pos);
    } else if (link.toRelation !== null) {
        // if we're vertically displaying a relationship between a node and another
        // relationship
        var start_pos = [x_pos(from) + half_card_width, y_pos(from)];
        var rel_link_curve = compute_link_bezier_curve(link.toRelation);
        var end_pos = get_bezier_position(rel_link_curve[0], rel_link_curve[1],
                                          rel_link_curve[2], rel_link_curve[3], 0.525);
        end_pos[1] += marker_width_px + (stroke_width / 2);
        return compute_vertical_bezier_curve(start_pos, end_pos);
    } else { // if we're displaying a relationship between two nodes vertically as usual
        // calculate the start and end positions of the Bezier curve. It should
        // start at the top-middle of the "from" card and end at the bottom-middle
        // of the "to" card (under the current scheme, "to" cards are always above
        // "from" cards)
        var start_pos = [x_pos(from) + half_card_width, y_pos(from)];
        var end_pos = [x_pos(to) + half_card_width,
                       /* account for arrow: marker-width is 3, stroke-width is 5,
                          so marker will be marker-width * stroke-width wide and tall */
                       y_pos(to) + card_height + marker_width_px];
        return compute_vertical_bezier_curve(start_pos, end_pos);
    }
}

/**
 * Return a string specifying the path of the Bezier curve that a link should
 * be displayed as
 * @param {Link} link The link which is to be displayed
 * @returns {string} A string for the "d" attribute of an SVG "path" object
 */
function bezier_string (link) {
    var b = compute_link_bezier_curve(link);
    return "M" + pos2str(b[0]) + "C" + pos2str(b[1]) + pos2str(b[2]) + pos2str(b[3]);
}

/**
 * Reset global index variables
 */
function reset_globals() {
    current_i = 0;
    next_outgoing_i = 0;
    next_incoming_i = 0;
    current_indirects = {};
    current_link_indirects = {};
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
 * Updates global offsets to the necessary values in
 * order to (when possible) center the top, middle, and bottom rows
 *
 * Cards in the center row should always be centered. If you can't even afford
 * to display two cards horizontally... you need a bigger screen.
 */
function center_cards() {
    // -1 because current_i is always incremented by 2
    middle_row_offset = center_cards_offset(current_i - 1);
    top_row_offset = center_cards_offset(next_outgoing_i);
    bottom_row_offset = center_cards_offset(next_incoming_i);
}

/**
 * Move the window to a newly selected card
 * @param {Node} d The node that is to be the newly selected card
 */
function change_current_card(d) {
    // no need to reset the top and bottom row offsets to zero
    // because that's already done in "draw_graph"

    current_relation = null;

    if (current_card != d) { // if different card
        // change URL to reflect newly selected card
        History.pushState(null, null, argument_address(d.id));
    }

    // set the current_card to the node of the card that was just clicked
    current_card = d;
    if (!d.gotten) { // if its relevant information hasn't been obtained already
        // get all the related links and nodes associated with the newly selected node
        ajax_get_card(d);
        d.gotten = true; // mark it as already having obtained relevant info
    }
    // redraw graph
    draw_graph();
}

/**
 * Move the window to a newly selected relation
 * @param {Relation} r The relation that is to become the newly selected relation
 */
function change_current_relation (r) {
    if (current_relation != r) { // if different link
        // change URL to reflect newly selected link
        History.pushState(null, null, relation_address(r.id));
    }

    current_card = null;

    // set the current relation to whichever link was just clicked
    current_relation = r;
    if (!r.gotten && r.isDebated) {
        ajax_get_relations_of_relation(r);
        r.gotten = true;
    }
    // redraw graph
    draw_graph();
}

/**
 * If no card with the specified ID exists, fetches it from the server. Gets either new
 * card or existing card with that ID and centers it in the graph.
 * @param {Number} ID The ID of the card to be centered on
 */
function change_current_card_id (id) {
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
 * If no link with the specified ID exists, fetches it from the server. Gets either new
 * link or existing link with that ID and centers it in the graph.
 * @param {Number} ID The ID of the link to be centered on
 */
function change_current_relation_id (id) {
    // todo: why does indexOfRelation use id directly?
    var relation_index = indexOfRelation(id);
    if (relation_index === -1) {
        ajax_get_relation(id, function (data) {
            change_current_relation(data);
        });
    } else {
        change_current_relation(relations[relation_index]);
    }
}

/**
 * Goes to the node or argument to be displayed based on the URL in the address bar
 */
function gotoAddress () {
    if (argument_in_address()) {
        change_current_card_id(id_of_address());
    } else { // relation is in address
        change_current_relation_id(id_of_address());
    }
}

/**
 * Add SHARE and REPLY buttons, without any functionality, to a toolbar.
 * @param {D3 selection} toolbars The toolbars to add buttons to
 * @param {number} toolbar_width The width of the toolbar to be created
 */
function add_toolbar_buttons (toolbars, toolbar_width) {
    var share_button = toolbars.append("svg").classed("share-button", true);
    share_button.append("rect").attr("width", toolbar_width / 2 - 1)
        .attr("height", toolbar_height);
    share_button.append("text").attr("x", toolbar_width / 2 / 2)
        .attr("y", toolbar_height - 8).text("SHARE");
    var reply_button = toolbars.append("svg").classed("reply-button", true);
    reply_button.append("rect").attr("width", toolbar_width / 2)
        .attr("height", toolbar_height).attr("x", toolbar_width / 2);
    reply_button.append("text").attr("x", 1.5 * toolbar_width / 2)
        .attr("y", toolbar_height - 8).text("REPLY");
}

/**
 * Given a relative address to the current argument or relation being shown, pops up
 * a modal dialog for the user to copy the full address to said argument or relation
 */
function showShareAddress (address) {
    $("#argument-address-modal input").attr("value", window.location.origin + address);
    $("#argument-address-modal").modal();
    // somehow select doesn't work when modal dialog is still appearing,
    // so select the input 500 milliseconds after it appears
    setTimeout(function () {
        $("#argument-address-modal input").select();
    }, 500);
}

function create_reply_node (d, toArgument) {
    if (reply_under_construction) {
        alert_user("Can't do that", "You're already editing a reply.");
        change_current_card_id(-1);
    }
    else {
        var new_node = {
            id: -1,
            gotten: true,
            under_construction: true,
            as_reply_to: d,
            as_reply_to_argument: toArgument
        };
        add_node(new_node);
        process_new_relation({
            id: -1,
            from: new_node,
            toArgument: toArgument  ? d : null,
            toRelation: !toArgument ? d : null,
            type: 1, // oppose
            under_construction: true
        });
        reply_under_construction = true;
        window.onbeforeunload = warn_argument_under_construction;
        
        // make d debated now rather than later
        d.isDebated = true;
        // make it as if you first went to the d node/relation, and then went to its reply
        if (toArgument) {
            current_card = d;
            current_relation = null;
        } else {
            current_card = null;
            current_relation = d;
        }
        set_cards_previous_locations();
        // set focus on the textarea in the middle of the page
        change_current_card(new_node);
        $("textarea.under_construction").focus();
    }
}

/**
 * Add the SHARE and REPLY buttons to the toolbars of already constructed cards.
 * @param {D3 selection} constructed_cards_toolbar The selection of toolbars to add such buttons to
 */
function add_construction_toolbar_buttons (constructed_cards_toolbar) {
    add_toolbar_buttons(constructed_cards_toolbar, card_width);
    constructed_cards_toolbar.select(".share-button").on("click", function (d) {
        showShareAddress(argument_address(d.id));
    });
    constructed_cards_toolbar.select(".reply-button").on("click", function (d) {
        d3.event.stopPropagation();

        create_reply_node(d, true);
    });
}

/**
 * Simply tells you whether something is under construction or not
 * @param {Node | Relation} d The piece of information in question
 * @returns True or false depending on whether the user is currently editing something
 */
function is_under_construction (d) {
    return d.under_construction;
}

/**
 * Simply tells you whether something is under construction or not
 * @param {Node | Relation} d The piece of information in question
 * @returns True or false depending on whether the user is currently editing something
 */
function isnt_under_construction (d) {
    return !d.under_construction;
}

/**
 * Create card representations of all unrepresented nodes.
 */
function make_cards() {
    // bind node data to cards
    cards = d3.select("svg#cards").selectAll("svg.argument").data(nodes);
    // add new card representations of nodes
    new_cards = cards.enter().append("svg").classed("argument", true)
        .attr("cursor", "pointer").attr("opacity", 0).call(drag)
        .classed("under_construction", is_under_construction);
    // create background rectangle for the cards
    new_cards.append("rect").attr("width", card_width).attr("height", card_height)
                .classed("card", true);
    // create foreignObject containing node text
    var switch_objects = new_cards.append("switch");
    var divs = switch_objects.append("foreignObject").classed("foreign-object", true)
        .attr("requiredFeatures", "http://www.w3.org/TR/SVG11/feature#Extensibility")
        .attr("width", card_width).attr("height", card_height)
        .append("xhtml:div").classed("summary", true);
    divs.filter(is_under_construction)
        .append("textarea")
        .attr("maxlength", "140")
        .attr("placeholder", "Write a concise and logical reply here. Click on the link to change its type.")
        .classed("under_construction", true);
    divs.filter(isnt_under_construction)
        .append("p")
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
        
        change_current_card(d); // always center graph on new card
    })
    // add toolbar
    var toolbar = new_cards.append("svg").classed("toolbar", true)
        .attr("width", card_width).attr("height", toolbar_height)
        .attr("y", card_height - toolbar_height).attr("opacity", 0);
    // define action when card is hovered over
    new_cards.on("mouseenter", function (d) {
        d3.select(this).select("svg.toolbar").transition().attr("opacity", 1);
    });
    new_cards.on("mouseleave", function (d) {
        d3.select(this).select("svg.toolbar").transition().attr("opacity", 0);
    });
    // add buttons for finished cards to toolbar
    var constructed_cards_toolbar = toolbar.filter(isnt_under_construction);
    add_construction_toolbar_buttons(constructed_cards_toolbar);
    // add buttons for the card that is under construction
    var under_construction_toolbar = toolbar.filter(is_under_construction);
    var save_button = under_construction_toolbar.append("svg");
    save_button.append("rect").attr("width", card_width).attr("height", toolbar_height);
    save_button.append("text").attr("x", card_width / 2).attr("y", toolbar_height - 8)
        .text("SAVE");
    save_button.on("click", function (d) {
        // change the summary now, in case user continues to edit the textarea after saving
        d.summary = $("textarea.under_construction")[0].value;
        $.ajax({
            url: d.as_reply_to_argument ?
                    argument_address(d.as_reply_to.id)
                    : relation_address(d.as_reply_to.id),
            type: "POST",
            data: JSON.stringify({
                summary: $("textarea.under_construction")[0].value,
                type: TYPE_INTS[relationWithFromId(d.id).type] // d.id should always be -1
            }),
            dataType: "json",
            headers: {
                "Content-Type": "application/json"
            }
        }).done(function (new_info) {
            // remove the "under_construction" of cards and links
            d3.select("svg.under_construction").each(function (d) {
                d.id = new_info.new_node_id;
                d.under_construction = false;
            });
            d3.select("path.under_construction").each(function (d) {
                d.id = new_info.new_relation_id;
                d.under_construction = false;
            })
            // remove the textarea for editing...
            d3.select("textarea.under_construction").remove();
            // and replace it with the actual paragraph
            d3.select("svg.under_construction div.summary")
                .append("p")
                .classed("summary", true).text(function (d) {
                    return d.summary;
                }).attr("xmlns", "http://www.w3.org/1999/xhtml");
            // remove the save button now that it's already saved
            d3.selectAll("svg.under_construction svg.toolbar svg").remove();
            // add share and reply buttons to the card, just like any other card
            add_construction_toolbar_buttons(d3.select("svg.under_construction svg.toolbar"));
            // make the SVG no longer representative of a node that's being edited
            d3.select("svg.under_construction").classed("under_construction", false);
            // make the link normal again
            d3.select("path.under_construction")
                .classed("under_construction", false)
                .attr("marker-end", get_link_marker);
            // change URL to be the ID of the newly created node
            History.pushState(null, null, argument_address(new_info.new_node_id));
            reply_under_construction = false; // allow new replies to be made
            window.onbeforeunload = null; // allow user to leave now that reply has been saved

            draw_graph();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert_user("Failed to create new argument", errorThrown);
        });
    });
}

/**
 * When back button is clicked on the page, centers graph on previously selected card
 */
History.Adapter.bind(window,'statechange', function(event) {
    if (History.getState() != null) {
        gotoAddress();
    }
})

// Functions to show/hide spinner
$(document).ajaxStart(function(){
    $("#spinner").show();
});

$(document).ajaxStop(function(){
    $("#spinner").hide();
});

/**
 * Returns the type of relation this is
 * @param {Relation} The relation data associated with the link in question
 */
function get_relation_type (d) {
    return d.type;
}

/**
 * Returns the URL to the marker for this particular link
 * @param {Relation} The relation data associated with the link in question
 */
function get_link_marker (d) {
    if (d.under_construction) {
        return "url(#arrow-" + d.type + "-under-construction)";
    }
    else {
        return "url(#arrow-" + d.type + ")";
    }
}

/**
 * Create link representations of all unrepresented relations
 */
function make_links() {
    // bind relation data to links
    links = d3.select("svg#links").selectAll("svg.link").data(relations);
    // create the paths for every link, and start them off with full
    // transparency so that they can smoothly enter the graph
    var link_svgs = links.enter().append("svg").classed("link", true).style("opacity", 0);
    link_svgs.append("path")
        .attr("class", get_relation_type)
        .classed("visible", true)
        .classed("under_construction", function (d) {
            return d.under_construction;
        }).attr("marker-end", get_link_marker)
        .attr("stroke-dasharray", function (d) {
            if (d.isDebated) {
                return "10,10";
            }
        });
    link_svgs.append("path")
        .attr("cursor", "pointer")
        .classed("clickable", true)
        .on("click", function (d) {
            if (d.under_construction) {
                if (d.type == "support") {
                    d.type = "oppose";
                } else if (d.type == "oppose") {
                    d.type = "support";
                } else {
                    console.error("Unknown relation type " + d.type);
                }

                d3.select($(this).siblings("path.visible")[0])
                    .attr("class", get_relation_type)
                    // it's necessary to add these classes that are added
                    // to every visible path
                    .classed("visible", true)
                    .classed("under_construction", true)
                    .attr("marker-end", get_link_marker);
            } else {
                change_current_relation(d);
            }
        });
}

/**
 * For the record, set whether the card is current/outgoing/incoming so
 * that the next time draw_graph is called, the x_pos and y_pos functions
 * know how to handle cards that are no longer shown.
 *
 * Call this before changing the current card.
 */
function set_cards_previous_locations() {
    cards.each(function (d) {
        if (is_current(d)) {
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
        } else if (!(d.previously_current
                  || d.previously_outgoing
                  || d.previously_incoming)) {
            // should definitely be previously one of the above three if it isn't
            // currently one of them
            console.error("Argument " + d.id + " isn't previously nor currently anything!");
        }
    });
}

/**
 * Redraw the entire graph. Even if the current card/relation isn't changed,
 * this will recenter the graph.
 * @param {boolean} [center=true] Whether or not the top and bottom rows should
 * be re-centered. Put false when you want to keep the current offsets.
 * @param {number} [transition=500] The time it takes for all the nodes and
 * links to transition to their final positions and opacities. Put 0 for an
 * instantaneous change.
 */
function draw_graph(center, transition_time) {
    // ensure default values for optional arguments
    center = typeof center === 'undefined' ? true : center;
    transition_time = typeof transition_time === 'undefined' ? 500 : transition_time;

    // bring in the new cards and links
    make_cards();
    make_links();

    // recalculate logical positions for each card
    // be sure to do this before displaying cards, because current_link_indirects
    // needs to be set
    reset_globals();
    d3.selectAll("svg.argument").each(determine_i);

    // if specified, re-center top and bottom rows of cards
    if (center) {
        center_cards();
    }

    // transition cards to their new positions within transition_time
    d3.selectAll("svg.argument").transition().duration(transition_time)
        .attr("x", x_pos).attr("y", y_pos).style("opacity", 1);

    // set whether the cards were previously in the top, middle, or bottom rows
    set_cards_previous_locations();

    // finally, transition the links to their final paths as well while
    // toggling the opacity for those links that are now invisible/visible
    links.transition().duration(transition_time)
        .style("opacity", function (d) {
            // if one end of the link is currently displayed, then the other is too
            if (relation_visible(d)) {
                return 1;
            } else {
                return 0;
            }
        }).attr("pointer-events", function (d) {
            if (relation_visible(d)) {
                return "painted";
            } else { // if hidden relation, then don't activate when clicked
                return "none";
            }
        });
    d3.selectAll("path.visible").attr("stroke-dasharray", function (d) {
            if (d.isDebated) {
                return "10,10";
            }
        });
    d3.selectAll("path").transition().duration(transition_time).attr("d", bezier_string);
    if (current_relation === null) {
        d3.select("#link-toolbar").transition().duration(transition_time)
            .style("opacity", 0);
    } else { // viewing a relation right now
        d3.select("#link-toolbar").transition().duration(transition_time)
            .style("opacity", 1);
    }
}

/** Make sure that user doesn't accidentally navigate away while editing an
 * argument
 */
function warn_argument_under_construction (e) {
    // http://stackoverflow.com/a/1119324/257583
    return "You are about to cancel your reply.";
}

window.onload = function () {
    graph_height = $("#graph").height();
    graph_width = $("#graph").width();

    // if graph height is not as small as the suggested minimum graph height,
    // then chances are there's something very wrong, so try not to alarm the user
    if (graph_height < min_graph_height) {
        console.warn("Graph height is only " + graph_height);
        alert("Whoops, looks like some things won't be displaying correctly. Please tell us about this.");
    }
    // same with graph width
    if (graph_width < min_graph_width) {
        console.warn("Graph width is only " + graph_width);
        alert("Whoops, looks like some things won't be displaying correctly. Please tell us about this.");
    }

    // if there's extra space, make sure graph fills entire browser window
    if (graph_height < window.innerHeight - header_height) {
        graph_height = window.innerHeight - header_height;
        $("#graph").attr("height", graph_height);
    }
    // ensure same for graph
    if (graph_width < window.innerWidth) {
        graph_width = window.innerWidth;
        $("#graph").attr("width", graph_width);
    }

    // add a toolbar for sharing and replying to relations
    $("#link-toolbar").attr("width", card_width).attr("height", toolbar_height)
        .attr("x", (graph_width / 2) - (link_toolbar_width / 2))
        .attr("y", (graph_height / 2) - toolbar_height + link_toolbar_offset)
        .attr("opacity", 0).attr("cursor", "pointer");
    add_toolbar_buttons(d3.select("#link-toolbar"), link_toolbar_width);
    d3.select("#link-toolbar .share-button").on("click", function () {
        showShareAddress(relation_address(current_relation.id));
    });
    d3.select("#link-toolbar .reply-button").on("click", function () {
        d3.event.stopPropagation();

        create_reply_node(current_relation, false);
    });

    // get our first card (or our first relation)

    gotoAddress();
}