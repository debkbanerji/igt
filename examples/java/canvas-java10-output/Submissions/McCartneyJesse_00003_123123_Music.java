import java.util.*;

/**
 * This is an example of the file that would be provided to the student in this case
 * Note that this file should not be part of the grader config supportFiles since it is not required for grading
 *
 * Note that you can use the config file to automatically deduct points in optional rubric items for any
 * unexpected private variables or public helper methods. In order to do this, you need to set javaHintHelpers,
 * as well as the hintKey field in the appropriate optional rubric item (see example)
 *
 * FIRST VERSION OF SUBMISSION: NOTE THAT THIS WAS THE FIRST VERSION OF THE SUBMITTED FILE, AND SHOULD NOT BE GRADED
 *
 * @author your name/id here
 */
public class Music<T> implements MusicInterface<T> {

    private int expectedPrivateVariable = 0;

    private int privateUselessVariable = 0;
    public int publicUselessVariable = 0;

    @Override
    public String whatWeCouldHaveBeenTogether() {
        System.out.println("Trying to sing " + SongTitleHelper.getSongName());
        List<Integer> Useless = new ArrayList(); // Should trigger generics warning that's caught by a regex in optional rubric items
        return "an awkward music video couple";
    }

    @Override
    public String whatWeCouldHaveLivedForever() {
        return "2004 nostalgia";
    }

    @Override
    public String whoIsGoingToDanceWithMe() throws UnsupportedOperationException { // note that the 'throws' would not have been required even if an exception was thrown
        return "you and your beautiful soul";
    }

    @SuppressWarnings("unchecked") // Suppression of error can be caught by a regex
    public void publicUselessMethod() {
        List<Integer> Useless = new ArrayList(); // Suppressed generics error
    }
}
