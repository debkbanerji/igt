![IGT](/grader/main/src/assets/images/logo_blue.png)

# Intelligent Grading Tool

IGT is a cross platform Electron based code grading tool with support for multiple languages. (which means 2 languages) It is a GUI based tool designed around ease of use and focused on speeding up grading while reducing errors. It runs entirely locally and is FERPA compliant. It also looks cool.

Copyright (C) 2018 Deb Banerji (<debkbanerji@gmail.com>) and contributors - Made with ❤

## Disclaimer

I've tested this tool myself using the given examples, and for the most part, it works well. That being said, I can't account for every possible use case, so I cannot take responsibility for the consequences of using this tool. If something very weird happens, you can open an issue, or email me for help, but be very careful with how you describe your issue and make sure the information you send out doesn't violate FERPA.

## Supported Languages

IGT supports Java 8 and 10 (9 has been excluded since 10 is the current version and 8 is LTS), with support for capturing standard output as well as unit testing through JUnit 4 and JUnit 5. Java code is sandboxed using a Java security manager to prevent attacks through student code, though hopefully this will never happen.

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

The documentation for setting up assignments is currently under construction. If you want to set up an assignment, please check the `examples` folder for example assignments - the `support files` folder in each submission contains a config JSON file that defines the parameters for the assignment, so that's a good place to start.

## Getting Help

Once again, it is HIGHLY recommended you set up all the required support files and do a test run with the grader BEFORE releasing an assignment to students. It is much easier to fix issues at this stage, not only because you haven't yet sent a potentially problematic file out to students, but also because you have to be much more careful about FERPA when dealing with already submitted files.

If there is an issue, immediately create a backup of the submissions folder and export the submissions you've already finished grading, so you don't lose any data. Then, enable the developer tools console from the settings of home page. If you can't pinpoint the issue between looking at the console errors and the source code, build the grader using the instructions given under 'Installing IGT'. If it's an issue with the grader itself, open an issue and/or make a pull request to fix it.

If all else, fails, send me an email, but be very careful about what information you include - I cannot take responsiblity for the information you choose to send me.

If you want a feature added to the grader, feel free to request one through GitHub or send me an email. You can also add it yourself and open a pull request.

## Old versions

IGT is based on WWAAAGT, (Wildly Wonderful and Amazingly Awesome Grading Tool) built by me for grading CS 1332 code at Georgia Tech. Note that the jar code is partially based on code written by Siddu Duddikunta <siddu@siddu.me> for the even older CS 1332 grading tool.

IGT is managed under a new repository and in an effort to be more generic has removed any CS 1332 specific features from the grader code. If you need to use any of these features, they can very easily be recreated within the grader config file.
