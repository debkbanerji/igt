import java.util.NoSuchElementException;

/**
 * This is an example of the file that would be provided to the student in this case
 * Note that this file should not be part of the grader config supportFiles since it is not required for grading
 *
 * Note that you can use the config file to automatically deduct points in optional rubric items for any
 * unexpected private variables or public helper methods. In order to do this, you need to set javaHintHelpers,
 * as well as the hintKey field in the appropriate optional rubric item (see example)
 *
 * @author George Michael
 */
public class Music<T> implements MusicInterface<T> {

    private int expectedPrivateVariable = 0;

    @Override
    public String whatWeCouldHaveBeenTogether() {
        return "so good";
    }

    @Override
    public String whatWeCouldHaveLivedForever() {
        return "this dance";
    }

    @Override
    public String whoIsGoingToDanceWithMe() {
        throw new NoSuchElementException();
    }
}
