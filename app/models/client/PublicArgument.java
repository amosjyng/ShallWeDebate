package models.client;

import models.Argument;

/**
 * A class containing only the publicly viewable fields of an Argument
 */
public class PublicArgument
{
	/**
	 * Public key of the argument, fine to have public because it's in the URL anyways
	 */
	public Long id;

	/**
	 * The summary of the argument. Exactly what we want users to see,
	 * so should be public
	 */
	public String summary;

	/**
	 * Instantiate this class given an actual Argument
	 */
	public PublicArgument(Argument argument)
	{
		this.id = argument.id;
		this.summary = argument.summary;
	}
}