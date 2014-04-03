package controllers;

import play.*;
import play.mvc.*;

import views.html.*;

public class Argument extends Controller
{
    public static Result viewTask(Long id)
    {
        return ok(views.html.arguments.view.render());
    }
}
