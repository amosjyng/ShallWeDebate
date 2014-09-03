package models;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.annotation.*;
import play.Logger;
import play.db.ebean.*;
import play.data.validation.ValidationError;

import javax.persistence.*;
import java.sql.Timestamp;
import java.util.regex.*;
import java.util.ArrayList;
import java.util.List;

/**
 * A subscriber to feature updates from the website
 */
@Entity
public class Subscriber extends Model
{
	/**
	 * Identify every subscriber by their unique email address
	 */
	@Id
	public String email;

	/**
	 * Time at which this Subscriber subscribed
	 */
	@CreatedTimestamp
	Timestamp createdAt;

	/**
	 * Constructor for this class
	 */
	public Subscriber(String email)
	{
		super();
		this.email = email;
	}

	/**
     * Something you use to write your queries for you.
     */
    @SuppressWarnings("unchecked")
    public static Finder<String, Subscriber> find = new Finder(String.class, Subscriber.class);

    /**
     * Check if a Subscriber with a certain email exists
     * @param email The email to look up
     * @return True if a Subscriber already exists with this email; false otherwise
     */
    public static boolean exists(String email)
    {
    	return find.where().eq("email", email).findRowCount() > 0;
    }

	/**
     * Get a reference to a Subscriber.
     * @param email The email of the Subscriber to be fetched
     * @return A reference to the Subscriber with that email
     */
    public static Subscriber get(String email)
    {
        return find.ref(email);
    }

	/**
	 * Check if there are any errors. If so, returns an error.
	 * @return null if there are no errors with the subscriber; a non-null String
	 * representing an error otherwise
	 */
	public String validate()
	{
		Pattern p = Pattern.compile("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");
		Matcher m = p.matcher(email);
		if (!m.find())
		{
			return "\"" + email + "\" appears to be an invalid email.";
		}

		if (Subscriber.exists(email))
		{
			return "\"" + email + "\" is already subscribed!";
		}

		return null;
	}
}