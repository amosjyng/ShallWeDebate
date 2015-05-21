package controllers

import models._
import views.html._

import play.api.mvc._
import play.mvc.Http.Session

import com.feth.play.module.pa.PlayAuthenticate
import com.feth.play.module.pa.user.AuthUser


object Application extends Controller {
  /**
   * Used for somehow restricting pages to logged-in users
   */
  val USER_ROLE = "user";

  /**
   * Retrieve the currently signed-in User from db
   */
  def getLocalUser(session: Session) = {
    User.findByAuthUserIdentity(PlayAuthenticate.getUser(session))
  }

  /**
   * Render the homepage
   */
  def index = Action {
    Ok(views.html.index.render)
  }

  /**
   * Render the Terms of Service page
   */
  def tos = Action {
    Ok(views.html.legal.tos.render)
  }

  /**
   * Render the Privacy Policy page
   */
  def privacy = Action {
    Ok(views.html.legal.privacy.render)
  }
}
