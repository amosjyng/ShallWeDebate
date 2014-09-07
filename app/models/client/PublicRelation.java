package models.client;

import models.Relation;

/**
 * A class containing only the publicly viewable fields of a Relation
 */
public class PublicRelation
{
	/**
	 * Public key of the Relation, fine to have public because it's in the URL anyways
	 */
	public Long id;

	/**
	 * A publicly-viewable Argument, so should be fine
	 */
	public PublicArgument from;

	/**
	 * A publicly-viewable Argument, so should be fine
	 */
	public PublicArgument toArgument;

	/**
	 * A publicly-viewable Relation, so should be fine
	 */
	public PublicRelation toRelation;

	/**
	 * Important so that viewers can know how one argument relates to
	 * another Argument/Relation.
	 */
	public Integer type;

	/**
	 * Important so that viewers can know whether to click on the link representing
	 * this Relation
	 */
	public Boolean isDebated;

	/**
	 * Instantiate this class given an actual Argument
	 */
	public PublicRelation(Relation relation)
	{
		this.id = relation.id;
		this.from = new PublicArgument(relation.from);
		this.toArgument = relation.toArgument == null ?
						  null : new PublicArgument(relation.toArgument);
		this.toRelation = relation.toRelation == null ?
						  null : new PublicRelation(relation.toRelation);
		this.type = relation.type;
		this.isDebated = relation.isDebated;
	}
}