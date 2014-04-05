package controllers;

import com.fasterxml.jackson.databind.node.ObjectNode;
import models.Relation;
import play.*;
import play.libs.Json;
import play.mvc.*;
import models.Argument;

import views.html.*;

/**
 * Controller for all views related to debates on the website
 */
public class Debate extends Controller
{
    /**
     * View either an HTML or JSON representation of a particular Argument
     * @param id The ID of the Argument to be viewed
     * @return If plain HTML is accepted, then a generic HTML debate page will be loaded. The Javascript loaded by that
     * page will request this again, but only accepting JSON, whereupon the JSON version of the Argument is returned and
     * displayed to the user in a graphical manner.
     */
    public static Result viewArgument(Long id)
    {
        if (request().accepts("text/html"))
        {
            return ok(views.html.debate.viewArgument.render());
        }
        else
        {
            return ok(Json.toJson(Argument.get(id)));
        }
    }

    /**
     * Returns a JSON array of all Relations that either have an Argument in the "from" or the "to" parts
     * @param id The ID of the Argument for which you want to view all Relations of
     * @return JSON array of all Relations that directly involve the specified Argument in some way
     */
    public static Result viewArgumentRelations(Long id)
    {
        return ok(Json.toJson(Relation.getRelationsOfArgumentWithId(id)));
    }

    /**
     * This is supposed to return OK or something similar upon the successful creation of a new Argument.
     * @return The result of the attempt to add a new Argument into the database
     */
    public static Result newArgument()
    {
        return TODO;
    }
}
