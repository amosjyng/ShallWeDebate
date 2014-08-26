import models.Argument;
import models.Relation;
import org.junit.Test;
import play.mvc.Content;

import static org.fest.assertions.Assertions.assertThat;
import static play.test.Helpers.*;


/**
 * Simple (JUnit) tests that can call all parts of a play app. If you are interested in mocking a whole application, see
 * the wiki for more details.
 */
public class ApplicationTest
{
    @Test
    public void renderTemplate()
    {
        Content html = views.html.index.render("Your new application is ready.");
        assertThat(contentType(html)).isEqualTo("text/html");
        assertThat(contentAsString(html)).contains("Your new application is ready.");
    }

    @Test
    public void replyToArgument()
    {
        running(fakeApplication(), new Runnable()
        {
            @Override
            public void run()
            {
                Argument reply = new Argument();
                String summary = "Taxation blah blah blah...";
                reply.setSummary(summary);
                Relation theftRelation = Argument.get(2L).replyWith(reply, 1);

                assertThat(theftRelation.from.summary).isEqualTo(summary);
            }
        });
    }
}
