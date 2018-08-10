import java.util.*;

/**
 * This is an example of the file that would be provided to the student in this case
 * Note that this file should not be part of the grader config supportFiles since it is not required for grading
 *
 * Note that you can use the config file to automatically deduct points in optional rubric items for any
 * unexpected private variables or public helper methods. In order to do this, you need to set javaHintHelpers,
 * as well as the hintKey field in the appropriate optional rubric item (see example)
 *
 * @author Justin Timberlake
 */
public class Music<T> implements MusicInterface<T> {

    private int expectedPrivateVariable = 0;

    @Override
    public String whatWeCouldHaveBeenTogether() {
        System.out.println("This should cause a timeout");
        for (int i = 0; i < 1; ) {

        }
        return null;
    }

    @Override
    public String whatWeCouldHaveLivedForever() {
        System.out.println("This should cause a timeout");
        for (int i = 0; i < 1; ) {

        }
        return null;
    }

    @Override
    public String whoIsGoingToDanceWithMe() {
        System.out.println("This should cause a timeout");
        for (int i = 0; i < 1; ) {

        }
        return null;
    }
}
