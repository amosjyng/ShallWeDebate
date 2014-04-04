package controllers;

import com.fasterxml.jackson.databind.node.ObjectNode;
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
            return ok(views.html.arguments.view.render());
        }
        else
        {
            Argument argument = Argument.get(id);

            return ok(Json.toJson(argument));
        }
    }

    public static Result newArgument()
    {
        return TODO;
    }
}
