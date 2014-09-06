package models;

import com.avaje.ebean.Ebean;
import com.avaje.ebean.Expr;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import play.data.validation.Constraints.*;
import play.Logger;
import play.db.ebean.*;
import com.avaje.ebean.annotation.CreatedTimestamp;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Column;
import javax.validation.constraints.NotNull;
import java.util.List;
import java.sql.Timestamp;

/**
 * A Relation captures the meaning behind the strong, direct interactions of two different Arguments.
 */
@Entity
public class Relation extends Model
{
    /**
     * Primary key, what can I say?
     */
    @Id
    public Long id;

    /**
     * Time at which this Relation was created
     */
    @CreatedTimestamp
    Timestamp createdAt;

    /**
     * The User who created this Relation
     */
    @Required @ManyToOne(optional = false)
    public User creator;

    /**
     * Which Argument provides the basis for this Relation. The "from" part must always be from an Argument.
     *
     * I suppose that logically, "if x then y" may sometimes imply "if x' then y'," where x' and x and y' and y are
     * supposed to be related in some way. (Though that sounds very much like a logical fallacy.) But then in that case,
     * you can put "if x then y" as a separate statement, which supports the separate statement "if x' then y'." In any
     * case, probably best to keep it as simple as possible for now.
     */
    @Required @ManyToOne(optional = false) @NotNull @JsonManagedReference
    public Argument from;
    /**
     * The Argument, if any, that is on the "to" end of this Relation. Either this or toRelation must be non-null.
     */
    @ManyToOne() @JsonManagedReference
    public Argument toArgument;
    /**
     * The Relation, if any, that is on the "to" end of this Relation. Either this or toArgument must be non-null.
     */
    @ManyToOne() @JsonManagedReference
    public Relation toRelation;
    /**
     * The type of Relation that purportedly exists between the "from" and the "to" ends:
     * 0 - one Argument supports another
     * 1 - one Argument opposes another
     * 2 - one Argument marks one Relation as irrelevant
     * 3 - one Argument marks one Relation as relevant
     */
    @Required @NotNull
    public Integer type;
    /**
     * Whether or not this Relation is on the toRelation end of another relation. Needed because usually one wouldn't
     * think of a Relationship as having something else attached to it.
     */
    @Required @NotNull @Column(columnDefinition = "boolean default false")
    public Boolean isDebated;

    /**
     * No-argument constructor for SnakeYAML
     *
     * Set isDebated to be false by default (since chances are most relations won't be debated at all).
     */
    public Relation()
    {
        super();

        isDebated = false;
    }

    /**
     * Should always use this constructor for Relation
     * @param creator The user who is creating this Relation
     */
    public Relation(User creator)
    {
        this();

        this.creator = creator;
    }

    /**
     * Something you use to write your queries for you.
     */
    @SuppressWarnings("unchecked")
    public static Finder<Long, Relation> find = new Finder(Long.class, Relation.class);

    /**
     * Get a reference to a Relation. Note that even if such a relationship doesn't exist, the reference will not
     * (initially) be null.
     * @param id The ID of the Relation to be fetched
     * @return A reference to the Relation with that ID
     */
    public static Relation get(Long id)
    {
        return find.ref(id);
    }

    /**
     * Modify the "from" end of this relation
     * @param argument The argument to set the "from" end to
     */
    public void setFrom(Argument argument)
    {
        from = argument;
    }

    /**
     * Modify the "to" end of this relation, if the "to" end is an argument (and is not already set to another relation)
     * @param argument The argument to set the "to" end to
     * @throws ToFieldNotNullException when the toRelation field is already set to a non-null value, and this function
     * is called in an attempt to set the toArgument field as well
     */
    public void setToArgument(Argument argument) throws ToFieldNotNullException
    {
        if (toRelation == null) // only one of the "to's" should be non-null at any time
        {
            toArgument = argument;
        }
        else
        {
            throw new ToFieldNotNullException();
        }
    }

    /**
     * Modify the "to" end of this relation, if the "to" end is a Relation (and is not already set to another relation)
     * @param relation The Relation to set the "to" end to
     * @throws ToFieldNotNullException when the toArgument field is already set to a non-null value, and this function
     * is called in an attempt to set the toRelation field as well
     */
    public void setToRelation(Relation relation) throws ToFieldNotNullException
    {
        if (toArgument == null) // only one of the "to's" should be non-null at any time
        {
            toRelation = relation;
        }
        else
        {
            throw new ToFieldNotNullException();
        }
    }

    /**
     * Modify the type of relation this is.
     * @param type The new type of Relation this will be. See the documentation for the Relation.type field for the list
     *             of types that the relation could take on.
     */
    public void setType(Integer type)
    {
        this.type = type;
    }

    /**
     * Save a new Relation to the database
     * @param relation The new Relation object that is to be saved
     */
    public static void create(Relation relation)
    {
        relation.save();
    }

    /**
     * Save an argument to the database as a reply to a Relation. A relation will be created in addition to this
     * argument.
     *
     * Note: All code in this function, except for one line, is identical to the same function in the Argument
     * replyWith function.
     * @param reply The new Argument to be saved as a reply to this Relation
     * @param type The type of relation between the new Argument and this Relation
     * @return The new Relation that is created. The Relation and not the Argument is returned, because you can always
     * easily get the Argument given the Relation.
     */
    @Transactional
    public Relation replyWith(Argument reply, Integer type)
    {
        Ebean.save(reply);
        Relation newRelation = new Relation(reply.creator);
        newRelation.setFrom(reply);
        try
        {
            newRelation.setToRelation(this);
        }
        catch (ToFieldNotNullException e)
        { // todo: stop further processing when this error is encountered
            Logger.error("toArgument or toRelation field of new Relation is already set. How is this possible?!");
        }
        newRelation.setType(type);
        Ebean.save(newRelation);

        // make sure this relation is set as debated too
        isDebated = true;
        Ebean.save(this);

        return newRelation;
    }

    /**
     * Remove a relation from the database.
     * @param id The ID of the Relation to be removed.
     */
    public static void delete(Long id)
    {
        find.ref(id).delete();
    }

    /**
     * Get all Relations for which the Argument with the given ID is on either end of the Relation.
     * @param id The ID for the Argument.
     * @return All relations where the associated Argument is in either the "from" or the "to" ends of the Relation.
     */
    public static List<Relation> getRelationsOfArgumentWithId(Long id)
    {
        Argument argument = Argument.get(id);
        return find.where().or(Expr.eq("from", argument), Expr.eq("toArgument", argument)).findList();
    }

    /**
     * Get all Relations which point to the Relation with the given ID.
     * @param id The ID for the Relation.
     * @return All relations where the "to" end is the ID of the given Relation.
     */
    public static List<Relation> getRelationsOfRelationWithId(Long id)
    {
        Relation relation = Relation.get(id);
        return find.where(Expr.eq("toRelation", relation)).findList();
    }
}
