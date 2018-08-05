import unittest
import ciunittest
import json
import test_class_wrapper
import sys

class HijackedStdout:
    """Hijacked stdout."""

    captured_output = []

    def write(self, x):
        """Write function overloaded."""
        self.captured_output.append(x)

    def get_value(self):
        return ''.join(self.captured_output)

hijacked_output = HijackedStdout()
sys.stdout = hijacked_output

suite = unittest.TestLoader().loadTestsFromTestCase(test_class_wrapper.test_class)
test_runner_result = (json.loads(ciunittest.JsonTestRunner().run(suite, formatted=True)))['results']

failure_output = []
failures = []
failure_count = 0
for test in test_runner_result:
    if test['type'] != 'success':
        failures.append(
            test['name']
        )
        failure_count = failure_count + 1
        failure_output.append(str(failure_count) + ') ' + test['name'] + '\n')
        for line in test['errorTracebackLines']:
            failure_output.append(line + '\n\t')
        failure_output.append('\n\n')

testResults = {}
testResults['failureOutput'] = ''.join(failure_output),
testResults['printedOutput'] = str(hijacked_output.get_value()),
testResults['failures'] = failures
result = {}
result['tests'] = testResults


# restore stdout so we can really print (__stdout__ stores the original stdout)
sys.stdout = sys.__stdout__

print(json.dumps(result))

sys.exit(0)
