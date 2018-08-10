import java.util.*;

/**
 * This is an example of the file that would be provided to the student in this case
 * Note that this file should not be part of the grader config supportFiles since it is not required for grading
 *
 * Note that you can use the config file to automatically deduct points in optional rubric items for any
 * unexpected private variables or public helper methods. In order to do this, you need to set javaHintHelpers,
 * as well as the hintKey field in the appropriate optional rubric item (see example)
 *
 * @author Rick Astley
 */
public class Music<T> implements MusicInterface<T> {

    private int expectedPrivateVariable = 0;

    @Override
    public String whatWeCouldHaveBeenTogether() {
        System.out.println("Trying to do potentially evil stuff");
        System.setOut(null);
        return null;
    }

    @Override
    public String whatWeCouldHaveLivedForever() {
        return null;
    }

    @Override
    public String whoIsGoingToDanceWithMe() {
        return null;
    }
}
