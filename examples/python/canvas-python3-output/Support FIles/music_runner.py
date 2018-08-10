import music

# File that will be run by the grader
#
# See the provided grader config file for an example of how to point the grader to the appropriate class
#

print("Lyrics Output:\n")

print("We could have been " + music.what_we_could_have_been_together() + " together")
print("We could have lived " + music.what_we_could_have_lived_together() + " forever")

whoIsGoingToDanceWithMe = None
try:
    whoIsGoingToDanceWithMe = music.who_is_going_to_dance_with_me()
except:
    whoIsGoingToDanceWithMe = "who"

print("But now " + whoIsGoingToDanceWithMe + "'s going to dance with me");