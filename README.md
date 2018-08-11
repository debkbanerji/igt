![IGT](/grader/main/src/assets/images/logo_blue.png)

# Intelligent Grading Tool

IGT is a cross platform Electron based code grading tool with support for multiple languages. (which means 2 languages) It is a GUI based tool designed around ease of use and focused on speeding up grading while reducing errors. It runs entirely locally and is FERPA compliant. It also looks cool.

Copyright (C) 2018 Deb Banerji (<debkbanerji@gmail.com>) and contributors - Made with ❤

## Disclaimer

I've tested this tool myself using the given examples, and for the most part, it works well. That being said, I can't account for every possible use case, so I cannot take responsibility for the consequences of using this tool. If something very weird happens, you can open an issue, or email me for help, but be very careful with how you describe your issue and make sure the information you send out doesn't violate FERPA.

## Supported Languages

IGT supports Java 8 and 10 (9 has been excluded since 10 is the current version and 8 is LTS, so those are usually better choices than 0), with support for capturing standard output as well as unit testing through JUnit 4 and JUnit 5. Java code is sandboxed using a Java security manager to prevent attacks through student code, though hopefully this will never happen.

IGT supports Python 3, with support for capturing standard output as well as unit testing through Python's unit test framework. Note that there isn't a clean cross platform way to sandbox Python code, so it is recommended you use a sandboxed version of the interpreter. (unless you really trust your students)

## Installing IGT

### I just want to use it

If you want to get up and running as fast as possible, grab the latest installer for your platform from the [releases page](https://github.com/debkbanerji/igt/releases). Make sure you remove any prior versions from your system before installing (I don't know how much of an issue this is, but at the very least, you may end up accidentally using an old version for grading)

### I want to modify it

If you want to modify the grader, (or if something goes wrong and you want to debug it) clone the repository open the `grader` folder - this is where the code for the grader lives. Here you'll find two subfolders containing code - `main` and `support entities`.

A majority of the grader code lives in `main` and is an [electron](https://electronjs.org/) app, managed under [npm](https://www.npmjs.com/), so you'll have to install [https://nodejs.org/en/](Node.js) in order to run it. Note that the GUI is built in [Angular]. After running `npm install` from within `main`, `npm start` will start the grader.

The `support entities` folder contains code for the jars that are required for the grader to run Java code. They are not automatically built when running the grader, so if they are changed, the jars need to manually built and copied over to `main/src/assets/jar` The reason for this is that they are compiled using different JDKs to allow the grader to support multiple Java language levels. If you make changes to any of these, make sure to rebuild, move and commit new jars.

If you do make changes, it is highly recommended that you test them on one of the examples, or create a new example. IF you want to share your changes, make a pull request.

#### Building The Grader

Building the grader for different platforms can be done through the appropriate npm scripts, whose names should be pretty self explanatory. You can also use these to create installers. (these are what are provided on the releases page)

## Setting Up Assignments

It is HIGHLY recommended you set up all the required support files and do a test run with the grader BEFORE releasing an assignment to students. If something goes wrong, it is better to catch it at this stage. This is also a good time to create a fake submission that contains errors to make sure that the grader correctly catches any issue.

### Examples

Please check the `examples` folder for example assignments - the `support files` folder in each submission contains a config JSON file that defines the parameters for the assignment, so that's a good place to start. This section is a more detailed explanation of how assignments are structured.

### Rubric items

The core grading structure of any assignment revolves around rubric items. Each rubric item is worth a fixed number of points and can be either ignored or applied. If ignored, the points corresponding to the item will not be applied. Rubric items must all either be applied or ignored in order for the grader to mark a submission as done, in order to enforce consistency. It is good to be granular when specifying rubric items, as they cannot be split. They can, however, be applied in groups, with one comment.

When grading in test mode, a rubric item is automatically generated for each failed test.

The grader also allows for optional rubric items - these are good for things like additional deductions or extra credit. Unlike regular rubric items, these don't need to be addressed. These can also be applied multiple times.

### The Config File

When setting up an assignment, a folder with all the support files needs to be created. These are the files that need to be compiled or run alongside the main submission, as well as optional grading guides, an optional checkstyle file and most importantly the `igt_config.json` file. This file tells the grader how to run the tests and what rubric items should be used for grading.

The `igt_config.json` file contains a bunch of fields which need to be filled out. Make sure you fill these out correctly, or the grader won't work properly.

#### submissionStyle
This field describes the format of the submissions. This is only important during the extraction step, when the grader is creating a submission folder (within its own hidden data folder) for each submission. Note that currently, the grader expects each submission to consist of a list of files cannot deal with nested submissions. (i.e. a submission with a complex directory structure) `submissionStyle` can have one of 4 values:

`"tsquare"`: Submissions in the style provided by TSquare. It had already been coded for the old grader and is now mostly around for legacy purposes since Georgia Tech is moving away from TSquare.

`"zip"`: This expects the submission folder to contain a bunch of `.zip` or `.tar` or `.tar.gz` files. Each will be unzipped and treated as its own submission.

`"canvas"`: IGT does not use the Canvas API, in an effort to isolate the extraction code, prevent dependence on the internet and maintain security. As a result, the grader will expect the submission directory to contain a bunch of loose files in the crappy format provided by Canvas. (see the `examples` folder if you want to know what this looks like) If a student submits multiple versions of the same file, only the latest version will be extracted.

`"canvasZip"`: Same as `"zip"` but the grader will only take the latest of each version if the archive files are named according to the Canvas naming scheme.

#### language

Pretty self explanatory. Can be one of `python3`, `java8` or `java10`. Note that Java 9 isn't supported (10 is the current version and 8 is LTS, so those are usually better choices than 0)


#### gradingStyle

This can be either `"tests"` or `"output"`. `"tests"` will expect you to configure tests within the test file using the format specified later in this document. If you're using Java, JUnit 4 and 5 are the supported test frameworks, while for python, the native unittest framework is supported.

#### mainFileName

Required if the grading style is `"output"` and the language is python. This is the file that will be run using the python command specified in settings. WARNING: It is highly recommended you specify a timeout within your main file wrapping any student code you plan to run, in order to prevent infinite loops.

#### mainClassName

Required if the grading style is `"output"` and the language is Java. This is the class that will be run using the python command specified in settings in order to capture output.

#### mainClassTimeout

Required if the grading style is `"output"` and the language is Java. Unlike for python, when grading Java, the grader uses a classloader to load in the main class, so it supports adding a timeout in the config file. This timeout is in milliseconds.

#### testClassName

Name of test class. Required if the grading style is `"tests"`. Must be annotated using the format specified below. If the language is a version of Java, the test file will automatically be assumed to be the test class name concatenated with `.java`.

#### testFileName

Name of file containing test cass. Required if the grading style is `"tests"` and the language is not Java.

#### junitVersion
  
Required if the grading style is `"tests"` and the language is Java. Must be ither `4` or `5`

#### studentFiles

List of files a student must submit

#### supportFiles

List of support files that will be compiled, run or presented to the grader alongside the student files, including the test file, helper code and any grading guides. Each of these must exist in the same directory as the grader config file. Note that support files within directories are currently not supported. Note that if a student submits a file with the same name as a support file, it will be overwritten by the support file.

#### checkstyleFileName

Optional field. If the language is Java, the rules specified in this xml file will be used to audit each submission. This file must be present in the support files directory. Note that in order for points to automatically be subtracted during the audit, an optional rubric item with the appropriate `hintKey` must be created. (see one of the provided examples for details on how to do this)

#### pointBasedComments

Comments that are automatically applied at the end of submissions if the final score either exceeds or is lower than a certain threshold. It contains two fields, `belowOrEqual` and `aboveOrEqual`. Each of these maps to an object whose keys are points and whose values are the corresponding comments.

#### basePoints

Points that every student starts with. It's usually a good idea to make this equal to the maximum number of points and then make each rubric item worth negative points. If you're using tests, then each failed tests generates a rubric item worth the negation of the number of points the test was worth.

#### maxPoints

The maximum number of points each student can get. It's usually a good idea to make basePoints equal to this.

#### dictionaryItems

IGT comes with spellcheck, but many coding terms aren't valid English words. Any words in this array will be added to the dictionary so spellcheck doesn't freak out.

#### autocomplete

IGT comes with autocomplete for various comment fields and adds in any comments you make in a particular field to an assignment's library so they can be reused. This object contains 3 fields, `"commonRubricItemComments"`, `"commonOptionalRubricItemComments"` and `"commonAdditionalComments"` each mapping to an array of strings corresponding to comments for main rubric items, optional rubric items and point adjustment comments respectively. You can usually leave these empty, but if you anticipate a particular comment being commonly used for a particular assignment, you can put it into the appropriate array to get a headstart and make your life easier once you start grading.

#### rubricItems

This is an array of the main rubric items that must be addressed (manually applied or ignored) during grading. Each can be applied only once. If you're using tests, this will usually be empty.

Each rubric item has multiple fields, only two of which (`points` and `title`) is required:

`points`: Points the rubric item is worth. Mandatory field. It's usually good to start with `basePoints` equal to `maxPoints` and then make each rubric item worth a negative number of points.

`name`: Title of the rubric item for the grader's benefit. Mandatory field. Note that this won't be showed to the student. This is because the comments provided to students when items are applied should be descriptive, and the titl of rubric items may contain information that should not be shown to the students. (such as test names for automatically generated rubric items)

`notes`: Notes which are shown to the grader (but not the student). Useful if the rubric item is complicated. 

`author`: Can be specified within the test file, since this is usually useful for tests, but can also be specified in the config file for non test rubric items.

`contactLink`: Same as above. It is usually good to make this a `mailto` link. Note that the grader does not directly access the internet using this link (for security reasons) but rather delegates the task to the user's computer

`regexes`: Array of Javascript regexes that are used to flag lines in student code to make searching for certain terms easier. Note that the searching is done on a line by line basis so the line of the match can be displayed to the grader.

`goodRegexes`: Same as above, but the match will be highlighted in green and stated to be good so the user knows that matching one of these regexes is a good thing.

`badRegexes`: Same as above, but the match will be highlighted in red and stated to be bad so the user knows that matching one of these regexes is a bad thing.

#### optionalRubricItems

Optional rubric items are just like regular rubric items, except they are optional so they likely won't be applied for most submissions. They contain all the fields of a regular rubric item, with 2 more optional ones.

The first is `maxApplications`, which is present since optional rubric items can be applied multiple times. (This defaults to 1 if not provided)
 
The second is `hintKey`. If this exists, then based on its value, IGT will try to automatically apply it in certain situations:

`nonSubmit`: automatically applied when there are one or more missing submission files. Usually, you should set the number of points of the corresponding item equal to the negation of the base points (so the student gets a 0)

`syntaxError`: automatically applied if the code could not be run due to a syntax error. (for Python) Recommended usage is similar to that of `nonSubmit`.

`nonCompile`: automatically applied if the code did not compile (for compiled languages). (for Python) Recommended usage is similar to that of `nonSubmit` and `syntaxError`.

`checkstyle`: automatically applied once for every checkstyle error up to the number of times specified by `maxApplications`. Only works for Java projects where the checkstyle file has been specified in the config.

`encapsulationViolation`: only works with Java. Automatically applied for unxepected non private variables and helper methods. Note that you can configure the expected variables and methods in the `javaHintHelpers`field of the config file.

`additionalInstanceVariables`: only works with Java. Automatically applied for unxepected additional instance variables. Note that you can configure the expected variables and methods in the `javaHintHelpers`field of the config file.

#### javaHintHelpers

Contains two fields (`expectedPublicMethods` and `expectedPrivateFields`) that are designed to trigger the `hintKey`s of optional rubric items. Each field maps to an object whose keys are files and whose values are arrays of the expected entities for those files.

### The Test File

Each test the Python or Java test file must be properly marked with comments near the header so that IGT can generate rubric items for them.

Tests support a few different properties, only one of which is mandatory:

`points`: how many points the test is worth (ONLY REQUIRED PROPERTY)
`version`: should be a non negative integer - defaults to 0 if not provided,
     but it is good practice to always provide it - you should add this when
     updating any tests, or patching may behave unexpectedly (if I ever get around to implementing it)
     it only exists right now so if something goes wrong, and patching needs to be implemented
     in an emergency, assignments processed using old versions of IGT are still compatible
`author`: name of who wrote the test
`contactLink`: link to contact the author of the test (a mailto is usually good for this)
`autoApplyText`: if this field exists and the test fails, this text will be
     applied as a comment automatically and the item will be resolved. The grader
     may still unresolve the item and apply a different comment, but it's best to
     reserve this field for tests whose reasons for failure are very predictable
`notes`: test notes

Example Java test syntax:

```
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
    }
```

Example Python test syntax:

```
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
        pass

```

Note that for python, every test function must start with the word 'test', matching the regex: test.*


It is highly recommended you use a timeout for your tests. In python, the test framework doesn't provide a natie timeout implementation, so one has ben provided in the examples.


## Getting Help

Once again, it is HIGHLY recommended you set up all the required support files and do a test run with the grader BEFORE releasing an assignment to students. It is much easier to fix issues at this stage, not only because you haven't yet sent a potentially problematic file out to students, but also because you have to be much more careful about FERPA when dealing with already submitted files.

If there is an issue, immediately create a backup of the submissions folder and export the submissions you've already finished grading, so you don't lose any data. (Be careful to also copy over the grader data folder in the submissions directory, since that's where all the grader information for that directory is stored) Then, enable the developer tools console from the settings of home page. If you can't pinpoint the issue between looking at the console errors and the source code, build the grader using the instructions given under 'Installing IGT'. If it's an issue with the grader itself, open an issue and/or make a pull request to fix it.

If all else, fails, send me an email, but be very careful about what information you include - I cannot take responsibility for the information you choose to send me.

If you want a feature added to the grader, feel free to request one through GitHub or send me an email. You can also add it yourself and open a pull request.

## Old versions

IGT is based on WWAAAGT, (Wildly Wonderful and Amazingly Awesome Grading Tool) built by me for grading CS 1332 code at Georgia Tech. Note that the jar code is partially based on code written by Siddu Duddikunta <siddu@siddu.me> for the even older CS 1332 grading tool.

IGT is managed under a new repository and in an effort to be more generic, comes without any CS 1332 specific features in the grader code. If you need to use any of these features, they can very easily be recreated within the grader config file.
