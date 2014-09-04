package controllers;

import models.Subscriber;

import play.*;
import play.mvc.*;
import play.libs.Json;
import play.data.Form;
import play.Logger;

import views.html.*;

public class Application extends Controller
{
	/**
	 * Render the homepage
	 * @return HTML of the homepage
	 */
	public static Result index()
	{
		return ok(views.html.index.render(null));
	}

	/**
	 * Render the Terms of Service page
	 * @return HTML displaying the TOS
	 */
	public static Result tos()
	{
		return ok(views.html.legal.tos.render());
	}

	/**
	 * Tries to add a subscriber to the database, and returns an HTML page
	 * displaying the result
	 * @return The frontpage with a success or failure notification
	 */
	public static Result addSubscriber()
	{
		Form<Subscriber> subscriberForm = Form.form(Subscriber.class).bindFromRequest();
		if ((subscriberForm.hasErrors() || subscriberForm.hasGlobalErrors()))
		{
			return badRequest(views.html.index.render(subscriberForm));
		}
		else
		{
			Subscriber subscriber = subscriberForm.get();
			subscriber.save();
			return ok(views.html.index.render(subscriberForm));
		}
	}
}