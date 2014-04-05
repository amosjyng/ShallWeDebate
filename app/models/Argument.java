package models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import org.hibernate.validator.constraints.NotEmpty;
import play.db.ebean.*;
import play.data.validation.Constraints.*;

import javax.persistence.*;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * An Argument which makes a short statement about the world. May be true or false, logical or illogical. Doesn't
 * matter as long as it is a statement about some aspect of the world (that can be supported or rebuffed by another
 * statement).
 */
@Entity
public class Argument extends Model
{
    /**
     * Primary key, nothing much more to say.
     */
    @Id
    public Long id;

    /**
     * Short statement about the world. May consider making in the future another field for a more in-depth explanation,
     * but for now let's see whether conciseness does the whole job of adequately expressing an idea.
     */
    @Required @NotEmpty @Size(max = 140)
    public String summary;
    /**
     * List of Relations which have this Argument in the "from" node. Had to add this because of
     * http://stackoverflow.com/q/22858424/257583, since apparently Ebeans will automatically add a "relations" field to
     * this class otherwise.
     */
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "from") @JsonBackReference
    public List<Relation> fromThis;
    /**
     * List of Relations which have this Argument in the "to" node.
     */
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "toArgument") @JsonBackReference
    public List<Relation> toThis;

    /**
     * Something you use to write your queries for you.
     */
    @SuppressWarnings("unchecked")
    public static Finder<Long, Argument> find = new Finder(Long.class, Argument.class);

    /**
     * Gets a *reference* to an Argument based on the ID given. This will not (immediately?) return null for an
     * Argument that doesn't yet exist, so if you always assume it does, you'll get a NullPointerException.
     * @param id The ID of the Argument you wish to find.
     * @return A reference to that Argument, whether it exists or not.
     */
    public static Argument get(Long id)
    {
        return find.ref(id);
    }

    /**
     * Save an argument to the database. Not much to say.
     * TODO: data validation?
     * @param argument The argument you wanna save. Duh.
     */
    public static void create(Argument argument)
    {
        argument.save();
    }

    /**
     * Delete an argument given its ID. I suspect that since we're using ref here, we may run into NullPointerExceptions
     * if we try to delete something that doesn't exist.
     * @param id The ID of the Argument you wish to delete.
     */
    public static void delete(Long id)
    {
        find.ref(id).delete();
    }
}
