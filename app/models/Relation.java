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

@Entity
public class Relation extends Model
{
    @Id
    public Long id;

    @Required @ManyToOne(fetch = FetchType.LAZY, optional = false) @NotNull @JsonManagedReference
    public Argument from;
    @ManyToOne(fetch = FetchType.LAZY) @JsonManagedReference
    public Argument toArgument;
    @ManyToOne(fetch = FetchType.LAZY) @JsonManagedReference
    public Relation toRelation;
    @Required @NotNull
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

    public static List<Relation> getRelationsOfArgumentWithId(Long id)
    {
        Argument argument = Argument.get(id);
        return find.where().or(Expr.eq("from", argument), Expr.eq("toArgument", argument)).findList();
    }
}
