package models;

import org.hibernate.validator.constraints.NotEmpty;
import play.db.ebean.*;
import play.data.validation.Constraints.*;

import javax.persistence.*;
import javax.validation.constraints.Size;

@Entity
public class Argument extends Model
{
    @Id
    public Long id;

    @Required @NotEmpty @Size(max = 140)
    public String summary;

    @SuppressWarnings("unchecked")
    public static Finder<Long, Argument> find = new Finder(Long.class, Argument.class);

    public static Argument get(Long id)
    {
        return find.ref(id);
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
