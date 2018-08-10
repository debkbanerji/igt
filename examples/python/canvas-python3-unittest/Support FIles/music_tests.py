import unittest
import music

import grader_timeout_decorator
TIMEOUT_SECONDS = 1


# Example test file
#
# Each test has several different properties for use by the autograder:
#
# points: how many points the test is worth (ONLY REQUIRED PROPERTY)
# version: should be a non negative integer - defaults to 0 if not provided,
#      but it is good practice to always provide it - you should add this when
#      updating any tests, or patching may behave unexpectedly (if I ever get around to implementing it)
# author: name of who wrote the test
# contactLink: link to contact the author of the test (a mailto is usually good for this)
# autoApplyText: if this field exists and the test fails, this text will be
#      applied as a comment automatically and the item will be resolved. The grader
#      may still unresolve the item and apply a different comment, but it's best to
#      reserve this field for tests whose reasons for failure are very predictable
# notes: test notes
#
#
# Note: every test function must start with the word 'test', matching the regex: test.*
#
# WARNING: IT IS HIGHLY RECOMMENDED YOU IMPLEMENT TIMEOUTS FOR YOUR TESTS TO DEAL WITH INFINITE LOOPS
#
# Python's unittest framework doesn't come with a timeout decorator, but a sample implementation
# has been provided with this example. Note that this sample implementation requires 'queue' to work
#
class MusicTests(unittest.TestCase):

    @grader_timeout_decorator.timeout(TIMEOUT_SECONDS)
    def test_first_line(self):
        """
        :points: 10
        :version: 2
        :author: Deb Banerji
        :contactLink: mailto:debkbanerji@gmail.com
        :notes: test first line -
            note that this is a multi line tag
            to test to see if multi line tags work
        """
        self.assertEqual('so good', music.what_we_could_have_been_together())

    @grader_timeout_decorator.timeout(TIMEOUT_SECONDS)
    def test_second_line(self):
        """
        :points: 10
        :version: 2
        :author: Deb Banerji
        :contactLink: mailto:debkbanerji@gmail.com
        :autoApplyText: did not hold dancing in high enough regard
        :notes: test second line
        """
        self.assertEqual('this dance', music.what_we_could_have_lived_together())

    @grader_timeout_decorator.timeout(TIMEOUT_SECONDS)
    def test_heartbreak(self):
        """
        :points: 5
        :version: 2
        :author: Deb Banerji
        :contactLink: mailto:debkbanerji@gmail.com
        :notes: testing to make sure an error is raised
        """
        with self.assertRaises(RuntimeError):
            music.who_is_going_to_dance_with_me()
