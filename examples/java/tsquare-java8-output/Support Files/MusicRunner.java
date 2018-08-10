import java.util.NoSuchElementException;

/**
 * Class who's main method's output will be captured by the grader
 *
 * See the provided grader config file for an example of how to point the grader to the appropriate class
 */
public class MusicRunner {

    public static void main(String[] args) {
        MusicInterface music = new Music<Integer>(); // Generic for no good reason

        System.out.println("Lyrics Output:\n");

        System.out.println("We could have been " + music.whatWeCouldHaveBeenTogether() + " together");
        System.out.println("We could have lived " + music.whatWeCouldHaveLivedForever() + " forever");

        String whoIsGoingToDanceWithMe;
        try {
            whoIsGoingToDanceWithMe = music.whoIsGoingToDanceWithMe();
        } catch (NoSuchElementException e) {
            whoIsGoingToDanceWithMe  = "who";
        }
        System.out.println("But now " + whoIsGoingToDanceWithMe + "'s going to dance with me");
    }
}
