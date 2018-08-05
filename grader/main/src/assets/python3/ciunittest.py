import time
import unittest
import json
import traceback


class TestResult:
    pass


class Success(TestResult):
    def __str__(self):
        return "success"


class Error(TestResult):
    def __str__(self):
        return "error"


class Failure(TestResult):
    def __str__(self):
        return "failure"


class _TextTestResult(unittest.TestResult):
    r"""
    A test result class that contains a structure remembering the results
    of a unit test.

    Used by JsonTestRunner.
    """

    def __init__(self, on_start, on_end):
        unittest.TestResult.__init__(self)
        self._on_start = on_start
        self._on_end = on_end
        self.results = []

    def getDescription(self, test):
        r"""
        Retrieve the description of a test, if any.
        """
        return test.shortDescription()

    def startTest(self, test):
        r"""
        Start a test after recording the start time.
        """
        self._on_start(test)
        test.startTime = time.time()
        unittest.TestResult.startTest(self, test)

    def addSuccess(self, test):
        r"""
        Add an object describing a passed test.
        """
        self._stop_timer(test)
        self._on_end(test, Success())
        unittest.TestResult.addSuccess(self, test)
        self.results.append({
            'type': str(Success()),
            'name': str(test).split(' ')[0],
        })

    def _addErrorOrFailure(self, parent, test, err, resultType):
        r"""
        Add an object describing a test resulted in an error or a failure.
        """
        self._stop_timer(test)
        self._on_end(test, resultType)

        parent(self, test, err)

        errorType, errorBody, errorTraceback = err
        rawTraceback = traceback.extract_tb(errorTraceback)
        tracebackLines = list(
            map(lambda c: 'File "' + str(c[0]) + '", line ' + str(c[1]) + ' in ' + str(c[2]) + '\n' + str(c[3]),
                rawTraceback))
        tracebackLines.insert(0, str(errorBody))

        self.results.append({
            'type': str(resultType),
            'name': str(test).split(' ')[0],
            'errorTracebackLines': tracebackLines
        })

    def _stop_timer(self, test):
        test.endTime = time.time()
        test.elapsedTime = round(test.endTime - test.startTime, 5)

    def addError(self, test, err):
        r"""
        Add an object describing a test resulted in an error.
        """
        parent = unittest.TestResult.addError
        self._addErrorOrFailure(parent, test, err, Error())

    def addFailure(self, test, err):
        r"""
        Add an object describing a test resulted in a failure.
        """
        parent = unittest.TestResult.addFailure
        self._addErrorOrFailure(parent, test, err, Failure())


class _TestRunner:
    def __init__(self):
        self._on_start = lambda test: None
        self._on_end = lambda test, resultType: None

    @property
    def on_start(self):
        return self._on_start

    @on_start.setter
    def on_start(self, value):
        self._on_start = value

    @property
    def on_end(self):
        return self._on_end

    @on_end.setter
    def on_end(self, value):
        self._on_end = value

    def _run(self, tests):
        result = _TextTestResult(self._on_start, self._on_end)
        startTime = time.time()
        tests(result)
        stopTime = time.time()
        timeTaken = round(stopTime - startTime, 5)
        report = {
            'results': result.results,
            # 'spentMilliseconds': timeTaken
        }

        return report


class ObjectTestRunner(_TestRunner):
    """
    A test runner which displays the errors in a form of an object.
    """

    def run(self, tests):
        """
        Run the given test case or test suite.

        Example:
            suite = unittest.TestLoader().loadTestsFromTestCase(TestsDemo)
            result = ciunittest.JsonTestRunner().run_raw(suite)
            print('Done %d tests in %d ms.' %
                  (len(result['results']), result['spentMilliseconds']))

        :param suite: The test case or test suite to run.
        :returns: The dict detailing the result of the test case or test suite.
        """
        return self._run(tests)


class JsonTestRunner(_TestRunner):
    """
    A test runner which displays the errors in a JSON format.
    """

    def run(self, tests, formatted=False):
        """
        Run the given test case or test suite and format the response as JSON.

        Example:
            suite = unittest.TestLoader().loadTestsFromTestCase(TestsDemo)
            json = ciunittest.JsonTestRunner().run(suite, formatted=True)
            print(json)

        :param suite: The test case or test suite to run.
        :returns: The JSON detailing the result of the test case or test suite.
        """
        obj = self._run(tests)
        return json.dumps(obj, indent=4 if formatted else None)
