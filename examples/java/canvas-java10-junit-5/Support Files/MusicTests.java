import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

/**
 * Example JUnit 5 test file
 * <p>
 * Each test has several different properties for use by the autograder:
 * <p>
 * points: how many points the test is worth (ONLY REQUIRED PROPERTY)
 * version: should be a non negative integer - defaults to 0 if not provided,
 *      but it is good practice to always provide it - you should add this when
 *      updating any tests, or patching may behave unexpectedly (if I ever get around to implementing it)
 * author: name of who wrote the test
 * contactLink: link to contact the author of the test (a mailto is usually good for this)
 * autoApplyText: if this field exists and the test fails, this text will be
 *      applied as a comment automatically and the item will be resolved. The grader
 *      may still unresolve the item and apply a different comment, but it's best to
 *      reserve this field for tests whose reasons for failure are very predictable
 * notes: test notes
 */
public class MusicTests {

    // Using a timeout is highly recommended since you're going to be running a large amount of student submissions, some of which might infinite loop
    // Be sure to use assertTimeoutPreemptively rather than assertTimeout or student tests may run forever
    private static final long TIMEOUT = 200;

    private MusicInterface music;

    @BeforeEach
    public void setup() {
        // Test setup here
        music = new Music(); // This is just an example of setup - methods like those in Music should be static
    }

    @AfterAll
    public static void teardown() {
        // Test cleanup here
    }

    /**
     * @points 10
     * @version 2
     * @author Deb Banerji
     * @contactLink mailto:debkbanerji@gmail.com
     * @notes test first line -
     * <b> note that this is a multi line tag
     * to test to see if multi line tags (and html formatting) work </b>
     */
    @Test
    public void testFirstLine() {
        assertTimeoutPreemptively(Duration.ofMillis(TIMEOUT), () -> {
            assertEquals("so good", music.whatWeCouldHaveBeenTogether());
        });
    }

    /**
     * @points 10
     * @version 2
     * @author Deb Banerji
     * @contactLink mailto:debkbanerji@gmail.com
     * @autoApplyText did not hold dancing in high enough regard
     * @notes test second line
     */
    @Test
    public void testSecondLine() {
        assertTimeoutPreemptively(Duration.ofMillis(TIMEOUT), () -> {
            assertEquals("this dance", music.whatWeCouldHaveLivedForever());
        });
    }

    /**
     * @points 5
     * @author Deb Banerji
     * @contactLink mailto:debkbanerji@gmail.com
     * @notes testing to make sure an exception is thrown
     */
    @Test
    public void testHeartBreak() {
        assertTimeoutPreemptively(Duration.ofMillis(TIMEOUT), () -> {
            assertThrows(NoSuchElementException.class, () -> music.whoIsGoingToDanceWithMe());
        });
    }
}
