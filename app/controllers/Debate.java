package controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import models.Relation;
import play.libs.Json;
import play.mvc.*;
import play.mvc.Http.Session;

import models.Argument;
import models.client.*;

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
            return ok(views.html.debate.viewDebate.render());
        }
        else
        {
            return ok(Json.toJson(new PublicArgument(Argument.get(id))));
        }
    }

    /**
     * View either an HTML or JSON representation of a particular Relation
     * @param id The ID of the Relation to be viewed
     * @return If plain HTML is accepted, then the generic HTML debate page will be loaded. The Javascript
     * on that page will request this again, but only accepting JSON, whereupon the JSON version of the
     * Relation is returned and displayed to the user in a graphical manner
     */
    public static Result viewRelation(Long id)
    {
        if (request().accepts("text/html"))
        {
            return ok(views.html.debate.viewDebate.render());
        }
        else
        {
            return ok(Json.toJson(new PublicRelation(Relation.get(id))));
        }
    }

    /**
     * Returns a JSON array of all Relations that either have an Argument in the "from" or the "to" parts
     * @param id The ID of the Argument for which you want to view all Relations of
     * @return JSON array of all Relations that directly involve the specified Argument in some way
     */
    public static Result viewArgumentRelations(Long id)
    {
        return ok(Json.toJson(Relation.getPublicRelations(Relation.getRelationsOfArgumentWithId(id))));
    }

    /**
     * Returns a JSON array of all Relations that have a particular Relation as the "to" part
     * @param id The ID of the Relation for which you want to view all Relations of
     * @return JSON array of all Relations that directly involve the specified Relation
     */
    public static Result viewRelationRelations(Long id)
    {
        return ok(Json.toJson(Relation.getPublicRelations(Relation.getRelationsOfRelationWithId(id))));
    }

    /**
     * This is supposed to return the ID of a successfully created new Argument, that
     * is in reply to an existing Argument.
     * @return The ID of the new Argument, if it succeeded in being created
     */
    @BodyParser.Of(BodyParser.Json.class)
    public static Result replyToArgument(Long id)
    {
        JsonNode json = request().body().asJson();
        if (json == null)
        {
            return badRequest("No JSON found.");
        }
        String summary = json.findPath("summary").textValue();
        Integer type = json.findPath("type").intValue();
        if (summary == null)
        {
            return badRequest("Missing parameter [summary]");
        }
        else if (summary.isEmpty())
        {
            return badRequest("Empty summary.");
        }
        // todo: check for existence of type variable
        else
        {
            Argument reply = new Argument(Application.getLocalUser(session()), summary);

            ObjectNode response = Json.newObject();
            Relation newRelation = Argument.get(id).replyWith(reply, type);
            response.put("new_node_id", newRelation.from.id);
            response.put("new_relation_id", newRelation.id);
            return ok(response);
        }
    }

    /**
     * This is supposed to return the ID of a successfully created new Argument, that
     * is in reply to an existing Relation.
     * @return The ID of the new Argument, if it succeeded in being created
     */
    @BodyParser.Of(BodyParser.Json.class)
    public static Result replyToRelation(Long id)
    {
        JsonNode json = request().body().asJson();
        if (json == null)
        {
            return badRequest("No JSON found.");
        }
        String summary = json.findPath("summary").textValue();
        Integer type = json.findPath("type").intValue();
        if (summary == null)
        {
            return badRequest("Missing parameter [summary]");
        }
        else if (summary.isEmpty())
        {
            return badRequest("Empty summary.");
        }
        // todo: check for existence of type variable
        else
        {
            Argument reply = new Argument(Application.getLocalUser(session()), summary);

            ObjectNode response = Json.newObject();
            Relation newRelation = Relation.get(id).replyWith(reply, type);
            response.put("new_node_id", newRelation.from.id);
            response.put("new_relation_id", newRelation.id);
            return ok(response);
        }
    }
}
