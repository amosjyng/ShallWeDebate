package controllers;

import com.fasterxml.jackson.databind.node.ObjectNode;
import models.Relation;
import play.*;
import play.libs.Json;
import play.mvc.*;
import models.Argument;

import views.html.*;

public class Debate extends Controller
{
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

    public static Result viewArgumentRelations(Long id)
    {
        return ok(Json.toJson(Relation.getRelationsOfArgumentWithId(id)));
    }

    public static Result newArgument()
    {
        return TODO;
    }
}
