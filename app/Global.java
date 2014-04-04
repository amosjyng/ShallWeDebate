import com.avaje.ebean.Ebean;
import play.*;
import models.Argument;
import play.libs.Yaml;

import java.util.List;

public class Global extends GlobalSettings
{
    @Override
    public void onStart(Application app)
    {
        if (Argument.find.findRowCount() == 0)
        {
            Ebean.save((List) Yaml.load("dev-data.yml"));
        }
    }
}
