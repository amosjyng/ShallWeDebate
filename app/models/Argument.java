package models;

import play.db.ebean.*;
import play.data.validation.Constraints.*;

import javax.persistence.*;

@Entity
public class Argument extends Model
{
    @Id
    public Long id;

    @Required
    public String summary;

    @SuppressWarnings("unchecked")
    public static Finder<Long, Argument> find = new Finder(Long.class, Argument.class);

    public static Argument get(Long id)
    {
        return null; // TODO
    }

    public static void create(Argument argument)
    {
        argument.save();
    }

    public static void delete(Long id)
    {
        find.ref(id).delete();
    }
}
