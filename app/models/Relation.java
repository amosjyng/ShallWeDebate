package models;

import com.avaje.ebean.Expr;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import play.data.validation.Constraints.*;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.validation.constraints.NotNull;
import java.util.List;

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
     * Which Argument provides the basis for this Relation. The "from" part must always be from an Argument.
     *
     * I suppose that logically, "if x then y" may sometimes imply "if x' then y'," where x' and x and y' and y are
     * supposed to be related in some way. (Though that sounds very much like a logical fallacy.) But then in that case,
     * you can put "if x then y" as a separate statement, which supports the separate statement "if x' then y'." In any
     * case, probably best to keep it as simple as possible for now.
     */
    @Required @ManyToOne(fetch = FetchType.LAZY, optional = false) @NotNull @JsonManagedReference
    public Argument from;
    /**
     * The Argument, if any, that is on the "to" end of this Relation. Either this or toRelation must be non-null.
     */
    @ManyToOne(fetch = FetchType.LAZY) @JsonManagedReference
    public Argument toArgument;
    /**
     * The Relation, if any, that is on the "to" end of this Relation. Either this or toArgument must be non-null.
     */
    @ManyToOne(fetch = FetchType.LAZY) @JsonManagedReference
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
}
