import com.avaje.ebean.Ebean;
import play.*;
import models.Argument;
import models.SecurityRole;
import play.libs.Yaml;
import play.mvc.Call;
import controllers.routes;

import com.feth.play.module.pa.PlayAuthenticate;
import com.feth.play.module.pa.PlayAuthenticate.Resolver;
import com.feth.play.module.pa.exceptions.AccessDeniedException;
import com.feth.play.module.pa.exceptions.AuthException;

import java.util.List;
import java.util.Arrays;

public class Global extends GlobalSettings
{
    @Override
    public void onStart(Application app)
    {
        // make sure website is populated with arguments on initial creation
        if (Argument.find.findRowCount() == 0)
        {
            Ebean.save((List) Yaml.load("dev-data.yml"));
        }

        // make sure security roles exist
        // https://github.com/joscha/play-authenticate/issues/102
        if (SecurityRole.find.findRowCount() == 0)
        {
            for (final String roleName : Arrays.asList(controllers.Application.USER_ROLE))
            {
                final SecurityRole role = new SecurityRole();
                role.roleName = roleName;
                role.save();
            }
        }

        PlayAuthenticate.setResolver(new Resolver()
        {
            // https://raw.githubusercontent.com/joscha/play-authenticate/2.2.x/samples/java/play-authenticate-simple-oauth/app/Global.java
            @Override
            public Call login() {
                // Your login page
                return routes.Application.index();
            }

            @Override
            public Call afterAuth() {
                // The user will be redirected to this page after authentication
                // if no original URL was saved
                return routes.Application.index();
            }

            @Override
            public Call afterLogout() {
                return routes.Application.index();
            }

            @Override
            public Call auth(final String provider) {
                // You can provide your own authentication implementation,
                // however the default should be sufficient for most cases
                return com.feth.play.module.pa.controllers.routes.Authenticate
                        .authenticate(provider);
            }

            @Override
            public Call onException(final AuthException e) {
                if (e instanceof AccessDeniedException) {
                    return routes.Application.index();
                }

                // more custom problem handling here...

                return super.onException(e);
            }

            @Override
            public Call askLink() {
                // We don't support moderated account linking in this sample.
                // See the play-authenticate-usage project for an example
                return null;
            }

            @Override
            public Call askMerge() {
                // We don't support moderated account merging in this sample.
                // See the play-authenticate-usage project for an example
                return null;
            }
        });

    }
}
