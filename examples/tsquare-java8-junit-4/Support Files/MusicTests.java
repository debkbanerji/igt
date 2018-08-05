import org.junit.AfterClass;
import org.junit.Before;
import org.junit.Test;

import java.util.NoSuchElementException;

import static org.junit.Assert.*;

/**
 * Example JUnit 4 test file
 * <p>
 * Each test has several different properties for use by the autograder:
 * <p>
 * points: how many points the test is worth (ONLY REQUIRED PROPERTY)
 * version: should be a non negative integer - defaults to 0 if not provided,
 *      but it is good practice to always provide it - you should add this when
 *      updating any tests, or patching may behave unexpectedly (if I ever get around to implementing it)
 * author: name of who wrote the test
 * contactLink: link to contact the author of the test (a mailto is usually good for this)
 * notes: test notes
 */
public class MusicTests {

    // Using a timeout is highly recommended since you're going to be running a large amount of student submissions
    private static final long TIMEOUT = 200;

    private MusicInterface music;

    @Before
    public void setup() {
        // Test setup here
        music = new Music(); // This is just an example of setup - methods like those in Music should be static
    }

    @AfterClass
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
    @Test(timeout = TIMEOUT)
    public void testFirstLine() {
        assertEquals("so good", music.whatWeCouldHaveBeenTogether());
    }

    /**
     * @points 10
     * @version 2
     * @author Deb Banerji
     * @contactLink mailto:debkbanerji@gmail.com
     * @notes test second line
     */
    @Test(timeout = TIMEOUT)
    public void testSecondLine() {
        assertEquals("this dance", music.whatWeCouldHaveLivedForever());
    }

    /**
     * @points 5
     * @author Deb Banerji
     * @contactLink mailto:debkbanerji@gmail.com
     * @notes testing to make sure an exception is thrown
     */
    @Test(timeout = TIMEOUT, expected = NoSuchElementException.class)
    public void testHeartBreak() {
        music.whoIsGoingToDanceWithMe();
    }
}
