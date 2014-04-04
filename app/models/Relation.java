package models;

import play.data.validation.Constraints.*;
import play.db.ebean.Model;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class Relation extends Model
{
    @Id
    public Long Id;

    @Required
    public Argument from;
    @Required
    public Long toId;
    @Required
    public Integer type;

    @SuppressWarnings("unchecked")
    public static Finder<Long, Relation> find = new Finder(Long.class, Relation.class);

    public static Relation get(Long id)
    {
        return find.ref(id);
    }

    public static void create(Relation relation)
    {
        relation.save();
    }

    public static void delete(Long id)
    {
        find.ref(id).delete();
    }
}
